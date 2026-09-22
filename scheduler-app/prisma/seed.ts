import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  ["Celebrant", "CE"],
  ["Deacon", "DE"],
  ["Subdeacon", "SD"],
  ["Acolyte", "AC"],
  ["Thurifer", "TH"],
  ["Crucifer", "CR"],
  ["Master of Ceremonies", "MC"],
  ["Boat Bearer", "BB"],
  ["Torch Bearer", "TB"],
  ["Vimpe", "VI"],
] as const;

const templates = [
  {
    name: "Solemn High Mass",
    key: "solemn-high-mass",
    serviceType: "Mass",
    requirements: [["CE", 1], ["DE", 1], ["SD", 1], ["MC", 1], ["TH", 1], ["BB", 1], ["AC", 2], ["VI", 2], ["CR", 1], ["TB", 4]],
  },
  {
    name: "Sung Mass",
    key: "sung-mass",
    serviceType: "Mass",
    requirements: [["CE", 1], ["MC", 1], ["TH", 1], ["BB", 1], ["AC", 2], ["CR", 1], ["TB", 2]],
  },
  { name: "Daily Mass", key: "daily-mass", serviceType: "Mass", requirements: [["CE", 1], ["AC", 1]] },
  { name: "Low Mass", key: "low-mass", serviceType: "Mass", requirements: [["CE", 1], ["AC", 1]] },
  { name: "Solemn Mass", key: "solemn-mass", serviceType: "Mass", requirements: [["CE", 1], ["AC", 2]] },
  { name: "Requiem Mass", key: "requiem-mass", serviceType: "Mass", requirements: [["CE", 1], ["AC", 2], ["TH", 1], ["BB", 1], ["CR", 1], ["TB", 2]] },
] as const;

async function main() {
  const roleIds = new Map<string, string>();

  for (const [index, [name, abbreviation]] of roles.entries()) {
    const role = await prisma.role.upsert({
      where: { abbreviation },
      update: { name, displayOrder: index },
      create: { name, abbreviation, displayOrder: index },
    });
    roleIds.set(abbreviation, role.id);
  }

  for (const template of templates) {
    const saved = await prisma.serviceTemplate.upsert({
      where: { name: template.name },
      update: { key: template.key, defaultServiceType: template.serviceType, isActive: true },
      create: { name: template.name, key: template.key, defaultServiceType: template.serviceType },
    });

    for (const [displayOrder, [abbreviation, requiredCount]] of template.requirements.entries()) {
      const roleId = roleIds.get(abbreviation);
      if (!roleId) throw new Error(`Unknown starter role: ${abbreviation}`);
      await prisma.serviceTemplateRequirement.upsert({
        where: { templateId_roleId: { templateId: saved.id, roleId } },
        update: { abbreviation, requiredCount, displayOrder },
        create: { templateId: saved.id, roleId, abbreviation, requiredCount, displayOrder },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
