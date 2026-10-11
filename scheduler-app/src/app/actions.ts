"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hashEnrollmentToken, createEnrollmentToken, addDays, isInvitationUsable } from "@/lib/enrollment";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdministrator) throw new Error("Administrator access required");
  return session.user.id;
}

async function requireAccount() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Account access required");
  return session.user.id;
}

async function audit(actorId: string, entityType: string, entityId: string, action: string, summary: string, metadata?: object) {
  await prisma.auditEvent.create({ data: { actorId, entityType, entityId, action, summary, metadata } });
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function minutesFromTime(value: FormDataEntryValue | null) {
  const text = optionalText(value);
  if (!text) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text);
  if (!match) throw new Error("Availability time must use HH:MM format");
  return Number(match[1]) * 60 + Number(match[2]);
}

async function assertManagedProfile(accountId: string, profileId: string) {
  const profile = await prisma.serverProfile.findFirst({
    where: {
      id: profileId,
      OR: [
        { kind: "ADULT", accountId },
        { kind: "MINOR", managerId: accountId },
      ],
    },
  });
  if (!profile) throw new Error("You can only manage availability for your own household");
  return profile;
}

export async function createProfile(formData: FormData) {
  const actorId = await requireAdmin();
  const data = z.object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    dateOfBirth: z.coerce.date(),
    kind: z.enum(["ADULT", "MINOR"]),
    managerId: z.string().optional(),
    accountId: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  if (data.kind === "MINOR" && !data.managerId) throw new Error("A minor must have a managing adult");
  const profile = await prisma.serverProfile.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      kind: data.kind,
      managerId: data.kind === "MINOR" ? data.managerId : undefined,
      accountId: data.kind === "ADULT" && data.accountId ? data.accountId : undefined,
    },
  });
  await audit(actorId, "ServerProfile", profile.id, "create", `Created ${profile.firstName} ${profile.lastName}`);
  revalidatePath("/admin");
  revalidatePath("/admin/servers");
}

export async function updateOwnAccountContact(formData: FormData) {
  const accountId = await requireAccount();
  const data = z.object({
    displayName: z.string().trim().min(1),
    phonePrimary: z.string().trim().max(40).optional(),
    phoneSecondary: z.string().trim().max(40).optional(),
  }).parse(Object.fromEntries(formData));
  const account = await prisma.userAccount.update({
    where: { id: accountId },
    data: {
      displayName: data.displayName,
      phonePrimary: optionalText(formData.get("phonePrimary")),
      phoneSecondary: optionalText(formData.get("phoneSecondary")),
    },
  });
  await audit(accountId, "UserAccount", account.id, "contact", "Updated own contact details");
  revalidatePath("/");
  revalidatePath("/account");
}

export async function updateAvailabilityRule(formData: FormData) {
  const accountId = await requireAccount();
  const data = z.object({
    profileId: z.string().min(1),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    isAvailable: z.enum(["true", "false"]),
  }).parse(Object.fromEntries(formData));
  await assertManagedProfile(accountId, data.profileId);
  const fromMinutes = minutesFromTime(formData.get("availableFrom"));
  const untilMinutes = minutesFromTime(formData.get("availableUntil"));
  if (fromMinutes !== null && untilMinutes !== null && untilMinutes <= fromMinutes) throw new Error("Availability end time must be after start time");
  const rule = await prisma.availabilityRule.upsert({
    where: { profileId_dayOfWeek: { profileId: data.profileId, dayOfWeek: data.dayOfWeek } },
    update: {
      isAvailable: data.isAvailable === "true",
      availableFromMinutes: data.isAvailable === "true" ? fromMinutes : null,
      availableUntilMinutes: data.isAvailable === "true" ? untilMinutes : null,
    },
    create: {
      profileId: data.profileId,
      dayOfWeek: data.dayOfWeek,
      isAvailable: data.isAvailable === "true",
      availableFromMinutes: data.isAvailable === "true" ? fromMinutes : null,
      availableUntilMinutes: data.isAvailable === "true" ? untilMinutes : null,
    },
  });
  await audit(accountId, "AvailabilityRule", rule.id, "upsert", "Updated recurring availability");
  revalidatePath("/account");
}

export async function createAvailabilityOverride(_previousState: { message: string; success: boolean }, formData: FormData) {
  const accountId = await requireAccount();
  const data = z.object({
    profileId: z.string().min(1),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    isAvailable: z.enum(["true", "false"]),
    reason: z.string().trim().max(300).optional(),
  }).safeParse(Object.fromEntries(formData));
  if (!data.success) return { message: "Enter valid start and end dates and a note of at most 300 characters.", success: false };
  if (data.data.endsAt < data.data.startsAt) return { message: "End date must be on or after the start date.", success: false };
  const values = data.data;
  await assertManagedProfile(accountId, values.profileId);
  const override = await prisma.availabilityOverride.create({
    data: {
      profileId: values.profileId,
      startsAt: values.startsAt,
      endsAt: values.endsAt,
      isAvailable: values.isAvailable === "true",
      reason: optionalText(formData.get("reason")),
      createdById: accountId,
    },
  });
  await audit(accountId, "AvailabilityOverride", override.id, "create", "Created availability override");
  revalidatePath("/account");
  return { message: "Availability override added.", success: true };
}

export async function deleteAvailabilityOverride(formData: FormData) {
  const accountId = await requireAccount();
  const overrideId = z.string().min(1).parse(formData.get("overrideId"));
  const override = await prisma.availabilityOverride.findFirst({ where: { id: overrideId, createdById: accountId } });
  if (!override) throw new Error("Availability override not found");
  await assertManagedProfile(accountId, override.profileId);
  await prisma.availabilityOverride.delete({ where: { id: override.id } });
  await audit(accountId, "AvailabilityOverride", override.id, "delete", "Deleted availability override");
  revalidatePath("/account");
}

export async function updateUserAccountContact(formData: FormData) {
  const actorId = await requireAdmin();
  const data = z.object({
    accountId: z.string().min(1),
    profileId: z.string().min(1).optional(),
    displayName: z.string().trim().min(1).optional(),
    administratorValue: z.enum(["true", "false"]).optional(),
    phonePrimary: z.string().trim().max(40).optional(),
    phoneSecondary: z.string().trim().max(40).optional(),
  }).parse(Object.fromEntries(formData));
  const account = await prisma.userAccount.update({
    where: { id: data.accountId },
    data: {
      ...(data.displayName ? { displayName: data.displayName } : {}),
      ...(data.administratorValue ? { isAdministrator: data.administratorValue === "true" } : {}),
      phonePrimary: optionalText(formData.get("phonePrimary")),
      phoneSecondary: optionalText(formData.get("phoneSecondary")),
    },
  });
  await audit(actorId, "UserAccount", account.id, "contact", `Updated contact details for ${account.displayName}`);
  revalidatePath("/admin");
  revalidatePath("/admin/accounts");
  revalidatePath(`/admin/accounts/${account.id}`);
  revalidatePath("/admin/servers");
  if (data.profileId) revalidatePath(`/admin/servers/${data.profileId}`);
}

export async function linkAdultProfileAccount(formData: FormData) {
  const actorId = await requireAdmin();
  const data = z.object({
    profileId: z.string().min(1),
    accountId: z.string().optional(),
    returnTo: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  const accountId = optionalText(formData.get("accountId"));
  const profile = await prisma.serverProfile.findUnique({ where: { id: data.profileId }, include: { account: true } });
  if (!profile) throw new Error("Server profile not found");
  if (profile.kind !== "ADULT") throw new Error("Only adult server profiles can be linked to user accounts");
  if (accountId) {
    const account = await prisma.userAccount.findUnique({ where: { id: accountId }, include: { adultProfile: true } });
    if (!account) throw new Error("User account not found");
    if (account.adultProfile && account.adultProfile.id !== profile.id) throw new Error("That user account is already linked to another adult server profile");
  }
  const updated = await prisma.serverProfile.update({ where: { id: profile.id }, data: { accountId } });
  await audit(actorId, "ServerProfile", updated.id, "account-link", accountId ? "Linked adult server profile to user account" : "Unlinked adult server profile from user account");
  revalidatePath("/admin");
  revalidatePath("/admin/accounts");
  if (profile.accountId) revalidatePath(`/admin/accounts/${profile.accountId}`);
  if (accountId) revalidatePath(`/admin/accounts/${accountId}`);
  revalidatePath("/admin/servers");
  revalidatePath(`/admin/servers/${profile.id}`);
  if (data.returnTo) redirect(data.returnTo);
}

export async function createEnrollmentInvitation(formData: FormData) {
  const actorId = await requireAdmin();
  const data = z.object({
    email: z.string().trim().email().transform((email) => email.toLowerCase()),
  }).parse(Object.fromEntries(formData));
  const token = createEnrollmentToken();
  const invitation = await prisma.enrollmentInvitation.create({
    data: {
      email: data.email,
      tokenHash: hashEnrollmentToken(token),
      createdById: actorId,
      expiresAt: addDays(new Date(), 14),
    },
  });
  await audit(actorId, "EnrollmentInvitation", invitation.id, "create", `Created enrollment invitation for ${data.email}`);
  revalidatePath("/admin/accounts");
  redirect(`/admin/accounts?created=${encodeURIComponent(token)}`);
}

export async function cancelEnrollmentInvitation(formData: FormData) {
  const actorId = await requireAdmin();
  const invitationId = z.string().min(1).parse(formData.get("invitationId"));
  const invitation = await prisma.enrollmentInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.usedAt) throw new Error("Used invitations cannot be cancelled");
  if (invitation.cancelledAt) return;
  await prisma.enrollmentInvitation.update({ where: { id: invitation.id }, data: { cancelledAt: new Date() } });
  await audit(actorId, "EnrollmentInvitation", invitation.id, "cancel", `Cancelled enrollment invitation for ${invitation.email}`);
  revalidatePath("/admin/accounts");
}

export async function acceptEnrollmentInvitation(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Sign in with the invited Google account before accepting this invitation");
  const data = z.object({
    token: z.string().min(1),
    phonePrimary: z.string().trim().max(40).optional(),
    phoneSecondary: z.string().trim().max(40).optional(),
  }).parse(Object.fromEntries(formData));
  const email = session.user.email.toLowerCase();
  const invitation = await prisma.enrollmentInvitation.findUnique({ where: { tokenHash: hashEnrollmentToken(data.token) } });
  if (!invitation || !isInvitationUsable(invitation)) throw new Error("Invitation is invalid or has expired");
  if (invitation.email.toLowerCase() !== email) throw new Error("This invitation belongs to a different email address");
  const authUser = await prisma.user.findUnique({ where: { email } });
  if (!authUser) throw new Error("Google sign-in record was not found");
  const account = await prisma.$transaction(async (tx) => {
    const userAccount = await tx.userAccount.upsert({
      where: { email },
      update: {
        displayName: session.user.name || email,
        authUserId: authUser.id,
        phonePrimary: optionalText(formData.get("phonePrimary")),
        phoneSecondary: optionalText(formData.get("phoneSecondary")),
      },
      create: {
        email,
        displayName: session.user.name || email,
        authUserId: authUser.id,
        phonePrimary: optionalText(formData.get("phonePrimary")),
        phoneSecondary: optionalText(formData.get("phoneSecondary")),
      },
    });
    await tx.enrollmentInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date(), usedById: userAccount.id },
    });
    await tx.auditEvent.create({
      data: {
        actorId: userAccount.id,
        entityType: "EnrollmentInvitation",
        entityId: invitation.id,
        action: "accept",
        summary: `Accepted enrollment invitation for ${email}`,
      },
    });
    return userAccount;
  });
  revalidatePath("/");
  revalidatePath("/admin/accounts");
  if (account.isAdministrator) revalidatePath("/admin");
  redirect("/");
}

export async function createRota(formData: FormData) {
  const actorId = await requireAdmin();
  const data = z.object({ name: z.string().trim().min(1), startDate: z.coerce.date(), endDate: z.coerce.date() }).parse(Object.fromEntries(formData));
  if (data.endDate < data.startDate) throw new Error("End date must not precede start date");
  const rota = await prisma.rota.create({ data: { ...data, createdById: actorId } });
  await audit(actorId, "Rota", rota.id, "create", `Created rota ${rota.name}`);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
}

export async function grantQualification(formData: FormData) {
  const actorId = await requireAdmin();
  const data = z.object({ profileId: z.string().min(1), roleId: z.string().min(1) }).parse(Object.fromEntries(formData));
  const qualification = await prisma.roleQualification.upsert({
    where: { profileId_roleId: data },
    update: { grantedById: actorId },
    create: { ...data, grantedById: actorId },
  });
  await audit(actorId, "RoleQualification", qualification.id, "grant", "Granted role qualification");
  revalidatePath("/admin");
  revalidatePath("/admin/servers");
  revalidatePath(`/admin/servers/${data.profileId}`);
}

export async function revokeQualification(formData: FormData) {
  const actorId = await requireAdmin();
  const data = z.object({ qualificationId: z.string().min(1), profileId: z.string().min(1) }).parse(Object.fromEntries(formData));
  const qualification = await prisma.roleQualification.findFirst({ where: { id: data.qualificationId, profileId: data.profileId }, include: { role: true } });
  if (!qualification) throw new Error("Qualification not found for this server profile");
  await prisma.roleQualification.delete({ where: { id: qualification.id } });
  await audit(actorId, "RoleQualification", qualification.id, "revoke", `Revoked ${qualification.role.name} qualification`);
  revalidatePath("/admin");
  revalidatePath("/admin/servers");
  revalidatePath(`/admin/servers/${data.profileId}`);
}

export async function updateProfileStatus(formData: FormData) {
  const actorId = await requireAdmin();
  const data = z.object({ profileId: z.string().min(1), status: z.enum(["ACTIVE", "INACTIVE"]) }).parse(Object.fromEntries(formData));
  const profile = await prisma.serverProfile.update({ where: { id: data.profileId }, data: { status: data.status } });
  await audit(actorId, "ServerProfile", profile.id, "status", `Set ${profile.firstName} ${profile.lastName} to ${profile.status.toLowerCase()}`);
  revalidatePath("/admin");
  revalidatePath("/admin/servers");
  revalidatePath(`/admin/servers/${data.profileId}`);
}

export async function createServiceFromTemplate(formData: FormData) {
  const actorId = await requireAdmin();
  const data = z.object({ rotaId: z.string().min(1), templateId: z.string().min(1), startsAt: z.coerce.date(), name: z.string().trim().min(1) }).parse(Object.fromEntries(formData));
  const template = await prisma.serviceTemplate.findUnique({ where: { id: data.templateId }, include: { requirements: { orderBy: { displayOrder: "asc" } } } });
  if (!template) throw new Error("Template not found");
  const service = await prisma.$transaction(async (tx) => {
    const created = await tx.service.create({ data: { rotaId: data.rotaId, templateId: template.id, startsAt: data.startsAt, name: data.name } });
    for (const requirement of template.requirements) {
      const createdRequirement = await tx.positionRequirement.create({ data: { serviceId: created.id, roleId: requirement.roleId, requiredCount: requirement.requiredCount, displayOrder: requirement.displayOrder } });
      await tx.positionSlot.createMany({ data: Array.from({ length: requirement.requiredCount }, (_, index) => ({ serviceId: created.id, requirementId: createdRequirement.id, slotNumber: index + 1 })) });
    }
    return created;
  });
  await audit(actorId, "Service", service.id, "create", `Created service ${service.name} from ${template.name}`);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
}

export async function assignProfile(formData: FormData) {
  const actorId = await requireAdmin();
  const data = z.object({ slotId: z.string().min(1), profileId: z.string().min(1) }).parse(Object.fromEntries(formData));
  const result = await prisma.$transaction(async (tx) => {
    const slot = await tx.positionSlot.findUnique({ where: { id: data.slotId }, include: { service: true, requirement: true, assignment: true } });
    if (!slot) throw new Error("Slot not found");
    const profile = await tx.serverProfile.findUnique({ where: { id: data.profileId }, include: { qualifications: true } });
    if (!profile || profile.status !== "ACTIVE") throw new Error("Profile is not active");
    if (!profile.qualifications.some((qualification) => qualification.roleId === slot.requirement.roleId)) throw new Error("Profile is not qualified for this role");
    const duplicate = await tx.assignment.findFirst({ where: { profileId: profile.id, slot: { serviceId: slot.serviceId }, slotId: { not: slot.id } } });
    if (duplicate) throw new Error("Profile is already assigned to this service");
    await tx.positionSlot.update({ where: { id: slot.id }, data: { state: "ASSIGNED" } });
    const assignment = await tx.assignment.upsert({ where: { slotId: slot.id }, update: { profileId: profile.id, assignedById: actorId }, create: { slotId: slot.id, profileId: profile.id, assignedById: actorId } });
    return { assignment, slotHadAssignment: Boolean(slot.assignment), previousProfileId: slot.assignment?.profileId, serviceId: slot.serviceId };
  });
  await audit(actorId, "Assignment", result.assignment.id, result.slotHadAssignment ? "update" : "create", result.slotHadAssignment ? "Changed server assignment" : "Assigned server profile to position slot");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath(`/admin/services/${result.serviceId}`);
  revalidatePath(`/admin/servers/${data.profileId}`);
  if (result.previousProfileId) revalidatePath(`/admin/servers/${result.previousProfileId}`);
}

export async function clearAssignment(formData: FormData) {
  const actorId = await requireAdmin();
  const slotId = z.string().min(1).parse(formData.get("slotId"));
  const slot = await prisma.positionSlot.findUnique({ where: { id: slotId }, include: { assignment: true, service: true } });
  if (!slot?.assignment) throw new Error("Assignment not found");
  await prisma.$transaction([
    prisma.assignment.delete({ where: { id: slot.assignment.id } }),
    prisma.positionSlot.update({ where: { id: slot.id }, data: { state: "OPEN" } }),
  ]);
  await audit(actorId, "Assignment", slot.assignment.id, "delete", "Cleared server assignment from position slot");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath(`/admin/services/${slot.serviceId}`);
  revalidatePath(`/admin/servers/${slot.assignment.profileId}`);
}

export async function publishRota(formData: FormData) {
  const actorId = await requireAdmin();
  const rotaId = z.string().parse(formData.get("rotaId"));
  const rota = await prisma.rota.update({ where: { id: rotaId }, data: { state: "PUBLISHED", publishedById: actorId, publishedAt: new Date() } });
  await audit(actorId, "Rota", rota.id, "publish", `Published rota ${rota.name}`);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
}
