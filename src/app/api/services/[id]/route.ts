import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, durationMinutes, price, active } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (durationMinutes) dataToUpdate.durationMinutes = parseInt(durationMinutes);
    if (price !== undefined) dataToUpdate.price = parseFloat(price);
    if (active !== undefined) dataToUpdate.active = Boolean(active);

    const service = await prisma.service.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Error al actualizar servicio:", error);
    return NextResponse.json(
      { error: "Error al actualizar el servicio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    return NextResponse.json(
      { error: "Error al eliminar el servicio" },
      { status: 500 }
    );
  }
}
