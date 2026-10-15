import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD") {
  try {
    const cur = (currency || "USD").toUpperCase().trim();
    if (cur === "COP") {
      return `$ ${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(amount)} COP`;
    }
    if (cur === "USD") {
      return `$ ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)} USD`;
    }
    if (cur === "MXN") {
      return `$ ${new Intl.NumberFormat("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)} MXN`;
    }
    if (cur === "PEN") {
      return `S/ ${new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
    }
    if (cur === "ARS") {
      return `$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount)} ARS`;
    }
    if (cur === "CLP") {
      return `$ ${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(amount)} CLP`;
    }
    if (cur === "BOB") {
      return `Bs ${new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
    }
    if (cur === "DOP") {
      return `RD$ ${new Intl.NumberFormat("es-DO", { maximumFractionDigits: 0 }).format(amount)}`;
    }
    if (cur === "GTQ") {
      return `Q ${new Intl.NumberFormat("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
    }
    if (cur === "CRC") {
      return `₡ ${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 0 }).format(amount)}`;
    }

    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$ ${amount} ${currency}`;
  }
}

export function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
