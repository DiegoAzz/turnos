"use client";

import { useState, useRef } from "react";
import {
  Store,
  Upload,
  MapPin,
  Phone,
  FileText,
  X,
  Check,
  Sparkles,
  Camera,
  Trash2,
  Info,
} from "lucide-react";

interface BusinessProfileModalProps {
  business: any;
  onClose: () => void;
  onSaved: (updatedBusiness: any) => void;
}

export default function BusinessProfileModal({
  business,
  onClose,
  onSaved,
}: BusinessProfileModalProps) {
  const [name, setName] = useState(business.name || "");
  const [description, setDescription] = useState(business.description || "");
  const [address, setAddress] = useState(business.address || "");
  const [phone, setPhone] = useState(business.phone || "");
  const [logoUrl, setLogoUrl] = useState(business.logoUrl || "");
  const [currency, setCurrency] = useState(business.currency || "COP");
  const [category, setCategory] = useState(business.category || "BARBERIA");
  const [serviceModality, setServiceModality] = useState(business.serviceModality || "LOCAL");
  const [liveStatus, setLiveStatus] = useState(business.liveStatus || "OPEN");
  const [statusMessage, setStatusMessage] = useState(business.statusMessage || "");
  const [homeServiceFee, setHomeServiceFee] = useState<number>(business.homeServiceFee || 0);
  const [requireDepositForNew, setRequireDepositForNew] = useState<boolean>(Boolean(business.requireDepositForNew));
  const [depositAmount, setDepositAmount] = useState<number>(business.depositAmount || 0);
  const [depositPaymentInfo, setDepositPaymentInfo] = useState<string>(business.depositPaymentInfo || "");
  const [referralProgramEnabled, setReferralProgramEnabled] = useState<boolean>(Boolean(business.referralProgramEnabled));
  const [referralRewardText, setReferralRewardText] = useState<string>(business.referralRewardText || "");
  const [stationHardwarePin, setStationHardwarePin] = useState<string>(business.stationHardwarePin || "0000");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manejar subida de archivo de imagen desde teléfono o PC (convertir a base64 optimizado)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen debe ser menor a 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setLogoUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del negocio no puede estar vacío.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          name: name.trim(),
          category,
          serviceModality,
          description: description.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
          logoUrl: logoUrl.trim() || null,
          currency: currency.trim() || "COP",
          liveStatus,
          statusMessage: statusMessage.trim() || null,
          homeServiceFee: Number(homeServiceFee) || 0,
          requireDepositForNew,
          depositAmount: Number(depositAmount) || 0,
          depositPaymentInfo: depositPaymentInfo.trim() || null,
          referralProgramEnabled,
          referralRewardText: referralRewardText.trim() || null,
          stationHardwarePin: stationHardwarePin.trim() || "0000",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el perfil.");
      }

      setSuccess(true);
      onSaved(data.business);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Error al actualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">
                Personalizar mi Negocio
              </h3>
              <p className="text-xs text-gray-500">
                Edita tu logo, nombre, dirección y WhatsApp que ven los clientes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>¡Perfil actualizado con éxito! Guardando cambios...</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* SECCIÓN DEL LOGO */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/70 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo del negocio"
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm bg-white"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                  {name ? name.substring(0, 2).toUpperCase() : "TY"}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-xl shadow-md transition"
                title="Subir logo desde tu teléfono o computador"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h4 className="font-bold text-xs text-gray-900">Logo de tu Marca</h4>
              <p className="text-[11px] text-gray-500 leading-snug">
                Sube el logo de tu barbería o estética para que aparezca en tu página de reservas.
              </p>

              <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm"
                >
                  <Upload className="h-3 w-3 text-emerald-600" />
                  <span>Subir Imagen</span>
                </button>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Eliminar logo"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Quitar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* NOMBRE DEL NEGOCIO */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">
              Nombre de la Empresa o Establecimiento *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Barbería & Spa El Rey"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Puedes cambiar el nombre comercial sin alterar tu enlace de reservas (<code className="text-emerald-700">/p/{business.slug}</code>).
            </p>
          </div>

          {/* RUBRO Y MODALIDAD DE ATENCIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Rubro / Tipo de Negocio
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="BARBERIA">💈 Barbería / Peluquería</option>
                <option value="MANICURA_SPA">💅 Manicura, Uñas & Spa</option>
                <option value="SALUD_CONSULTORIO">🩺 Salud / Terapia / Consultorio</option>
                <option value="LAVADERO">🚗 Lavadero de Autos / Detailing</option>
                <option value="VETERINARIA">🐾 Veterinaria & Mascotas</option>
                <option value="OTRO">⚡ Otro Rubro / Servicios Generales</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Modalidad de Atención
              </label>
              <select
                value={serviceModality}
                onChange={(e) => setServiceModality(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="LOCAL">🏢 Solo en Local Físico</option>
                <option value="DOMICILIO">🚗 Solo a Domicilio</option>
                <option value="HIBRIDO">🔄 Híbrido (En Local y Domicilio)</option>
              </select>
            </div>
          </div>

          {/* DIRECCIÓN Y WHATSAPP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Dirección física
              </label>
              <div className="relative">
                <MapPin className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ej. Calle 10 # 43-20, Medellín"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                WhatsApp del Negocio
              </label>
              <div className="relative">
                <Phone className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ej. +57 310 601 7261"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* DESCRIPCIÓN O LEMA */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">
              Descripción o especialidad del negocio
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Especialistas en cortes degradados, perfilado de barba al vapor y cuidado capilar."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* PAÍS Y MONEDA DE LATINOAMÉRICA */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">
              País y Moneda de tus Precios (Latinoamérica)
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="COP">🇨🇴 Colombia - Peso colombiano (COP $)</option>
              <option value="USD">🇺🇸 Internacional / Dólar (USD $)</option>
              <option value="MXN">🇲🇽 México - Peso mexicano (MXN $)</option>
              <option value="PEN">🇵🇪 Perú - Sol peruano (PEN S/)</option>
              <option value="ARS">🇦🇷 Argentina - Peso argentino (ARS $)</option>
              <option value="CLP">🇨🇱 Chile - Peso chileno (CLP $)</option>
              <option value="BOB">🇧🇴 Bolivia - Boliviano (BOB Bs)</option>
              <option value="DOP">🇩🇴 Rep. Dominicana - Peso dominicano (DOP RD$)</option>
              <option value="GTQ">🇬🇹 Guatemala - Quetzal (GTQ Q)</option>
              <option value="CRC">🇨🇷 Costa Rica - Colón (CRC ₡)</option>
            </select>
            <p className="mt-1 text-[11px] text-gray-400">
              Todos los precios de tus citas, servicios y productos se mostrarán con el símbolo y formato de tu país.
            </p>
          </div>

          {/* ESTADO EN VIVO RÁPIDO */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Estado en Vivo del Establecimiento:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setLiveStatus("OPEN")}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  liveStatus === "OPEN"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>🟢</span>
                <span>Abierto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLiveStatus("LUNCH");
                  if (!statusMessage) setStatusMessage("En almuerzo, volvemos a las 2:00 PM");
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  liveStatus === "LUNCH"
                    ? "bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>🟡</span>
                <span>Almuerzo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLiveStatus("CLOSED_TODAY");
                  if (!statusMessage) setStatusMessage("Cerrado por día festivo. Agenda para mañana.");
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  liveStatus === "CLOSED_TODAY"
                    ? "bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-500"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>🔴</span>
                <span>Cerrado Hoy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLiveStatus("SPECIAL_NOTICE");
                  if (!statusMessage) setStatusMessage("Atendiendo en horario especial");
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  liveStatus === "SPECIAL_NOTICE"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-800 ring-1 ring-indigo-500"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>📢</span>
                <span>Novedad</span>
              </button>
            </div>

            {liveStatus !== "OPEN" && (
              <input
                type="text"
                placeholder="Escribe el mensaje o indicación que verán los clientes..."
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                className="mt-2 w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          {/* RECARGO POR SERVICIO A DOMICILIO */}
          <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <span>🛵 Recargo por Servicio a Domicilio</span>
                </label>
                <p className="text-[11px] text-purple-800 mt-0.5">
                  Si vas a la casa o trabajo del cliente, este valor se suma automáticamente al precio del servicio.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-bold text-gray-500">{currency} $</span>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="Ej. 15000"
                value={homeServiceFee || ""}
                onChange={(e) => setHomeServiceFee(Number(e.target.value) || 0)}
                className="w-36 bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-purple-500"
              />
              <span className="text-[11px] text-gray-400">(0 = sin recargo)</span>
            </div>
          </div>

          {/* ANTICIPO A CLIENTES NUEVOS */}
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <span>🛡️ Exigir Anticipo / Seña a Clientes Nuevos</span>
                </label>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Garantiza que la clienta nueva no te deje plantada y no pierdas tiempo ni dinero.
                </p>
              </div>
              <input
                type="checkbox"
                checked={requireDepositForNew}
                onChange={(e) => setRequireDepositForNew(e.target.checked)}
                className="h-5 w-5 text-amber-600 rounded-lg border-gray-300 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            {requireDepositForNew && (
              <div className="space-y-2.5 pt-2 border-t border-amber-200/60 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Monto de anticipo requerido ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ej. 10000"
                    value={depositAmount || ""}
                    onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                    className="w-full sm:w-48 bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Datos para pago (Nequi, Daviplata, Bancolombia)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Nequi o Daviplata al 310 601 7261. Envía el comprobante de tu anticipo por WhatsApp para confirmar tu cupo."
                    value={depositPaymentInfo}
                    onChange={(e) => setDepositPaymentInfo(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* PROGRAMA DE AMIGAS / CLIENTES REFERIDOS */}
          <div className="p-4 bg-pink-50/70 rounded-2xl border border-pink-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-pink-950 flex items-center gap-1.5">
                  <span>🎁 Programa de Amigas Referidas</span>
                </label>
                <p className="text-[11px] text-pink-900 mt-0.5">
                  Premia a tus clientas cuando te recomienden amigas y llenen tu agenda.
                </p>
              </div>
              <input
                type="checkbox"
                checked={referralProgramEnabled}
                onChange={(e) => setReferralProgramEnabled(e.target.checked)}
                className="h-5 w-5 text-pink-600 rounded-lg border-gray-300 focus:ring-pink-500 cursor-pointer"
              />
            </div>

            {referralProgramEnabled && (
              <div className="pt-2 border-t border-pink-200/60 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-pink-900 mb-1">
                  Beneficio / Premio por invitar
                </label>
                <input
                  type="text"
                  placeholder="Ej. ¡Por cada 2 amigas que invites, recibe un 20% de descuento en tu próximo servicio!"
                  value={referralRewardText}
                  onChange={(e) => setReferralRewardText(e.target.value)}
                  className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            )}
          </div>

          {/* PIN DE BOTONERA DE ESTACIÓN / HARDWARE */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span>🔌 PIN de Botonera de Estación / Hardware</span>
            </label>
            <p className="text-[11px] text-gray-500">
              PIN de 4 dígitos para proteger tu botonera física o tablet de pared (por defecto 0000 = sin PIN).
            </p>
            <input
              type="text"
              maxLength={6}
              value={stationHardwarePin}
              onChange={(e) => setStationHardwarePin(e.target.value)}
              className="w-28 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-mono font-bold text-center focus:outline-none focus:border-emerald-500 mt-1"
            />
          </div>

          {/* BOTONES DE GUARDADO */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Personalización ✓"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
