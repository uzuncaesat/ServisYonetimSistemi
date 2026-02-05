import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // UYARI: Production'da ADMIN_PASSWORD ve MANAGER_PASSWORD env ile güçlü şifre verin.
  // Varsayılan şifreler sadece geliştirme içindir - şirket kullanımında MUTLAKA değiştirin.
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const managerPassword = process.env.MANAGER_PASSWORD || "manager123";

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@uzhanerp.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@uzhanerp.com",
      password: hashedAdminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log("Admin user created:", admin.email, "with role:", admin.role);

  const hashedManagerPassword = await bcrypt.hash(managerPassword, 10);
  const manager = await prisma.user.upsert({
    where: { email: "yonetici@uzhanerp.com" },
    update: { role: "MANAGER" },
    create: {
      email: "yonetici@uzhanerp.com",
      password: hashedManagerPassword,
      name: "Yönetici",
      role: "MANAGER",
    },
  });
  console.log("Manager user created:", manager.email, "with role:", manager.role);

  // Create suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      firmaAdi: "ABC Taşımacılık",
      vergiNo: "1234567890",
      vergiDairesi: "Beyoğlu",
      telefon: "0212 555 1234",
      email: "info@abctasima.com",
      adres: "İstanbul, Beyoğlu",
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      firmaAdi: "XYZ Servis",
      vergiNo: "0987654321",
      vergiDairesi: "Kadıköy",
      telefon: "0216 444 5678",
      email: "info@xyzservis.com",
      adres: "İstanbul, Kadıköy",
    },
  });
  console.log("Suppliers created");

  // Create drivers
  const driver1 = await prisma.driver.create({
    data: {
      adSoyad: "Ahmet Yılmaz",
      telefon: "0532 111 2233",
      ehliyetSinifi: "D",
      email: "ahmet@email.com",
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      adSoyad: "Mehmet Demir",
      telefon: "0533 222 3344",
      ehliyetSinifi: "D",
      email: "mehmet@email.com",
    },
  });

  const driver3 = await prisma.driver.create({
    data: {
      adSoyad: "Ali Kaya",
      telefon: "0534 333 4455",
      ehliyetSinifi: "E",
      email: "ali@email.com",
    },
  });
  console.log("Drivers created");

  // Create vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      plaka: "34ABC001",
      marka: "Mercedes",
      model: "Sprinter",
      kisiSayisi: 16,
      supplierId: supplier1.id,
      driverId: driver1.id,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      plaka: "34ABC002",
      marka: "Ford",
      model: "Transit",
      kisiSayisi: 14,
      supplierId: supplier1.id,
      driverId: driver2.id,
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      plaka: "06XYZ003",
      marka: "Volkswagen",
      model: "Crafter",
      kisiSayisi: 18,
      supplierId: supplier2.id,
      driverId: driver3.id,
    },
  });
  console.log("Vehicles created");

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      ad: "Fabrika Servisi",
      aciklama: "Organize sanayi bölgesi personel taşımacılığı",
      baslangicTarihi: new Date("2026-01-01"),
      bitisTarihi: new Date("2026-12-31"),
    },
  });

  const project2 = await prisma.project.create({
    data: {
      ad: "Ofis Servisi",
      aciklama: "Merkez ofis personel taşımacılığı",
      baslangicTarihi: new Date("2026-01-01"),
      bitisTarihi: new Date("2026-12-31"),
    },
  });
  console.log("Projects created");

  // Create routes for project 1
  const route1 = await prisma.route.create({
    data: {
      projectId: project1.id,
      ad: "Fabrika - Kadıköy",
      baslangicNoktasi: "Tuzla OSB",
      bitisNoktasi: "Kadıköy",
      km: 35,
      birimFiyat: 150,      // Tedarikçi fiyatı
      fabrikaFiyati: 200,   // Fabrika fiyatı
      kdvOrani: 20,
    },
  });

  const route2 = await prisma.route.create({
    data: {
      projectId: project1.id,
      ad: "Fabrika - Kartal",
      baslangicNoktasi: "Tuzla OSB",
      bitisNoktasi: "Kartal",
      km: 20,
      birimFiyat: 100,      // Tedarikçi fiyatı
      fabrikaFiyati: 130,   // Fabrika fiyatı
      kdvOrani: 20,
    },
  });

  // Create routes for project 2
  const route3 = await prisma.route.create({
    data: {
      projectId: project2.id,
      ad: "Ofis - Beşiktaş",
      baslangicNoktasi: "Levent Plaza",
      bitisNoktasi: "Beşiktaş",
      km: 8,
      birimFiyat: 80,       // Tedarikçi fiyatı
      fabrikaFiyati: 110,   // Fabrika fiyatı
      kdvOrani: 20,
    },
  });

  const route4 = await prisma.route.create({
    data: {
      projectId: project2.id,
      ad: "Ofis - Şişli",
      baslangicNoktasi: "Levent Plaza",
      bitisNoktasi: "Şişli",
      km: 5,
      birimFiyat: 60,       // Tedarikçi fiyatı
      fabrikaFiyati: 85,    // Fabrika fiyatı
      kdvOrani: 20,
    },
  });
  console.log("Routes created (with supplier and factory prices)");

  // Assign vehicles to projects
  const pv1 = await prisma.projectVehicle.create({
    data: {
      projectId: project1.id,
      vehicleId: vehicle1.id,
    },
  });

  const pv2 = await prisma.projectVehicle.create({
    data: {
      projectId: project1.id,
      vehicleId: vehicle2.id,
    },
  });

  const pv3 = await prisma.projectVehicle.create({
    data: {
      projectId: project2.id,
      vehicleId: vehicle3.id,
    },
  });
  console.log("Vehicles assigned to projects");

  // Assign routes to vehicles
  await prisma.vehicleRoute.createMany({
    data: [
      { projectVehicleId: pv1.id, routeId: route1.id },
      { projectVehicleId: pv1.id, routeId: route2.id },
      { projectVehicleId: pv2.id, routeId: route1.id },
      { projectVehicleId: pv3.id, routeId: route3.id },
      { projectVehicleId: pv3.id, routeId: route4.id },
    ],
  });
  console.log("Routes assigned to vehicles");

  // Create sample timesheet for January 2026
  const timesheet1 = await prisma.timesheet.create({
    data: {
      projectId: project1.id,
      vehicleId: vehicle1.id,
      yil: 2026,
      ay: 1,
    },
  });

  // Add sample entries (weekdays in January)
  const januaryWorkdays = [2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31];
  for (const day of januaryWorkdays) {
    await prisma.timesheetEntry.create({
      data: {
        timesheetId: timesheet1.id,
        tarih: new Date(`2026-01-${String(day).padStart(2, "0")}`),
        routeId: route1.id,
        seferSayisi: 2, // 2 trips per day
        birimFiyatSnapshot: route1.birimFiyat,
        fabrikaFiyatSnapshot: route1.fabrikaFiyati,
        kdvOraniSnapshot: route1.kdvOrani,
      },
    });
  }
  console.log("Sample timesheet created with entries (including factory price snapshots)");

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
