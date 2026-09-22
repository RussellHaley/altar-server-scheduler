-- Initial scheduler domain schema.
CREATE TYPE "ProfileStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ProfileKind" AS ENUM ('ADULT', 'MINOR');
CREATE TYPE "RotaState" AS ENUM ('DRAFT', 'GENERATED', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED', 'CANCELLED', 'REPLACED');
CREATE TYPE "SlotState" AS ENUM ('OPEN', 'REQUESTED', 'ASSIGNED', 'DECLINED', 'CANCELLED');

CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isAdministrator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServerProfile" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "kind" "ProfileKind" NOT NULL,
    "status" "ProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "accountId" TEXT,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoleQualification" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "notes" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoleQualification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rota" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "state" "RotaState" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Rota_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "rotaId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "liturgicalColor" TEXT,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PositionRequirement" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "requiredCount" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    CONSTRAINT "PositionRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PositionSlot" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "state" "SlotState" NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "PositionSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");
CREATE UNIQUE INDEX "ServerProfile_accountId_key" ON "ServerProfile"("accountId");
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Role_abbreviation_key" ON "Role"("abbreviation");
CREATE UNIQUE INDEX "RoleQualification_profileId_roleId_key" ON "RoleQualification"("profileId", "roleId");
CREATE UNIQUE INDEX "PositionSlot_requirementId_slotNumber_key" ON "PositionSlot"("requirementId", "slotNumber");
CREATE UNIQUE INDEX "Assignment_slotId_key" ON "Assignment"("slotId");
CREATE INDEX "ServerProfile_managerId_idx" ON "ServerProfile"("managerId");
CREATE INDEX "Service_startsAt_idx" ON "Service"("startsAt");
CREATE INDEX "PositionSlot_serviceId_state_idx" ON "PositionSlot"("serviceId", "state");

ALTER TABLE "ServerProfile" ADD CONSTRAINT "ServerProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServerProfile" ADD CONSTRAINT "ServerProfile_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoleQualification" ADD CONSTRAINT "RoleQualification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ServerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleQualification" ADD CONSTRAINT "RoleQualification_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoleQualification" ADD CONSTRAINT "RoleQualification_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "Rota"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PositionRequirement" ADD CONSTRAINT "PositionRequirement_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PositionRequirement" ADD CONSTRAINT "PositionRequirement_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PositionSlot" ADD CONSTRAINT "PositionSlot_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PositionSlot" ADD CONSTRAINT "PositionSlot_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "PositionRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "PositionSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ServerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
