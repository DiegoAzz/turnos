import Stripe from "stripe";

// Clave segura de fallback para evitar que el constructor falle durante el build en Docker/Coolify
const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_for_docker_build_only";

export const stripe = new Stripe(apiKey, {
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
      accountingModule: false,
      homeService: false,
    },
  },
  INDEPENDIENTE: {
    id: "INDEPENDIENTE",
    name: "Plan Manicurista / Domicilio",
    priceMonthly: 9,
    priceYearly: 90,
    description: "Diseñado para manicuristas, estilistas y profesionales independientes que atienden en su punto o a domicilio.",
    features: [
      "Citas y turnos ilimitados",
      "Hasta 10 servicios con duración flexible (30 a 120 min)",
      "Modalidad a Domicilio con captura de dirección del cliente",
      "Recordatorios automáticos por WhatsApp con ubicación",
      "Alertas sonoras en segundo plano en celular y PC",
      "Alerta de cliente frecuente (reserva en 1 clic)",
    ],
    limits: {
      maxMonthlyAppointments: Infinity,
      maxServices: 10,
      whatsappAutoReminders: true,
      customBranding: true,
      accountingModule: false,
      homeService: true,
    },
  },
  PRO: {
    id: "PRO",
    name: "Plan Pro Ilimitado + Contabilidad",
    priceMonthly: 19,
    priceYearly: 190,
    description: "Para barberías, salones, spas y negocios que quieren control total y gestión contable de ingresos y gastos.",
    features: [
      "Todo lo del Plan Manicurista / Domicilio",
      "📱 Aplicación Móvil Android (APK) propia instalable con tu logotipo",
      "📊 Módulo Contable y Financiero completo (Ingresos, Gastos, Ganancia neta)",
      "Arqueo por método de pago (Efectivo, Nequi, Bancolombia)",
      "Servicios y categorías 100% ilimitados",
      "Personalización de logotipo, nombre, dirección y estados en vivo",
      "Recordatorios automáticos con tiempo configurable",
      "Soporte prioritario VIP",
    ],
    limits: {
      maxMonthlyAppointments: Infinity,
      maxServices: Infinity,
      whatsappAutoReminders: true,
      customBranding: true,
      accountingModule: true,
      homeService: true,
      customApk: true,
    },
  },
  SUPERADMIN: {
    id: "SUPERADMIN",
    name: "Licencia Super Administrador (Ventas & Demo)",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Acceso total e ilimitado para demostración comercial, pruebas de venta y administración completa de la plataforma.",
    features: [
      "Acceso desbloqueado al 100% de funciones y módulos",
      "Sin avisos de pago, sin cobros ni pasarelas",
      "Módulo especializado de Barberías (Barberos, Sillas y Botonera)",
      "Módulo especializado de Manicuristas & Spas (CRM, Cumpleaños, Domicilios)",
      "Módulo Contable y Arqueo Financiero Completo",
      "Punto de Venta (POS) e Inventario de Productos",
      "Generador de App Móvil Android (APK)",
      "Simulador de Planes para demostraciones comerciales",
    ],
    limits: {
      maxMonthlyAppointments: Infinity,
      maxServices: Infinity,
      whatsappAutoReminders: true,
      customBranding: true,
      accountingModule: true,
      homeService: true,
      customApk: true,
    },
  },
};
