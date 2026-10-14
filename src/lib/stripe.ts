import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
  typescript: true,
});

export const PLANS = {
  FREE: {
    id: "FREE",
    name: "Plan Emprendedor (Gratis)",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Ideal para profesionales que están comenzando a digitalizar sus turnos.",
    features: [
      "Hasta 30 citas por mes",
      "Hasta 2 servicios activos",
      "Página de reservas pública personalizada",
      "Recordatorios manuales por WhatsApp",
      "Soporte básico por email",
    ],
    limits: {
      maxMonthlyAppointments: 30,
      maxServices: 2,
      whatsappAutoReminders: false,
      customBranding: false,
    },
  },
  PRO: {
    id: "PRO",
    name: "Plan Pro Ilimitado",
    priceMonthly: 19,
    priceYearly: 190,
    description: "Para negocios y profesionales que quieren maximizar su ocupación y reducir ausencias a cero.",
    features: [
      "Citas y turnos ilimitados",
      "Servicios y categorías ilimitadas",
      "Recordatorios automáticos por WhatsApp con 1 clic",
      "Personalización de colores y logotipo de tu marca",
      "Bloqueo de horarios y pausas de descanso",
      "Métricas avanzadas de ingresos y asistencia",
      "Soporte prioritario 24/7",
    ],
    limits: {
      maxMonthlyAppointments: Infinity,
      maxServices: Infinity,
      whatsappAutoReminders: true,
      customBranding: true,
    },
  },
};
