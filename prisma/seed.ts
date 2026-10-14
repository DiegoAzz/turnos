import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de datos para TurnoYa...");

  // Limpiar datos existentes de prueba si existen
  await prisma.appointment.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();

  // 1. Crear Negocio Demo
  const business = await prisma.business.create({
    data: {
      name: "Barbería & Spa Elite",
      slug: "barberia-elite",
      email: "contacto@barberiaelite.com",
      phone: "+5215512345678",
      description: "Cortes modernos, afeitado tradicional con toalla caliente y cuidado masculino premium.",
      address: "Av. Central 742, Zona Comercial",
      currency: "USD",
      plan: "PRO",
    },
  });

  // 2. Horarios de Trabajo (Lunes a Sábado 09:00 a 19:00, Domingo cerrado)
  const workingHoursData = [
    { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isClosed: false },
    { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00", isClosed: false },
    { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00", isClosed: false },
    { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isClosed: false },
    { dayOfWeek: 5, openTime: "09:00", closeTime: "20:00", isClosed: false },
    { dayOfWeek: 6, openTime: "10:00", closeTime: "18:00", isClosed: false },
    { dayOfWeek: 0, openTime: "10:00", closeTime: "14:00", isClosed: true },
  ];

  for (const wh of workingHoursData) {
    await prisma.workingHour.create({
      data: {
        businessId: business.id,
        ...wh,
      },
    });
  }

  // 3. Crear Servicios
  const s1 = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Corte Clásico & Fade",
      description: "Degradado a elección, tijera superior, peinado y producto estilizador.",
      durationMinutes: 30,
      price: 18.0,
      active: true,
    },
  });

  const s2 = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Afeitado Tradicional con Toalla Caliente",
      description: "Aceite preafeitado, espuma tibia, navaja libre y bálsamo hidratante.",
      durationMinutes: 30,
      price: 15.0,
      active: true,
    },
  });

  const s3 = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Combo VIP: Corte + Barba + Mascarilla Black",
      description: "Servicio completo de corte, tratamiento de barba y mascarilla limpiadora de poros.",
      durationMinutes: 60,
      price: 32.0,
      active: true,
    },
  });

  const s4 = await prisma.service.create({
    data: {
      businessId: business.id,
      name: "Perfilado de Barba Express",
      description: "Marcado de líneas de mejilla y cuello con máquina de contorno.",
      durationMinutes: 20,
      price: 10.0,
      active: true,
    },
  });

  // 4. Crear Citas de Ejemplo
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: s1.id,
      clientName: "Carlos Méndez",
      clientPhone: "+5215598765432",
      clientEmail: "carlos.m@example.com",
      clientNotes: "Prefiere fade bajo número 1",
      date: today,
      startTime: "10:30",
      endTime: "11:00",
      status: "CONFIRMED",
      reminderSent: true,
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: s3.id,
      clientName: "Alejandro Ruiz",
      clientPhone: "+5215576543210",
      clientEmail: "ale.ruiz@example.com",
      clientNotes: "Primera vez en el local",
      date: today,
      startTime: "12:00",
      endTime: "13:00",
      status: "CONFIRMED",
      reminderSent: false,
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: s2.id,
      clientName: "Mateo Fernández",
      clientPhone: "+5215534567890",
      clientEmail: "mateo.f@example.com",
      date: tomorrow,
      startTime: "16:00",
      endTime: "16:30",
      status: "PENDING",
      reminderSent: false,
    },
  });

  console.log("¡Seed completado con éxito! Negocio demo creado: /p/barberia-elite");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
