/**
 * Utilidades para manejo de fechas y horas en la zona horaria del negocio (por defecto Colombia America/Bogota - UTC-5)
 * Evita desfaces causados por servidores en UTC (Vercel, AWS, Docker).
 */

export function getLocalNow(timeZone = "America/Bogota") {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "0";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = parseInt(getPart("hour"), 10);
  const minute = parseInt(getPart("minute"), 10);
  const second = parseInt(getPart("second"), 10);

  const todayStr = `${year}-${month}-${day}`;
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const totalMinutes = hour * 60 + minute;

  return {
    todayStr,
    timeStr,
    year: parseInt(year, 10),
    month: parseInt(month, 10),
    day: parseInt(day, 10),
    hour,
    minute,
    second,
    totalMinutes,
  };
}

export function getTodayUtcRange(timeZone = "America/Bogota", dateOverride?: string | null) {
  const dateStr = dateOverride && /^\d{4}-\d{2}-\d{2}$/.test(dateOverride)
    ? dateOverride
    : getLocalNow(timeZone).todayStr;

  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  return { dateStr, startOfDay, endOfDay };
}
