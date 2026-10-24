/**
 * Helper centralizado para verificar vigencia del Plan PRO y Período de Prueba (Trial)
 */

export interface BusinessPlanSubject {
  plan?: string | null;
  stripeCurrentPeriodEnd?: Date | string | null;
  trialEndsAt?: Date | string | null;
  active?: boolean;
}

export function isBusinessPro(business?: BusinessPlanSubject | null): boolean {
  if (!business) return false;

  const now = new Date();

  // 1. Si el negocio cuenta con un período de prueba activo (Trial)
  if (business.trialEndsAt && new Date(business.trialEndsAt) > now) {
    return true;
  }

  // 2. Si cuenta con suscripción PRO activa
  if (business.plan === "PRO") {
    // Si no tiene fecha de vencimiento configurada o aún no vence
    if (!business.stripeCurrentPeriodEnd) return true;
    return new Date(business.stripeCurrentPeriodEnd) > now;
  }

  return false;
}

export function getTrialStatus(business?: BusinessPlanSubject | null) {
  if (!business) {
    return {
      isPro: false,
      isTrialActive: false,
      isTrialExpired: false,
      trialDaysLeft: 0,
      planLabel: "FREE",
    };
  }

  const now = new Date();
  const trialEnds = business.trialEndsAt ? new Date(business.trialEndsAt) : null;
  const isTrialActive = Boolean(trialEnds && trialEnds > now);
  const isTrialExpired = Boolean(trialEnds && trialEnds <= now && business.plan !== "PRO");

  let trialDaysLeft = 0;
  if (isTrialActive && trialEnds) {
    const diffMs = trialEnds.getTime() - now.getTime();
    trialDaysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const isPro = isBusinessPro(business);

  let planLabel = "Plan FREE";
  if (business.plan === "PRO" && (!business.stripeCurrentPeriodEnd || new Date(business.stripeCurrentPeriodEnd) > now)) {
    planLabel = "Plan PRO (Activo)";
  } else if (isTrialActive) {
    planLabel = `Prueba PRO (${trialDaysLeft}d)`;
  } else if (isTrialExpired) {
    planLabel = "Prueba Vencida (FREE)";
  }

  return {
    isPro,
    isTrialActive,
    isTrialExpired,
    trialDaysLeft,
    planLabel,
    trialEndsAt: trialEnds ? trialEnds.toISOString() : null,
  };
}
