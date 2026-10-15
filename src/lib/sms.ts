/**
 * Integración con LabsMobile para envío de SMS Automáticos
 * Documentación API: https://api.labsmobile.com/json/send
 */

export function cleanPhoneForLabsMobile(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");

  // Móvil de Colombia de 10 dígitos (inicia en 3) -> anteponer 57
  if (cleaned.length === 10 && cleaned.startsWith("3")) {
    return "57" + cleaned;
  }

  // Ya tiene prefijo 573...
  if (cleaned.length === 12 && cleaned.startsWith("573")) {
    return cleaned;
  }

  // Si tiene 10 dígitos de México o internacional
  if (cleaned.length === 10 && !cleaned.startsWith("3")) {
    return "52" + cleaned;
  }

  return cleaned;
}

export interface SendSmsParams {
  username?: string | null;
  apiToken?: string | null;
  senderId?: string | null;
  phone: string;
  message: string;
}

export interface SendSmsResult {
  success: boolean;
  code?: string;
  message?: string;
  error?: string;
  data?: any;
}

export async function sendLabsMobileSms({
  username,
  apiToken,
  senderId = "TurnoYa",
  phone,
  message,
}: SendSmsParams): Promise<SendSmsResult> {
  const finalUsername =
    username?.trim() ||
    process.env.LABSMOBILE_USERNAME ||
    "director@appzplay.online";

  const finalToken =
    apiToken?.trim() ||
    process.env.LABSMOBILE_API_TOKEN;

  if (!finalToken) {
    return {
      success: false,
      error: "Falta el API Token de LabsMobile. Genéralo en tu panel de LabsMobile.",
    };
  }

  const cleanedPhone = cleanPhoneForLabsMobile(phone);

  if (cleanedPhone.length < 8) {
    return {
      success: false,
      error: `Número de teléfono inválido: ${phone}`,
    };
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${finalUsername}:${finalToken}`).toString("base64")}`;

    const payload = {
      message: message.trim(),
      tpoa: senderId?.slice(0, 11) || "TurnoYa",
      recipient: [{ msisdn: cleanedPhone }],
    };

    const res = await fetch("https://api.labsmobile.com/json/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.message || data?.description || `Error HTTP ${res.status}`,
        data,
      };
    }

    // LabsMobile suele retornar code "0" cuando fue aceptado
    const isSuccess = data?.code === "0" || data?.subid || res.status === 200;

    return {
      success: isSuccess,
      code: data?.code,
      message: data?.message || "SMS enviado con éxito",
      data,
    };
  } catch (error: any) {
    console.error("Error al conectar con API de LabsMobile:", error);
    return {
      success: false,
      error: error?.message || "Error al enviar el SMS a LabsMobile",
    };
  }
}
