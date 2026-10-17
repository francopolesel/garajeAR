-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'es',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "distanceUnit" TEXT NOT NULL DEFAULT 'KM',
    "volumeUnit" TEXT NOT NULL DEFAULT 'L',
    "timeZone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "theme" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "modelYear" INTEGER NOT NULL,
    "trim" TEXT,
    "vin" TEXT,
    "registrationNumber" TEXT,
    "engine" TEXT,
    "displacement" DOUBLE PRECISION,
    "transmission" TEXT,
    "powertrain" TEXT,
    "bodyStyle" TEXT,
    "color" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(14,2),
    "purchaseCurrency" TEXT,
    "currentOdometer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "odometerUnit" TEXT NOT NULL DEFAULT 'KM',
    "photoUrl" TEXT,
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdometerReading" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdometerReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "odometer" DOUBLE PRECISION,
    "odometerUnit" TEXT,
    "workshop" TEXT,
    "partsCost" DECIMAL(14,2),
    "laborCost" DECIMAL(14,2),
    "totalCost" DECIMAL(14,2),
    "currency" TEXT,
    "partsNotes" TEXT,
    "notes" TEXT,
    "nextDueDate" TIMESTAMP(3),
    "nextDueOdometer" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "subtype" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "quantityUnit" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "odometer" DOUBLE PRECISION,
    "odometerUnit" TEXT,
    "totalCost" DECIMAL(14,2),
    "currency" TEXT,
    "fullTank" BOOLEAN NOT NULL DEFAULT false,
    "station" TEXT,
    "chargingType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnergyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT,
    "odometer" DOUBLE PRECISION,
    "notes" TEXT,
    "receiptDocumentId" TEXT,
    "maintenanceRecordId" TEXT,
    "energyLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueOdometer" DOUBLE PRECISION,
    "dueOdometerUnit" TEXT,
    "daysBefore" INTEGER NOT NULL DEFAULT 7,
    "distanceBefore" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

-- CreateIndex
CREATE INDEX "Vehicle_userId_archived_idx" ON "Vehicle"("userId", "archived");

-- CreateIndex
CREATE INDEX "OdometerReading_userId_idx" ON "OdometerReading"("userId");

-- CreateIndex
CREATE INDEX "OdometerReading_vehicleId_idx" ON "OdometerReading"("vehicleId");

-- CreateIndex
CREATE INDEX "OdometerReading_vehicleId_observedAt_idx" ON "OdometerReading"("vehicleId", "observedAt");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_userId_idx" ON "MaintenanceRecord"("userId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_vehicleId_idx" ON "MaintenanceRecord"("vehicleId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_serviceDate_idx" ON "MaintenanceRecord"("serviceDate");

-- CreateIndex
CREATE INDEX "EnergyLog_userId_idx" ON "EnergyLog"("userId");

-- CreateIndex
CREATE INDEX "EnergyLog_vehicleId_idx" ON "EnergyLog"("vehicleId");

-- CreateIndex
CREATE INDEX "EnergyLog_eventDate_idx" ON "EnergyLog"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_maintenanceRecordId_key" ON "Expense"("maintenanceRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_energyLogId_key" ON "Expense"("energyLogId");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "Expense_vehicleId_idx" ON "Expense"("vehicleId");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Reminder_userId_idx" ON "Reminder"("userId");

-- CreateIndex
CREATE INDEX "Reminder_vehicleId_idx" ON "Reminder"("vehicleId");

-- CreateIndex
CREATE INDEX "Reminder_dueDate_idx" ON "Reminder"("dueDate");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Document_vehicleId_idx" ON "Document"("vehicleId");

-- CreateIndex
CREATE INDEX "Document_expirationDate_idx" ON "Document"("expirationDate");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdometerReading" ADD CONSTRAINT "OdometerReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdometerReading" ADD CONSTRAINT "OdometerReading_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnergyLog" ADD CONSTRAINT "EnergyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnergyLog" ADD CONSTRAINT "EnergyLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "MaintenanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_energyLogId_fkey" FOREIGN KEY ("energyLogId") REFERENCES "EnergyLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
