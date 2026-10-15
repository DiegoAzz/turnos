import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/finances?businessId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        appointments: {
          where: { status: "COMPLETED" },
          include: { service: true },
          orderBy: { date: "desc" },
        },
        expenses: {
          orderBy: { date: "desc" },
        },
        productSales: {
          include: { product: true },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // 1. Ingresos por servicios / citas completadas
    const completedAppointments = business.appointments || [];
    const ingresosServicios = completedAppointments.reduce(
      (sum, a) => sum + (a.service?.price || 0),
      0
    );

    // 2. Ingresos por venta de productos en mostrador / tienda
    const productSales = business.productSales || [];
    const ingresosProductos = productSales.reduce((sum, s) => sum + s.total, 0);

    // 3. Ingresos totales combinados
    const totalIncome = ingresosServicios + ingresosProductos;

    // Desglose de ingresos por método de pago (Servicios + Productos)
    const incomeByMethod: Record<string, number> = {
      EFECTIVO: 0,
      NEQUI: 0,
      BANCOLOMBIA: 0,
      TARJETA: 0,
    };

    completedAppointments.forEach((a) => {
      const method = (a.paymentMethod || "EFECTIVO").toUpperCase();
      const price = a.service?.price || 0;
      if (!incomeByMethod[method]) incomeByMethod[method] = 0;
      incomeByMethod[method] += price;
    });

    productSales.forEach((s) => {
      const method = (s.paymentMethod || "EFECTIVO").toUpperCase();
      if (!incomeByMethod[method]) incomeByMethod[method] = 0;
      incomeByMethod[method] += s.total;
    });

    // Gastos
    const expenses = business.expenses || [];
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Ganancia Neta Real
    const netProfit = totalIncome - totalExpenses;

    return NextResponse.json({
      totalIncome,
      ingresosServicios,
      ingresosProductos,
      totalExpenses,
      netProfit,
      incomeByMethod,
      expenses,
      productSales: productSales.slice(0, 30),
      completedAppointments: completedAppointments.slice(0, 50),
      currency: business.currency || "COP",
      plan: business.plan,
    });
  } catch (error) {
    console.error("Error al obtener datos contables:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

// POST /api/finances - Registrar nuevo gasto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, description, amount, category, date } = body;

    if (!businessId || !description || amount === undefined) {
      return NextResponse.json(
        { error: "businessId, description y amount son obligatorios" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        businessId,
        description: description.trim(),
        amount: parseFloat(amount),
        category: category || "INSUMOS",
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error("Error al registrar gasto:", error);
    return NextResponse.json({ error: "Error al guardar gasto" }, { status: 500 });
  }
}

// DELETE /api/finances?id=... - Eliminar un gasto
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    return NextResponse.json({ error: "Error al eliminar gasto" }, { status: 500 });
  }
}
