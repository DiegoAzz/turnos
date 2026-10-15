import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

// GET /api/products - Obtener productos y ventas recientes del negocio
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessIdQuery = searchParams.get("businessId");

    let businessId = businessIdQuery;
    if (!businessId) {
      const current = await getCurrentBusiness();
      businessId = current?.id || null;
    }

    if (!businessId) {
      return NextResponse.json({ error: "Negocio no identificado" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });

    const recentSales = await prisma.productSale.findMany({
      where: { businessId },
      orderBy: { date: "desc" },
      take: 20,
      include: {
        product: {
          select: { name: true, category: true },
        },
      },
    });

    return NextResponse.json({
      products,
      recentSales,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

// POST /api/products - Crear nuevo producto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId: customBusinessId,
      name,
      description,
      price,
      costPrice = 0,
      stock = 0,
      category = "GENERAL",
      imageUrl,
    } = body;

    let businessId = customBusinessId;
    if (!businessId) {
      const current = await getCurrentBusiness();
      businessId = current?.id || null;
    }

    if (!businessId) {
      return NextResponse.json({ error: "Negocio no identificado" }, { status: 400 });
    }

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Nombre y precio del producto son obligatorios." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        businessId,
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price) || 0,
        costPrice: parseFloat(costPrice) || 0,
        stock: parseInt(stock, 10) || 0,
        category: category || "GENERAL",
        imageUrl: imageUrl?.trim() || null,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}

// PATCH /api/products - Editar producto o actualizar stock
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, price, costPrice, stock, category, active, imageUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "ID del producto requerido" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (description !== undefined) dataToUpdate.description = description?.trim() || null;
    if (price !== undefined) dataToUpdate.price = parseFloat(price) || 0;
    if (costPrice !== undefined) dataToUpdate.costPrice = parseFloat(costPrice) || 0;
    if (stock !== undefined) dataToUpdate.stock = parseInt(stock, 10) || 0;
    if (category !== undefined) dataToUpdate.category = category;
    if (active !== undefined) dataToUpdate.active = Boolean(active);
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl?.trim() || null;

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      product: updated,
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

// DELETE /api/products - Eliminar producto
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de producto requerido" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
