import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("turnos_admin_session");
  return session?.value === "authenticated";
}

// GET: Retorna la configuración de pagos activa para el dashboard y la plataforma
export async function GET() {
  try {
    const settings = await getPlatformSettings();

    // Retornamos sin secretos para consumo público/dashboard
    return NextResponse.json({
      paymentMode: settings.paymentMode, // "MANUAL", "GATEWAY", "HYBRID"
      wompiPublicKey: settings.wompiPublicKey,
      wompiSandbox: settings.wompiSandbox,
      nequiNumber: settings.nequiNumber,
      daviplataNumber: settings.daviplataNumber,
      bancolombiaDetails: settings.bancolombiaDetails,
      whatsappPaymentNumber: settings.whatsappPaymentNumber,
      proPriceCOP: settings.proPriceCOP,
      independientePriceCOP: settings.independientePriceCOP,
      partnerFirstMonthRate: settings.partnerFirstMonthRate ?? 0.50,
      partnerRecurringRate: settings.partnerRecurringRate ?? 0.20,
      defaultFranchiseEntryFeeUSD: settings.defaultFranchiseEntryFeeUSD ?? 99,
      defaultFranchiseEntryFeeCOP: settings.defaultFranchiseEntryFeeCOP ?? 400000,
      defaultFranchiseFeeUSD: settings.defaultFranchiseFeeUSD ?? 29,
      defaultFranchiseFeeCOP: settings.defaultFranchiseFeeCOP ?? 100000,
      hasWompiConfigured: Boolean(settings.wompiPublicKey && settings.wompiPublicKey.trim()),
    });
  } catch (error) {
    console.error("Error al obtener configuración de plataforma:", error);
    return NextResponse.json(
      {
        paymentMode: "MANUAL",
        nequiNumber: "300 123 4567",
        daviplataNumber: "300 123 4567",
        bancolombiaDetails: "Cuenta de Ahorros Bancolombia",
        whatsappPaymentNumber: "300 123 4567",
        proPriceCOP: 60000,
        independientePriceCOP: 35000,
        partnerFirstMonthRate: 0.50,
        partnerRecurringRate: 0.20,
        hasWompiConfigured: false,
      },
      { status: 200 }
    );
  }
}

// PATCH: Solo Super Admin puede actualizar el modo de pago y las cuentas
export async function PATCH(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      paymentMode,
      wompiPublicKey,
      wompiIntegritySecret,
      wompiSandbox,
      nequiNumber,
      daviplataNumber,
      bancolombiaDetails,
      whatsappPaymentNumber,
      proPriceCOP,
      independientePriceCOP,
      partnerFirstMonthRate,
      partnerRecurringRate,
    } = body;

    const dataToUpdate: any = {};
    if (paymentMode && ["MANUAL", "GATEWAY", "HYBRID"].includes(paymentMode)) {
      dataToUpdate.paymentMode = paymentMode;
    }
    if (typeof wompiPublicKey === "string") dataToUpdate.wompiPublicKey = wompiPublicKey.trim();
    if (typeof wompiIntegritySecret === "string") dataToUpdate.wompiIntegritySecret = wompiIntegritySecret.trim();
    if (typeof wompiSandbox === "boolean") dataToUpdate.wompiSandbox = wompiSandbox;
    if (typeof nequiNumber === "string") dataToUpdate.nequiNumber = nequiNumber.trim();
    if (typeof daviplataNumber === "string") dataToUpdate.daviplataNumber = daviplataNumber.trim();
    if (typeof bancolombiaDetails === "string") dataToUpdate.bancolombiaDetails = bancolombiaDetails.trim();
    if (typeof whatsappPaymentNumber === "string") dataToUpdate.whatsappPaymentNumber = whatsappPaymentNumber.trim();
    if (typeof proPriceCOP === "number") dataToUpdate.proPriceCOP = proPriceCOP;
    if (typeof independientePriceCOP === "number") dataToUpdate.independientePriceCOP = independientePriceCOP;
    if (typeof partnerFirstMonthRate === "number") dataToUpdate.partnerFirstMonthRate = partnerFirstMonthRate;
    if (typeof partnerRecurringRate === "number") dataToUpdate.partnerRecurringRate = partnerRecurringRate;
    if (typeof body.defaultFranchiseEntryFeeUSD === "number") dataToUpdate.defaultFranchiseEntryFeeUSD = body.defaultFranchiseEntryFeeUSD;
    if (typeof body.defaultFranchiseEntryFeeCOP === "number") dataToUpdate.defaultFranchiseEntryFeeCOP = body.defaultFranchiseEntryFeeCOP;
    if (typeof body.defaultFranchiseFeeUSD === "number") dataToUpdate.defaultFranchiseFeeUSD = body.defaultFranchiseFeeUSD;
    if (typeof body.defaultFranchiseFeeCOP === "number") dataToUpdate.defaultFranchiseFeeCOP = body.defaultFranchiseFeeCOP;

    const updated = await prisma.platformSettings.upsert({
      where: { id: "global" },
      update: dataToUpdate,
      create: {
        id: "global",
        paymentMode: paymentMode || "MANUAL",
        ...dataToUpdate,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuración de pagos actualizada exitosamente.",
      settings: updated,
    });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
