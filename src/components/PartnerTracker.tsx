"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Tracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref =
      searchParams.get("ref") ||
      searchParams.get("afiliado") ||
      searchParams.get("embajador") ||
      searchParams.get("socio");

    if (ref) {
      const cleanRef = ref.toUpperCase().trim();
      // Guardar cookie por 60 días
      document.cookie = `turnoya_partner_ref=${cleanRef}; path=/; max-age=${
        60 * 24 * 60 * 60
      }; SameSite=Lax`;
      console.log(`[TurnoYa] Embajador referido detectado y guardado: ${cleanRef}`);
    }
  }, [searchParams]);

  return null;
}

export default function PartnerTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
