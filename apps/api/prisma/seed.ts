import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { hashPassword } from "../src/lib/auth.js";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@garajear.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed already present, skipping");
    return;
  }
  const passwordHash = await hashPassword("Demo1234!");
  const user = await prisma.user.create({
    data: { name: "Demo User", email, passwordHash, locale: "es", currency: "USD", distanceUnit: "KM", volumeUnit: "L", timeZone: "America/Argentina/Buenos_Aires", theme: "SYSTEM" },
  });

  const car = await prisma.vehicle.create({
    data: { userId: user.id, type: "CAR", name: "Mi Auto", make: "Toyota", model: "Corolla", modelYear: 2020, powertrain: "PETROL", currentOdometer: 45000, odometerUnit: "KM", purchasePrice: 15000, purchaseCurrency: "USD" },
  });
  const moto = await prisma.vehicle.create({
    data: { userId: user.id, type: "MOTORCYCLE", name: "Mi Moto", make: "Honda", model: "CB500", modelYear: 2022, powertrain: "PETROL", currentOdometer: 12000, odometerUnit: "KM" },
  });

  await prisma.maintenanceRecord.create({
    data: { userId: user.id, vehicleId: car.id, category: "ENGINE_OIL", title: "Cambio de aceite", serviceDate: new Date("2024-06-01"), odometer: 44000, odometerUnit: "KM", totalCost: 80, currency: "USD", workshop: "Taller X" },
  });
  await prisma.expense.create({
    data: { userId: user.id, vehicleId: car.id, category: "MAINTENANCE", title: "Cambio de aceite", amount: 80, currency: "USD", expenseDate: new Date("2024-06-01") },
  });

  await prisma.energyLog.create({
    data: { userId: user.id, vehicleId: car.id, eventType: "FUEL_FILLUP", quantity: 40, quantityUnit: "L", eventDate: new Date("2024-06-15"), odometer: 44500, totalCost: 60, currency: "USD", fullTank: true },
  });
  await prisma.expense.create({
    data: { userId: user.id, vehicleId: car.id, category: "FUEL", title: "Fuel fill-up", amount: 60, currency: "USD", expenseDate: new Date("2024-06-15") },
  });

  await prisma.expense.create({
    data: { userId: user.id, vehicleId: car.id, category: "INSURANCE", title: "Seguro auto", amount: 300, currency: "USD", expenseDate: new Date("2024-01-01") },
  });
  await prisma.expense.create({
    data: { userId: user.id, vehicleId: moto.id, category: "FUEL", title: "Combustible moto", amount: 15, currency: "USD", expenseDate: new Date("2024-07-01") },
  });

  await prisma.reminder.create({
    data: { userId: user.id, vehicleId: car.id, category: "INSURANCE", title: "Vencimiento seguro", dueDate: new Date(Date.now() + 10 * 86400000), daysBefore: 7 },
  });
  await prisma.reminder.create({
    data: { userId: user.id, vehicleId: car.id, category: "INSPECTION", title: "VTV vencida", dueDate: new Date(Date.now() - 5 * 86400000), daysBefore: 7 },
  });

  await prisma.document.create({
    data: { userId: user.id, vehicleId: car.id, name: "Seguro.pdf", category: "INSURANCE", storageKey: "seed.pdf", originalName: "seguro.pdf", mimeType: "application/pdf", size: 1000, expirationDate: new Date(Date.now() + 20 * 86400000) },
  });

  console.log("Seed complete. Demo login: demo@garajear.local / Demo1234!");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
