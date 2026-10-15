import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, plan = "PRO" } = body;

    if (!businessId) {
      return NextResponse.json({ error: "businessId es requerido" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const settings = await getPlatformSettings();

    if (settings.paymentMode === "MANUAL") {
      return NextResponse.json(
        { error: "La pasarela online está deshabilitada actualmente. Por favor utiliza consignación directa." },
        { status: 400 }
      );
    }

    if (!settings.wompiPublicKey || !settings.wompiPublicKey.trim()) {
      return NextResponse.json(
        { error: "La pasarela Wompi aún no tiene configurada su Llave Pública en el Super Admin." },
        { status: 400 }
      );
    }

    const priceCOP = plan === "INDEPENDIENTE" ? settings.independientePriceCOP : settings.proPriceCOP;
    const amountInCents = priceCOP * 100;
    const currency = "COP";
    const reference = `TY_${plan}_${business.id.substring(0, 6)}_${Date.now()}`;

    // Generar firma de integridad si el secreto está configurado
    let signature: string | undefined = undefined;
    if (settings.wompiIntegritySecret && settings.wompiIntegritySecret.trim()) {
      const stringToSign = `${reference}${amountInCents}${currency}${settings.wompiIntegritySecret.trim()}`;
      signature = crypto.createHash("sha256").update(stringToSign).digest("hex");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://turnos.appzplay.online";
    const redirectUrl = `${appUrl}/dashboard/suscripcion?wompi_ref=${reference}`;

    return NextResponse.json({
      success: true,
      publicKey: settings.wompiPublicKey.trim(),
      currency,
      amountInCents,
      reference,
      signature,
      redirectUrl,
      customerData: {
        email: business.email,
        fullName: business.name,
        phoneNumber: business.phone || "",
      },
      plan,
      priceCOP,
    });
  } catch (error) {
    console.error("Error al preparar checkout de Wompi:", error);
    return NextResponse.json({ error: "Error interno al preparar pago" }, { status: 500 });
  }
}
