import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBookingConfirmationUrl, cleanPhoneNumber } from "@/lib/whatsapp";
import { getLocalNow } from "@/lib/date-utils";

// Función auxiliar para sumar minutos a una hora "HH:mm"
function addMinutes(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(":").map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60);
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessSlug,
      serviceId,
      date, // Formato "YYYY-MM-DD"
      startTime, // Formato "HH:mm"
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      clientBirthday,
      referredBy,
      appointmentType = "LOCAL",
      clientAddress,
      paymentMethod = "EFECTIVO",
      staffMemberId,
    } = body;

    if (!businessSlug || !serviceId || !date || !startTime || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para agendar la cita." },
        { status: 400 }
      );
    }

    const decodedSlug = decodeURIComponent(businessSlug).trim();
    const cleanLower = decodedSlug.toLowerCase();

    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { slug: decodedSlug },
          { slug: cleanLower },
          { slug: { equals: decodedSlug, mode: "insensitive" } },
          { id: decodedSlug },
        ],
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.active) {
      return NextResponse.json({ error: "Servicio no válido o inactivo." }, { status: 400 });
    }

    // Calcular hora de fin según duración del servicio
    const endTime = addMinutes(startTime, service.durationMinutes);

    // Parsear fecha
    const appointmentDate = new Date(`${date}T00:00:00.000Z`);

    // Obtener fecha y hora en la zona horaria del negocio (Colombia UTC-5)
    const localNow = getLocalNow();
    const todayStr = localNow.todayStr;

    // Validar si el negocio está cerrado el día de hoy mediante liveStatus
    if (date === todayStr && business.liveStatus === "CLOSED_TODAY") {
      return NextResponse.json(
        { error: "El establecimiento se encuentra cerrado el día de hoy. Por favor selecciona otra fecha disponible." },
        { status: 400 }
      );
    }

    // Validar si el día de la semana está configurado como CERRADO
    const [dYear, dMonth, dDay] = date.split("-").map(Number);
    const dateForDayOfWeek = new Date(dYear, dMonth - 1, dDay);
    const dayOfWeek = dateForDayOfWeek.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const dayName = dayNames[dayOfWeek] || "este día";

    const workingHour = await prisma.workingHour.findUnique({
      where: {
        businessId_dayOfWeek: {
          businessId: business.id,
          dayOfWeek,
        },
      },
    });

    if (workingHour) {
      if (workingHour.isClosed) {
        return NextResponse.json(
          { error: `El establecimiento no presta servicio los días ${dayName} (Cerrado todo el día). Por favor selecciona otro día en el calendario.` },
          { status: 400 }
        );
      }
    } else if (dayOfWeek === 0) {
      // Por defecto, si no hay horario configurado, domingo es cerrado
      return NextResponse.json(
        { error: `El establecimiento no presta servicio los días Domingo (Cerrado todo el día). Por favor selecciona otro día en el calendario.` },
        { status: 400 }
      );
    }

    // Validar que no se reserve una hora que ya pasó en la fecha de hoy
    if (date === todayStr) {
      const [reqH, reqM] = startTime.split(":").map(Number);
      const reqMinutes = reqH * 60 + reqM;
      // Margen de tolerancia de 5 minutos según la hora local de Colombia
      const currentMinutes = localNow.totalMinutes - 5;
      if (reqMinutes < currentMinutes) {
        return NextResponse.json(
          { error: "El horario seleccionado ya ha pasado para el día de hoy. Por favor elige una hora a partir de este momento." },
          { status: 400 }
        );
      }
    }

    // Validar si existe colisión de intervalos con citas ya reservadas
    function toMinutes(t: string): number {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    }

    const reqStartMin = toMinutes(startTime);
    const reqEndMin = toMinutes(endTime);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: appointmentDate,
        status: { not: "CANCELLED" },
      },
    });

    if (business.multiBarberEnabled) {
      // Contar barberos activos registrados en el negocio
      const activeStaff = await prisma.staffMember.findMany({
        where: { businessId: business.id, active: true },
      });
      const activeStaffCount = activeStaff.length;

      if (staffMemberId) {
        // El cliente eligió un barbero específico: verificar colisión únicamente con ese barbero
        const barberAppointments = existingAppointments.filter((app) => app.staffMemberId === staffMemberId);
        const hasBarberCollision = barberAppointments.some((app) => {
          const appStartMin = toMinutes(app.startTime);
          const appEndMin = toMinutes(app.endTime);
          return reqStartMin < appEndMin && reqEndMin > appStartMin;
        });

        if (hasBarberCollision) {
          const chosenBarber = activeStaff.find((s) => s.id === staffMemberId);
          return NextResponse.json(
            {
              error: `Este horario ya está reservado con ${chosenBarber?.name || "este barbero"}. Por favor elige otra hora o selecciona "Cualquier barbero disponible".`,
            },
            { status: 409 }
          );
        }
      } else {
        // El cliente seleccionó "Cualquier barbero disponible":
        // Permitir citas simultáneas hasta el número de barberos activos
        const maxChairs = Math.max(1, activeStaffCount);
        const overlappingAppointments = existingAppointments.filter((app) => {
          const appStartMin = toMinutes(app.startTime);
          const appEndMin = toMinutes(app.endTime);
          return reqStartMin < appEndMin && reqEndMin > appStartMin;
        });

        if (overlappingAppointments.length >= maxChairs) {
          return NextResponse.json(
            {
              error: "Todas las sillas y barberos disponibles se encuentran ocupados para este horario. Por favor elige otra hora.",
            },
            { status: 409 }
          );
        }
      }
    } else {
      // Modo clásico (1 silla): colisión ante cualquier cita previa
      const hasCollision = existingAppointments.some((app) => {
        const appStartMin = toMinutes(app.startTime);
        const appEndMin = toMinutes(app.endTime);
        return reqStartMin < appEndMin && reqEndMin > appStartMin;
      });

      if (hasCollision) {
        return NextResponse.json(
          { error: "Este horario se cruza con otra cita ya reservada. Por favor elige otro horario." },
          { status: 409 }
        );
      }
    }

    const formattedPhone = cleanPhoneNumber(clientPhone);

    // 1. REGLA ANTI-SPAM: Validar que sea un número móvil verosímil
    const digitsOnly = clientPhone.replace(/[^0-9]/g, "");
    if (digitsOnly.length < 10) {
      return NextResponse.json(
        { error: "Por favor ingresa un número de celular/WhatsApp válido de al menos 10 dígitos." },
        { status: 400 }
      );
    }

    const isRepetitive = /^(\d)\1+$/.test(digitsOnly);
    const isDummySequence = ["1234567890", "0123456789", "9876543210"].includes(digitsOnly.slice(-10));
    if (isRepetitive || isDummySequence) {
      return NextResponse.json(
        { error: "El número de teléfono ingresado no parece ser un número real. Por favor escribe tu número verdadero." },
        { status: 400 }
      );
    }

    // 2. REGLA ANTI-SPAM: Verificar si el número está en Lista Negra (bloqueado por el negocio)
    const isBlocked = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        clientPhone: formattedPhone,
        status: { in: ["BLOCKED", "SPAM"] },
      },
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: "No es posible solicitar turnos con este número en este establecimiento. Comunícate directamente con el administrador." },
        { status: 403 }
      );
    }

    // 3. REGLA ANTI-SPAM: Máximo 1 turno activo por número de celular para la misma fecha
    const activeAppointmentSamePhone = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        date: appointmentDate,
        clientPhone: formattedPhone,
        status: { in: ["CONFIRMED", "PENDING", "IN_PROGRESS"] },
      },
      include: { service: true },
    });

    if (activeAppointmentSamePhone) {
      return NextResponse.json(
        {
          error: `Ya tienes un turno activo (#${activeAppointmentSamePhone.startTime} - ${activeAppointmentSamePhone.service?.name}) para esta fecha. No puedes pedir más turnos hasta que seas atendido o canceles el anterior.`,
        },
        { status: 429 }
      );
    }

// 4. Calcular Recargo por Domicilio y Requisito de Anticipo para Clientes Nuevos
    const homeFee = appointmentType === "DOMICILIO" ? (business.homeServiceFee || 0) : 0;

    const previousVisitsCount = await prisma.appointment.count({
      where: {
        businessId: business.id,
        clientPhone: formattedPhone,
        status: { in: ["COMPLETED", "CONFIRMED"] },
      },
    });
    const isNewClient = previousVisitsCount === 0;

    let depositRequired = 0;
    if (isNewClient && business.requireDepositForNew && (business.depositAmount || 0) > 0) {
      depositRequired = business.depositAmount || 0;
    }

    // Crear cita con tipo (LOCAL o DOMICILIO), recargos y datos de fidelización
    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        serviceId: service.id,
        clientName,
        clientPhone: formattedPhone,
        clientEmail: clientEmail || null,
        clientNotes: clientNotes || null,
        clientBirthday: clientBirthday ? String(clientBirthday).trim() : null,
        referredBy: referredBy ? String(referredBy).trim() : null,
        appointmentType: appointmentType === "DOMICILIO" ? "DOMICILIO" : "LOCAL",
        clientAddress: clientAddress || null,
        homeFee,
        depositRequired,
        depositPaid: false,
        paymentMethod: paymentMethod || "EFECTIVO",
        date: appointmentDate,
        startTime,
        endTime,
        status: "CONFIRMED",
        staffMemberId: staffMemberId || null,
      },
      include: {
        service: true,
        business: true,
        staffMember: true,
      },
    });

// Sincronizar automáticamente en la Base de Datos de Clientes (CRM)
    try {
      const existingCustomer = await prisma.customer.findUnique({
        where: {
          businessId_phone: {
            businessId: business.id,
            phone: formattedPhone,
          },
        },
      });

      if (existingCustomer) {
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: clientName,
            email: clientEmail || existingCustomer.email,
            birthday: clientBirthday ? String(clientBirthday).trim() : existingCustomer.birthday,
            notes: clientNotes ? (existingCustomer.notes ? `${existingCustomer.notes} | ${clientNotes}` : clientNotes) : existingCustomer.notes,
            lastVisit: appointmentDate,
            totalVisits: { increment: 1 },
          },
        });
      } else {
        await prisma.customer.create({
          data: {
            businessId: business.id,
            name: clientName,
            phone: formattedPhone,
            email: clientEmail || null,
            birthday: clientBirthday ? String(clientBirthday).trim() : null,
            notes: clientNotes ? String(clientNotes).trim() : null,
            referredBy: referredBy ? String(referredBy).trim() : null,
            totalVisits: 1,
            lastVisit: appointmentDate,
          },
        });

        // Si llegó con referido, buscar si quien lo recomendó está en la base de clientes y sumarle 1 al contador
        if (referredBy && referredBy.trim()) {
          const refClean = referredBy.replace(/[^0-9]/g, "");
          const referringCust = await prisma.customer.findFirst({
            where: {
              businessId: business.id,
              OR: [
                refClean.length >= 7 ? { phone: { contains: refClean } } : undefined,
                { name: { contains: referredBy.trim(), mode: "insensitive" } },
              ].filter(Boolean) as any,
            },
          });

          if (referringCust) {
            await prisma.customer.update({
              where: { id: referringCust.id },
              data: { referralCount: { increment: 1 } },
            });
          }
        }
      }
    } catch (crmErr) {
      console.error("Error sincronizando CRM de cliente:", crmErr);
    }

    // Calcular posición y número de turno para el día según orden de hora

    // Calcular posición y número de turno para el día según orden cronológico
    const allAppointmentsDay = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: appointmentDate,
        status: { not: "CANCELLED" },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Si el administrador reinició el conteo hoy, numerar a partir del reinicio
    let turnsForCounting = allAppointmentsDay;
    if (business.queueResetAt) {
      const resetTime = new Date(business.queueResetAt).getTime();
      const resetDayStr = new Date(business.queueResetAt).toISOString().split("T")[0];
      const appDayStr = appointmentDate.toISOString().split("T")[0];
      if (resetDayStr === appDayStr) {
        turnsForCounting = allAppointmentsDay.filter(
          (app) => new Date(app.createdAt).getTime() >= resetTime
        );
      }
    }

    const turnIndex = turnsForCounting.findIndex((app) => app.id === appointment.id);
    const turnNumber = turnIndex !== -1 ? turnIndex + 1 : Math.max(1, turnsForCounting.length);

    // Calcular cuántos turnos están ACTIVAMENTE esperando o en atención antes de este turno
    // (Solo cuenta los activos: si los anteriores ya se fueron y la sala está libre, aheadCount es 0)
    const activeWaitingAppointments = allAppointmentsDay.filter(
      (app) => app.id !== appointment.id && ["CONFIRMED", "PENDING", "IN_PROGRESS"].includes(app.status)
    );
    const aheadCount = activeWaitingAppointments.length;

    // Dirección a mostrar en el comprobante: si es a domicilio, la del cliente; si no, la del local
    const displayAddress =
      appointmentType === "DOMICILIO" && clientAddress
        ? `${clientAddress} (A Domicilio)`
        : business.address;

    const chosenBarberName = appointment.staffMember?.name || null;

    // Generar enlace de WhatsApp para confirmación inmediata con link de reagendamiento y turno asignado
    const whatsappUrl = generateBookingConfirmationUrl({
      phone: formattedPhone,
      clientName,
      serviceName: service.name,
      businessName: business.name,
      dateStr: date,
      timeStr: `${startTime} a ${endTime}`,
      address: displayAddress,
      rescheduleUrl: `https://turnos.appzplay.online/p/${business.slug}`,
      turnNumber,
      aheadCount,
      staffName: chosenBarberName,
    });

    return NextResponse.json({
      success: true,
      appointment,
      turnNumber,
      aheadCount,
      totalTurnsDay: allAppointmentsDay.length,
      whatsappUrl,
      isNewClient,
      depositRequired,
      depositPaymentInfo: business.depositPaymentInfo,
      homeFee,
      totalToPay: service.price + homeFee,
    });
  } catch (error) {
    console.error("Error al crear cita:", error);
    return NextResponse.json(
      { error: "Error interno al procesar la reserva." },
      { status: 500 }
    );
  }
}
