import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, interval = "monthly" } = body;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Si no hay clave real de Stripe configurada, devolvemos simulación exitosa
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("placeholder")) {
      return NextResponse.json({
        isMock: true,
        message: "Modo demo activo: Stripe no tiene clave real configurada en .env",
        redirectUrl: `${appUrl}/dashboard/suscripcion?success=true&mock=true`,
      });
    }

    const priceId =
      interval === "yearly"
        ? process.env.STRIPE_PRO_YEARLY_PRICE_ID
        : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

    // Crear o recuperar cliente de Stripe
    let customerId = business.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: business.email,
        name: business.name,
        metadata: {
          businessId: business.id,
        },
      });
      customerId = customer.id;
      await prisma.business.update({
        where: { id: business.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId || undefined,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/suscripcion?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${appUrl}/dashboard/suscripcion?canceled=true`,
      metadata: {
        businessId: business.id,
      },
    });

    return NextResponse.json({
      url: session.url,
      isMock: false,
    });
  } catch (error: any) {
    console.error("Error al crear sesión de checkout:", error);
    return NextResponse.json(
      { error: error?.message || "Error al procesar el pago con Stripe." },
      { status: 500 }
    );
  }
}
