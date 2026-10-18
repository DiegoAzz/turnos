import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = await getCurrentBusiness();
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID de barbero requerido" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name.trim();
    if (body.phone !== undefined) dataToUpdate.phone = body.phone?.trim() || null;
    if (body.email !== undefined) dataToUpdate.email = body.email?.trim() || null;
    if (body.pin !== undefined) dataToUpdate.pin = String(body.pin).trim();
    if (body.commissionRate !== undefined) {
      dataToUpdate.commissionRate = typeof body.commissionRate === "number" ? body.commissionRate : parseFloat(body.commissionRate);
    }
    if (body.chairNumber !== undefined) {
      dataToUpdate.chairNumber = parseInt(String(body.chairNumber), 10) || 1;
    }
    if (body.chairLabel !== undefined) {
      dataToUpdate.chairLabel = body.chairLabel.trim();
    }
    if (typeof body.active === "boolean") {
      dataToUpdate.active = body.active;
    }

    const updated = await prisma.staffMember.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      barber: updated,
    });
  } catch (error) {
    console.error("Error al actualizar barbero:", error);
    return NextResponse.json({ error: "Error al actualizar información del barbero" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID de barbero requerido" }, { status: 400 });
    }

    await prisma.staffMember.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Barbero eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar barbero:", error);
    return NextResponse.json({ error: "Error al eliminar el barbero" }, { status: 500 });
  }
}
