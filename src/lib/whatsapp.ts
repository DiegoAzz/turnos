/**
 * Generador de enlaces de WhatsApp para notificaciones y confirmaciones
 */

export function cleanPhoneNumber(phone: string): string {
  // Elimina espacios, guiones, paréntesis y símbolos no numéricos
  let cleaned = phone.replace(/[^0-9]/g, "");

  // Si tiene 10 dígitos y empieza por 3 (Móvil de Colombia: 300, 310, 313, 320, etc.)
  if (cleaned.length === 10 && cleaned.startsWith("3")) {
    return "57" + cleaned;
  }

  // Si tiene 12 dígitos y empieza por 573 (Colombia ya con prefijo)
  if (cleaned.length === 12 && cleaned.startsWith("573")) {
    return cleaned;
  }

  // Si tiene 10 dígitos de México o internacional que no empiece con 3
  if (cleaned.length === 10 && !cleaned.startsWith("3")) {
    return "52" + cleaned;
  }

  return cleaned;
}

export function generateBookingConfirmationUrl(params: {
  phone: string;
  clientName: string;
  serviceName: string;
  businessName: string;
  dateStr: string;
  timeStr: string;
  address?: string | null;
  rescheduleUrl?: string;
  turnNumber?: number;
}): string {
  const phone = cleanPhoneNumber(params.phone);
  const rescheduleLink = params.rescheduleUrl || "https://turnos.appzplay.online";
  const addressLine = params.address ? `\n📍 *Dirección / Lugar:* ${params.address}` : "";
  const turnLine = params.turnNumber ? `\n🎫 *Turno Asignado:* #${params.turnNumber} del día` : "";

  const text = `¡Hola ${params.clientName}! 👋

Tu turno en *${params.businessName}* ha sido confirmado con éxito:${turnLine}
🗓️ *Fecha:* ${params.dateStr}
⏰ *Hora:* ${params.timeStr}
✂️ *Servicio:* ${params.serviceName}${addressLine}

🔗 Si necesitas consultar o reagendar tu cita en cualquier momento, ingresa aquí:
${rescheduleLink}

Si tienes alguna consulta, puedes escribirnos por este medio. ¡Te esperamos! ✨`;

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

export function generateReminderUrl(params: {
  phone: string;
  clientName: string;
  serviceName: string;
  businessName: string;
  timeStr: string;
  dateStr: string;
  address?: string | null;
  rescheduleUrl?: string;
}): string {
  const phone = cleanPhoneNumber(params.phone);
  const rescheduleLink = params.rescheduleUrl || "https://turnos.appzplay.online";
  const addressLine = params.address ? `\n📍 *Lugar / Dirección:* ${params.address}` : "";

  const text = `Hola ${params.clientName} 👋 Te recordamos tu cita en *${params.businessName}*:

📅 *Fecha:* ${params.dateStr}
⏰ *Hora:* ${params.timeStr}
✂️ *Servicio:* ${params.serviceName}${addressLine}

Por favor responde a este mensaje:
👉 *1* para Confirmar tu asistencia
👉 *2* para Reagendar o Cancelar

🔗 Si necesitas cambiar tu horario o reagendar de inmediato, pulsa este enlace:
${rescheduleLink}

¡Muchas gracias! ✨`;

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

export function generatePostponedNotificationUrl(params: {
  phone: string;
  clientName: string;
  serviceName: string;
  businessName: string;
  turnNumber: number | string;
  turneroUrl?: string;
}): string {
  const phone = cleanPhoneNumber(params.phone);
  const turneroLink = params.turneroUrl || "https://turnos.appzplay.online";

  const text = `¡Hola ${params.clientName}! 👋 Te llamamos para tu turno *#${params.turnNumber}* (${params.serviceName}) en *${params.businessName}*, pero aún no estabas en la sala de espera.

Para no frenar el orden del día, hemos pospuesto temporalmente tu turno para atender al cliente siguiente. ⏳

👉 *¡No has perdido tu turno!* Apenas llegues a la barbería, acércate al mostrador o respóndenos aquí para subirte a la silla de inmediato. 💈

🔗 Puedes seguir el estado de la fila en vivo aquí:
${turneroLink}`;

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

export function generateNowCallingNotificationUrl(params: {
  phone: string;
  clientName: string;
  serviceName: string;
  businessName: string;
  turnNumber: number | string;
}): string {
  const phone = cleanPhoneNumber(params.phone);

  const text = `¡Hola ${params.clientName}! 🔔✂️ ¡Es tu turno *#${params.turnNumber}* en *${params.businessName}*!

Tu barbero ya está listo para atenderte en el servicio: *${params.serviceName}*. Por favor pasa a la silla. ¡Te esperamos!`;

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}
