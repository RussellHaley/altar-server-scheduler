import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Prisma, PrismaClient, RotaState } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

const calendarServiceSchema = z.object({
  id: z.string().min(1),
  date: z.iso.date(),
  weekday: z.string().min(1),
  local_time: z.string().regex(TIME),
  local_datetime: z.string().regex(LOCAL_DATETIME),
  time_zone: z.string().min(1),
  title: z.string().min(1),
  form: z.string().min(1),
  template_key: z.string().min(1),
  liturgical_title: z.string().nullable().optional(),
  liturgical_symbol: z.string().nullable().optional(),
  rank: z.string().nullable().optional(),
  rank_description: z.string().nullable().optional(),
  colour: z.string().nullable().optional(),
  colour_name: z.string().nullable().optional(),
  cotta_style: z.string().nullable().optional(),
  source_rule: z.string().min(1),
  source_schedule: z.string().min(1),
  applied_overrides: z.array(z.string()),
  notes: z.array(z.string()),
});

const calendarSchema = z.object({
  schema_version: z.literal(1),
  schedule: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    time_zone: z.string().min(1),
    layers: z.array(z.string()),
    source_files: z.array(z.string()),
  }),
  ordo: z.object({
    source: z.literal("calendarium-anglicum"),
    profile_id: z.string().min(1),
    profile_name: z.string().min(1),
    liturgical_year: z.number().int(),
    from: z.iso.date(),
    to: z.iso.date(),
  }),
  from: z.iso.date(),
  to: z.iso.date(),
  services: z.array(calendarServiceSchema).min(1),
});

type CalendarDocument = z.infer<typeof calendarSchema>;
type CalendarService = z.infer<typeof calendarServiceSchema>;

function usage(): never {
  console.error("Usage: npm run calendar:import -- PATH/TO/SCHEDULE.json [--dry-run]");
  process.exit(1);
}

function parseArguments() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const paths = args.filter((argument) => argument !== "--dry-run");
  if (paths.length !== 1) usage();
  return { path: paths[0] === "-" ? "-" : resolve(paths[0]), dryRun };
}

function readStandardInput(): Promise<string> {
  return new Promise((resolveInput, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => { input += chunk; });
    process.stdin.on("end", () => resolveInput(input));
    process.stdin.on("error", reject);
  });
}

function sourceMetadata(document: CalendarDocument): Prisma.InputJsonValue {
  return {
    calendarSource: document.ordo.source,
    schemaVersion: document.schema_version,
    schedule: document.schedule,
    ordo: document.ordo,
  };
}

function serviceMetadata(service: CalendarService): Prisma.InputJsonValue {
  return {
    timeZone: service.time_zone,
    templateKey: service.template_key,
    sourceRule: service.source_rule,
    sourceSchedule: service.source_schedule,
    appliedOverrides: service.applied_overrides,
    notes: service.notes,
  };
}

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    year: Number(values.year), month: Number(values.month), day: Number(values.day),
    hour: Number(values.hour), minute: Number(values.minute), second: Number(values.second),
  };
}

// DateTime is stored in PostgreSQL as an instant. This conversion deliberately
// uses the IANA time zone supplied by the calendar rather than the container's
// UTC clock, including Pacific daylight-saving offsets.
function zonedLocalDateTimeToUtc(value: string, timeZone: string): Date {
  const matched = LOCAL_DATETIME.exec(value);
  if (!matched) throw new Error(`Invalid local datetime ${value}`);
  const [, year, month, day, hour, minute, second] = matched;
  const wallClock = [Number(year), Number(month), Number(day), Number(hour), Number(minute), Number(second)];
  const assumedUtc = Date.UTC(
    wallClock[0], wallClock[1] - 1, wallClock[2], wallClock[3], wallClock[4], wallClock[5],
  );
  const observed = getZonedParts(new Date(assumedUtc), timeZone);
  const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second);
  const instant = new Date(assumedUtc - (observedAsUtc - assumedUtc));
  const verified = getZonedParts(instant, timeZone);

  if (wallClock.some((part, index) => part !== [verified.year, verified.month, verified.day, verified.hour, verified.minute, verified.second][index])) {
    throw new Error(`${value} is not an unambiguous valid time in ${timeZone}`);
  }
  return instant;
}

function calendarDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function serviceName(service: CalendarService) {
  return service.liturgical_title ? `${service.liturgical_title} — ${service.title}` : service.title;
}

function serviceDescription(service: CalendarService) {
  const parts = [service.rank_description, service.cotta_style ? `Cotta: ${service.cotta_style}` : undefined];
  if (service.applied_overrides.length) parts.push(`Overrides: ${service.applied_overrides.join(", ")}`);
  if (service.notes.length) parts.push(`Notes: ${service.notes.join("; ")}`);
  return parts.filter(Boolean).join(" · ") || null;
}

function validateDocument(document: CalendarDocument) {
  if (document.from !== document.ordo.from || document.to !== document.ordo.to) {
    throw new Error("Calendar document and Ordo date ranges do not agree");
  }

  const serviceIds = new Set<string>();
  const dateTimes = new Set<string>();
  for (const service of document.services) {
    if (serviceIds.has(service.id)) throw new Error(`Duplicate calendar service id ${service.id}`);
    serviceIds.add(service.id);
    const dateTime = `${service.date}T${service.local_time}`;
    if (dateTimes.has(dateTime)) throw new Error(`More than one calendar service occurs at ${dateTime}`);
    dateTimes.add(dateTime);
    if (service.local_datetime !== `${dateTime}:00`) {
      throw new Error(`Service ${service.id} has inconsistent date, time, and local_datetime`);
    }
    if (service.time_zone !== document.schedule.time_zone) {
      throw new Error(`Service ${service.id} has time zone ${service.time_zone}, expected ${document.schedule.time_zone}`);
    }
    zonedLocalDateTimeToUtc(service.local_datetime, service.time_zone);
  }
}

async function importCalendar(document: CalendarDocument, dryRun: boolean) {
  validateDocument(document);
  const templateKeys = [...new Set(document.services.map((service) => service.template_key))];
  const templates = await prisma.serviceTemplate.findMany({
    where: { key: { in: templateKeys }, isActive: true },
    include: { requirements: { orderBy: { displayOrder: "asc" } } },
  });
  const templatesByKey = new Map(templates.flatMap((template) => template.key ? [[template.key, template]] : []));
  const missingTemplates = templateKeys.filter((key) => !templatesByKey.has(key));
  if (missingTemplates.length) {
    throw new Error(`Missing active service templates for: ${missingTemplates.join(", ")}. Run npm run db:seed after applying migrations.`);
  }

  const existing = await prisma.rota.findUnique({
    where: { sourceId: document.schedule.id },
    include: { services: { include: { slots: { include: { assignment: true } } } } },
  });
  const importableStates: RotaState[] = [RotaState.DRAFT, RotaState.GENERATED];
  if (existing && !importableStates.includes(existing.state)) {
    throw new Error(`Rota ${existing.name} is ${existing.state}; imports may only replace DRAFT or GENERATED rotas`);
  }
  const importedServices = existing?.services.filter((service) => service.sourceId) ?? [];
  if (importedServices.some((service) => service.slots.some((slot) => slot.assignment))) {
    throw new Error("The existing imported rota has assignments. Do not replace an assigned calendar import.");
  }

  const summary = `${existing ? "Re-import" : "Import"} ${document.schedule.name}: ${document.services.length} services, ${templateKeys.length} templates`;
  if (dryRun) {
    console.log(`Dry run: ${summary}`);
    console.log(`Date range: ${document.from} to ${document.to}; time zone: ${document.schedule.time_zone}`);
    console.log(`Templates: ${templateKeys.join(", ")}`);
    return;
  }

  const rota = await prisma.$transaction(async (transaction) => {
    const data = {
      name: document.schedule.name,
      startDate: calendarDate(document.from),
      endDate: calendarDate(document.to),
      state: RotaState.GENERATED,
      sourceId: document.schedule.id,
      sourceMetadata: sourceMetadata(document),
    };
    const target = existing
      ? await transaction.rota.update({ where: { id: existing.id }, data })
      : await transaction.rota.create({ data });

    if (importedServices.length) {
      await transaction.service.deleteMany({ where: { id: { in: importedServices.map((service) => service.id) } } });
    }

    for (const source of document.services) {
      const template = templatesByKey.get(source.template_key);
      if (!template) throw new Error(`Template disappeared during import: ${source.template_key}`);
      const service = await transaction.service.create({
        data: {
          rotaId: target.id,
          startsAt: zonedLocalDateTimeToUtc(source.local_datetime, source.time_zone),
          name: serviceName(source),
          description: serviceDescription(source),
          liturgicalColor: source.colour ?? undefined,
          liturgicalTitle: source.liturgical_title ?? undefined,
          liturgicalSymbol: source.liturgical_symbol ?? undefined,
          liturgicalRank: source.rank ?? undefined,
          cottaStyle: source.cotta_style ?? undefined,
          serviceForm: source.form,
          sourceId: source.id,
          sourceMetadata: serviceMetadata(source),
          templateId: template.id,
        },
      });
      for (const requirement of template.requirements) {
        const created = await transaction.positionRequirement.create({
          data: {
            serviceId: service.id,
            roleId: requirement.roleId,
            requiredCount: requirement.requiredCount,
            displayOrder: requirement.displayOrder,
          },
        });
        await transaction.positionSlot.createMany({
          data: Array.from({ length: requirement.requiredCount }, (_, index) => ({
            serviceId: service.id,
            requirementId: created.id,
            slotNumber: index + 1,
          })),
        });
      }
    }

    await transaction.auditEvent.create({
      data: {
        entityType: "Rota",
        entityId: target.id,
        action: existing ? "calendar_reimport" : "calendar_import",
        summary,
        metadata: sourceMetadata(document),
      },
    });
    return target;
  });

  console.log(`${summary} completed as GENERATED rota ${rota.id}`);
}

async function main() {
  const { path, dryRun } = parseArguments();
  const input = path === "-" ? await readStandardInput() : await readFile(path, "utf8");
  const parsed = calendarSchema.parse(JSON.parse(input));
  await importCalendar(parsed, dryRun);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Calendar import failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
