import { prisma } from "@/lib/prisma";

export async function getPlatformSettings() {
  let settings = await prisma.platformSettings.findUnique({
    where: { id: "global" },
  });

  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: {
        id: "global",
        paymentMode: "MANUAL", // "MANUAL", "GATEWAY", "HYBRID"
        wompiPublicKey: process.env.WOMPI_PUBLIC_KEY || "",
        wompiIntegritySecret: process.env.WOMPI_INTEGRITY_SECRET || "",
        wompiSandbox: true,
        googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "",
        nequiNumber: "300 123 4567",
        daviplataNumber: "300 123 4567",
        bancolombiaDetails: "Cuenta de Ahorros Bancolombia - Preguntar por número o QR",
        whatsappPaymentNumber: "300 123 4567",
        proPriceCOP: 60000,
        independientePriceCOP: 35000,
        partnerFirstMonthRate: 0.50,
        partnerRecurringRate: 0.20,
        defaultFranchiseEntryFeeUSD: 99,
        defaultFranchiseEntryFeeCOP: 400000,
        defaultFranchiseFeeUSD: 29,
        defaultFranchiseFeeCOP: 100000,
        defaultTrialDays: 7,
      },
    });
  }

  return settings;
}
