/**
 * Generador de enlaces de WhatsApp para notificaciones y confirmaciones
 */

export function cleanPhoneNumber(phone: string): string {
  // Elimina espacios, guiones, paréntesis y símbolos no numéricos excepto el '+'
  let cleaned = phone.replace(/[^0-9]/g, "");
  // Si no tiene código de país, asegurar formato internacional estándar
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
}): string {
  const phone = cleanPhoneNumber(params.phone);
  const text = `¡Hola ${params.clientName}! 👋

Tu turno en *${params.businessName}* ha sido confirmado con éxito:
🗓️ *Fecha:* ${params.dateStr}
⏰ *Hora:* ${params.timeStr}
✂️ *Servicio:* ${params.serviceName}${
    params.address ? `\n📍 *Dirección:* ${params.address}` : ""
  }

Si necesitas reagendar o cancelar con anticipación, por favor avísanos por este medio. ¡Te esperamos!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function generateReminderUrl(params: {
  phone: string;
  clientName: string;
  serviceName: string;
  businessName: string;
  timeStr: string;
  dateStr: string;
}): string {
  const phone = cleanPhoneNumber(params.phone);
  const text = `Hola ${params.clientName} 👋 Te recordamos tu cita hoy en *${params.businessName}*:

⏰ *Hora:* ${params.timeStr}
✂️ *Servicio:* ${params.serviceName}

Por favor responde:
👉 *1* para Confirmar asistencia
👉 *2* para Cancelar o Reagendar

¡Muchas gracias!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
