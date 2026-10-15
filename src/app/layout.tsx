import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PartnerTracker from "@/components/PartnerTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TurnoYa - Sistema de Agendamiento y Turnos Online por Appzplay",
  description: "Digitaliza tu negocio, agenda citas 24/7 y envía recordatorios automáticos por WhatsApp con TurnoYa por Appzplay.",
  metadataBase: new URL("https://turnos.appzplay.online"),
  openGraph: {
    title: "TurnoYa - Agenda de Citas Online por Appzplay",
    description: "Plataforma SaaS para barberías, spas, estéticas y consultorios. Citas automáticas y recordatorios por WhatsApp.",
    url: "https://turnos.appzplay.online",
    siteName: "TurnoYa por Appzplay",
    locale: "es_CO",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PartnerTracker />
        {children}
      </body>
    </html>
  );
}
