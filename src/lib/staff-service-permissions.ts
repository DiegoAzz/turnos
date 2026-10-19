/**
 * Utilidades para manejar permisos de servicios por barbero/personal
 * Almacenados en StaffMember.avatarUrl como metadato JSON sin requerir migraciones de BD
 */

export function parseStaffServices(avatarUrl?: string | null): string[] | null {
  if (!avatarUrl) return null; // null = todos los servicios habilitados
  try {
    const trimmed = avatarUrl.trim();
    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed.allowedServices)) {
        return parsed.allowedServices;
      }
    }
  } catch {}
  return null; // Si no es JSON o no tiene el campo, todos están habilitados
}

export function encodeStaffServices(
  allowedServices: string[] | null,
  existingAvatarUrl?: string | null
): string {
  let existingAvatar: string | null = null;

  if (existingAvatarUrl) {
    try {
      const trimmed = existingAvatarUrl.trim();
      if (trimmed.startsWith("{")) {
        const parsed = JSON.parse(trimmed);
        existingAvatar = parsed.avatar || null;
      } else {
        existingAvatar = trimmed;
      }
    } catch {
      existingAvatar = existingAvatarUrl;
    }
  }

  return JSON.stringify({
    allowedServices: allowedServices, // Array de IDs de servicios permitidos, o null para todos
    avatar: existingAvatar,
  });
}
