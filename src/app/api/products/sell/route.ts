import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

// POST /api/products/sell - Registrar venta rápida de un producto y descontar stock
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      quantity = 1,
      paymentMethod = "EFECTIVO",
      clientName,
      unitPrice,
    } = body;

    if (!productId) {
      return NextResponse.json({ error: "Producto no especificado" }, { status: 400 });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    // Buscar producto
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    if (product.stock < qty) {
      return NextResponse.json(
        {
          error: `Stock insuficiente. Solo quedan ${product.stock} unidades de "${product.name}".`,
        },
        { status: 400 }
      );
    }

    const price = unitPrice !== undefined ? parseFloat(unitPrice) : product.price;
    const total = price * qty;

    // Ejecutar en transacción: crear la venta y descontar el stock
    const [sale, updatedProduct] = await prisma.$transaction([
      prisma.productSale.create({
        data: {
          businessId: product.businessId,
          productId: product.id,
          quantity: qty,
          unitPrice: price,
          total,
          paymentMethod: paymentMethod || "EFECTIVO",
          clientName: clientName?.trim() || "Cliente en Mostrador",
        },
      }),
      prisma.product.update({
        where: { id: product.id },
        data: {
          stock: {
            decrement: qty,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      sale,
      product: updatedProduct,
      message: `Venta registrada: ${qty}x ${product.name} (${total})`,
    });
  } catch (error) {
    console.error("Error al registrar venta de producto:", error);
    return NextResponse.json({ error: "Error al registrar la venta" }, { status: 500 });
  }
}
