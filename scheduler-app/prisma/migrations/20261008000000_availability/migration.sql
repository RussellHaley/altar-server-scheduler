CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableFromMinutes" INTEGER,
    "availableUntilMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilityOverride" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AvailabilityOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AvailabilityRule_profileId_dayOfWeek_key" ON "AvailabilityRule"("profileId", "dayOfWeek");
CREATE INDEX "AvailabilityRule_profileId_idx" ON "AvailabilityRule"("profileId");
CREATE INDEX "AvailabilityOverride_profileId_startsAt_idx" ON "AvailabilityOverride"("profileId", "startsAt");
CREATE INDEX "AvailabilityOverride_createdById_idx" ON "AvailabilityOverride"("createdById");

ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ServerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ServerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
