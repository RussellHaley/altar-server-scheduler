CREATE TYPE "InvitationType" AS ENUM ('NEW_ADULT_ACCOUNT', 'MINOR_MATURATION');

CREATE TABLE "EnrollmentInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitationType" "InvitationType" NOT NULL DEFAULT 'NEW_ADULT_ACCOUNT',
    "targetProfileId" TEXT,
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnrollmentInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EnrollmentInvitation_tokenHash_key" ON "EnrollmentInvitation"("tokenHash");
CREATE INDEX "EnrollmentInvitation_email_idx" ON "EnrollmentInvitation"("email");
CREATE INDEX "EnrollmentInvitation_expiresAt_idx" ON "EnrollmentInvitation"("expiresAt");

ALTER TABLE "EnrollmentInvitation" ADD CONSTRAINT "EnrollmentInvitation_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES "ServerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EnrollmentInvitation" ADD CONSTRAINT "EnrollmentInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EnrollmentInvitation" ADD CONSTRAINT "EnrollmentInvitation_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
