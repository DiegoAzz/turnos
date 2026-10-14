import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook signature o secret ausente." },
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const businessId = session.metadata?.businessId;
        const subscriptionId = session.subscription;

        if (businessId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await prisma.business.update({
            where: { id: businessId },
            data: {
              plan: "PRO",
              stripeSubscriptionId: subscription.id,
              stripeCurrentPeriodEnd: new Date(
                (subscription as any).current_period_end * 1000
              ),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const business = await prisma.business.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (business) {
          const isActive = subscription.status === "active";
          await prisma.business.update({
            where: { id: business.id },
            data: {
              plan: isActive ? "PRO" : "FREE",
              stripeCurrentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const business = await prisma.business.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (business) {
          await prisma.business.update({
            where: { id: business.id },
            data: {
              plan: "FREE",
              stripeSubscriptionId: null,
              stripeCurrentPeriodEnd: null,
            },
          });
        }
        break;
      }

      default:
        console.log(`Evento de Stripe no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error al procesar webhook de Stripe:", error);
    return NextResponse.json(
      { error: "Error en el procesamiento del evento." },
      { status: 500 }
    );
  }
}
