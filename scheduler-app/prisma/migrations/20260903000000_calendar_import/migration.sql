-- Calendar imports need stable source keys so a corrected Ordo can be safely
-- re-imported without duplicating a rota or its services.
ALTER TABLE "Rota" ADD COLUMN "sourceId" TEXT;
ALTER TABLE "Rota" ADD COLUMN "sourceMetadata" JSONB;

ALTER TABLE "ServiceTemplate" ADD COLUMN "key" TEXT;

ALTER TABLE "Service" ADD COLUMN "liturgicalTitle" TEXT;
ALTER TABLE "Service" ADD COLUMN "liturgicalSymbol" TEXT;
ALTER TABLE "Service" ADD COLUMN "liturgicalRank" TEXT;
ALTER TABLE "Service" ADD COLUMN "cottaStyle" TEXT;
ALTER TABLE "Service" ADD COLUMN "serviceForm" TEXT;
ALTER TABLE "Service" ADD COLUMN "sourceId" TEXT;
ALTER TABLE "Service" ADD COLUMN "sourceMetadata" JSONB;

CREATE UNIQUE INDEX "Rota_sourceId_key" ON "Rota"("sourceId");
CREATE UNIQUE INDEX "ServiceTemplate_key_key" ON "ServiceTemplate"("key");
CREATE UNIQUE INDEX "Service_sourceId_key" ON "Service"("sourceId");
