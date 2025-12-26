import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { CuponExitoso } from "../../components/ui/CuponExitoso";
import { useAuth } from "@clerk/clerk-react";
import { PagoControl } from "../../../Backend/Controlador/PagoControl";
import { PlanControl } from "../../../Backend/Controlador/PlanControl";
import { CuponVerificacionResponse } from "../../../Backend/Dto/CuponDTO";
import { CuponControl } from "../../../Backend/Controlador/CuponControl";

export type PaymentMethod = "yape" | "paypal";

interface PlanInfo {
  code: string;
  name: string;
  price: number;
  period: "monthly" | "annual";
}

const MAX_FILE_MB = 5;

export default function ProcesoDePago() {
  const navigate = useNavigate();
  const location = useLocation();
  const planInfo = location.state ? (location.state as PlanInfo) : null;
  const [method, setMethod] = useState<PaymentMethod>("yape");
  const [senderName, setSenderName] = useState("");
  const [lastName, setLastName] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [cuponCodigo, setCuponCodigo] = useState<string>("");
  const [cuponVerificado, setCuponVerificado] = useState<CuponVerificacionResponse | null>(null);
  const [aplicandoCupon, setAplicandoCupon] = useState(false);
  const [mostrarAnimacion, setMostrarAnimacion] = useState(false);
  const planControl = new PlanControl();
  const cuponControl = new CuponControl();

  useEffect(() => {
    const init = async () => {
      // Verificar si tenemos la información del plan en el estado de navegación
      if (!location.state) {
        navigate("/perks", { replace: true });
        return;
      }

      if (!planInfo) {
        navigate("/perks", { replace: true });
        return;
      }

      // Obtener la lista de planes y encontrar el ID correspondiente
      try {
        const token = await getToken();
        const planes = await planControl.obtenerPlanes(token);
        
        const plan = planes.find(p => p.codigo === planInfo.code);
        if (plan) {
          setPlanId(plan.id);
        } else {
          console.error("Plan no encontrado para código:", planInfo.code);
          setError("Plan no encontrado");
          navigate("/perks", { replace: true });
        }
      } catch (e) {
        console.error('Error al obtener planes:', e);
        setError("Error al cargar información del plan");
      }
    };

    init();
  }, []);


  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    const isAllowed = ["image/png", "image/jpeg", "application/pdf"].includes(
      f.type
    );
    if (!isAllowed) {
      setError("Formato no permitido. Usa PNG, JPG o PDF.");
      setFile(null);
      return;
    }
    const sizeMb = f.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_MB) {
      setError(`El archivo supera ${MAX_FILE_MB}MB.`);
      setFile(null);
      return;
    }
    setFile(f);
  }

  const { getToken } = useAuth();
  const pagoControl = new PagoControl();

  async function handleSave() {
    setError("");

    if (method === "yape") {
      if (!planId) {
        setError("Error al cargar el plan. Por favor, intenta nuevamente.");
        return;
      }
      if (!senderName.trim()) {
        setError("Ingresa tu nombre.");
        return;
      }
      if (!lastName.trim()) {
        setError("Ingresa tu apellido.");
        return;
      }

        try {
          setSaving(true);
          const token = await getToken();
          
          if (!token) {
            setError("No se pudo verificar tu identidad. Por favor, inicia sesión nuevamente.");
            return;
          }
          
          const verificacion = await pagoControl.verificarPago(token, {
          primer_nombre: senderName.trim(),
          primer_apellido: lastName.trim(),
          id_plan: planId || '',
          codigo_seguridad: securityCode.trim() || "000",
          ...(planInfo?.period === 'monthly' && { codigo_cupon: cuponVerificado?.id }),
          periodo: planInfo?.period || 'monthly'
        });

        if (!verificacion.aprobado) {
          let errorMessage = '';
          
          // Caso: Monto incorrecto
          if (verificacion.pago_realizado && verificacion.precio_plan) {
            errorMessage = "Error en la verificación del pago\n\n";
            errorMessage += `Has pagado ${verificacion.pago_realizado}, pero el plan cuesta ${verificacion.precio_plan}.\n\n`;
            errorMessage += "Por favor, realiza un nuevo pago por el monto exacto del plan.";
          } 
          // Caso: No se encuentra el pago
          else if (verificacion.debug?.pagos_encontrados === 0) {
            errorMessage = `Verificación fallida para ${verificacion.debug.nombre_buscado} ${verificacion.debug.apellido_buscado}`;
            if (verificacion.debug.codigo_seguridad) {
              errorMessage += ` (Código: ${verificacion.debug.codigo_seguridad})`;
            }
            errorMessage += "\n\n¿Acabas de realizar el pago? Espera unos minutos y vuelve a intentar.";
          }
          // Caso: Error general
          else {
            errorMessage = verificacion.error || "No se pudo verificar el pago";
          }

          // Siempre agregar información de contacto
          errorMessage += "\n\nSi necesitas ayuda, envía una captura de tu pago al +51 933826740.";
          
          setError(errorMessage);
          return;
        }

        // Actualizar el estado de la suscripción
        // El pago fue exitoso
        if (verificacion.aprobado) {
          // Redirigir inmediatamente
          navigate("/perks", { replace: true });
        }
      } catch (e: any) {
        console.error('Error al procesar el pago:', e);
        
        // Construir mensaje de error amigable
        let errorMessage = "";
        const responseData = e.response?.data;
        
        // Verificar si es un error de monto incorrecto
        if (responseData?.pago_realizado && responseData?.precio_plan) {
          errorMessage = `El monto del pago (${responseData.pago_realizado}) es diferente al precio del plan (${responseData.precio_plan})\n\n`;
          errorMessage += "Por favor, realiza un nuevo pago por el monto exacto.";
        }
        // Verificar si es un error de pago no encontrado
        else if (responseData?.debug?.pagos_encontrados === 0) {
          const nombre = responseData.debug.nombre_buscado;
          const apellido = responseData.debug.apellido_buscado;
          const codigo = responseData.debug.codigo_seguridad;
          
          errorMessage = `No encontramos ningún pago registrado para:\n`;
          errorMessage += `${nombre} ${apellido}`;
          if (codigo) {
            errorMessage += ` (Código: ${codigo})`;
          }
          
          errorMessage += `\n\n¿Acabas de hacer el pago? Por favor espera unos minutos y vuelve a intentar.`;
        }
        // Error genérico o desconocido
        else {
          errorMessage = responseData?.error || "No se pudo procesar el pago. Intenta nuevamente.";
        }

        // Agregar mensaje de ayuda
        errorMessage += `\n\nSi necesitas ayuda, envía una captura de tu pago por WhatsApp al +51 933826740.`;
        
        setError(errorMessage);
      } finally {
        setSaving(false);
      }
    } 
    // <-- Close the if (method === "yape") block here

    else if (method === "paypal") {
      if (!senderName.trim()) {
        setError("Ingresa el nombre del remitente.");
        return;
      }
      if (!file) {
        setError("Adjunta el comprobante de pago.");
        return;
      }

      try {
        setSaving(true);
        // TODO: Implementar lógica de PayPal
        await new Promise((r) => setTimeout(r, 900));
        navigate("/perks");
      } catch (e) {
        setError("No se pudo procesar el pago. Intenta nuevamente.");
      } finally {
        setSaving(false);
      }
    }
  }

  return (
    <div className="space-y-6">
      {mostrarAnimacion && (
        <CuponExitoso
          esGratis={true}
          onRedirect="/dashboard"
          onFinish={() => {
            setMostrarAnimacion(false);
          }}
        />
      )}
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/perks")}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Proceso de Pago</h1>
          <p className="text-sm text-gray-400">
            Plan {planInfo?.name} - {planInfo?.period === "annual" ? "Anual" : "Mensual"}
          </p>
          <p className="text-sm font-semibold text-purple-400">
            S/. {planInfo?.price.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Sección de Cupón - Solo para planes mensuales */}
      {planInfo?.period === "monthly" && (
        <section className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
          <h2 className="mb-4 text-lg font-semibold">¿Tienes un cupón?</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ingresa tu código de cupón"
              value={cuponCodigo}
              onChange={(e) => {
                setCuponCodigo(e.target.value.toUpperCase());
                setCuponVerificado(null);
                setError("");
              }}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-gray-400"
            />
            <button
              onClick={async () => {
                if (!cuponCodigo.trim()) {
                  setError("Ingresa un código de cupón");
                  return;
                }
                if (!planId) {
                  setError("Error al cargar el plan");
                  return;
                }
                
                setAplicandoCupon(true);
                setError("");
                
                try {
                  const token = await getToken();
                  const verificacion = await cuponControl.verificarCupon(token, {
                    codigo: cuponCodigo,
                    id_plan: planId,
                    ciclo: planInfo?.period === 'annual' ? 'anual' : 'mensual'
                  });
                  
                  setCuponVerificado(verificacion);
                  
                  if (verificacion.flujo_sugerido === 'gratis') {
                    try {
                      await cuponControl.redimirCupon(token, {
                        codigo: cuponCodigo,
                        id_plan: planId,
                        ciclo: planInfo?.period === 'annual' ? 'anual' : 'mensual'
                      });
                      setMostrarAnimacion(true);
                    } catch (e: any) {
                      setError(e.message || "Error al redimir el cupón");
                    }
                  }
                } catch (e: any) {
                  setError(e.message || "Cupón inválido");
                  setCuponVerificado(null);
                } finally {
                  setAplicandoCupon(false);
                }
              }}
              disabled={aplicandoCupon}
              className="rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {aplicandoCupon ? "Verificando..." : "Aplicar"}
            </button>
          </div>

          {cuponVerificado && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
              <p className="font-medium">¡Cupón aplicado!</p>
              <p className="mt-1 text-sm">
                {cuponVerificado.es_gratis
                  ? "Plan gratuito activado"
                  : `Descuento del ${cuponVerificado.valor}% aplicado`}
              </p>
              <p className="mt-2 text-sm">
                Precio final:{" "}
                <span className="font-medium">
                  S/ {(cuponVerificado.precio_final / 100).toFixed(2)}
                </span>
                {!cuponVerificado.es_gratis && (
                  <span className="ml-2 text-gray-400 line-through">
                    S/ {(cuponVerificado.precio_original / 100).toFixed(2)}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Grid de opciones */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Métodos de pago */}
        <section className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
          <h2 className="mb-4 text-lg font-semibold">Método de Pago</h2>
          
          <div className="space-y-3">
            <PaymentOption
              active={method === "yape"}
              onClick={() => setMethod("yape")}
              title="Yape"
              subtitle="Pago inmediato por Yape"
              confirmation="Se procesará al momento"
              holder="933826740"
            />

            <PaymentOption
              active={method === "paypal"}
              onClick={() => setMethod("paypal")}
              title="PayPal"
              subtitle="Pago con PayPal"
              confirmation="Requiere comprobante"
              holder="Lz7151919@gmail.com"
            />
          </div>
        </section>

        {/* Panel derecho - Detalles/Confirmación */}
        <section className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
          <h2 className="mb-4 text-lg font-semibold">
            {method === "paypal" ? "Enviar Comprobante" : "Información del Pago"}
          </h2>

          <div className="space-y-4">
            {method === "yape" ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-gray-300">Número de Yape</p>
                  <p className="mt-1 font-mono text-lg">933826740</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Nombre del Remitente
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Apellido del Remitente
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Tu apellido"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Código de Seguridad (opcional)
                  </label>
                  <input
                    type="text"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Código de seguridad si aplica"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-500/10 p-4 space-y-1">
                    <p className="text-sm font-medium text-red-400">Error en la verificación</p>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <p className="text-sm text-emerald-300">
                    Por favor realiza el pago por Yape al número indicado.
                    Asegúrate que el nombre y apellido coincidan con tu cuenta de Yape.
                  </p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !senderName.trim() || !lastName.trim()}
                  className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    "Verificar Pago"
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Nombre del Remitente
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-${method === 'paypal' ? 'blue' : 'purple'}-500 focus:outline-none focus:ring-1 focus:ring-${method === 'paypal' ? 'blue' : 'purple'}-500`}
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Comprobante de Pago
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={onPickFile}
                      accept="image/png,image/jpeg,application/pdf"
                      className="hidden"
                      id="receipt"
                    />
                    <label
                      htmlFor="receipt"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-gray-400 hover:bg-white/10 hover:text-white"
                    >
                      <Upload className="h-5 w-5" />
                      <span>
                        {file ? file.name : "Subir comprobante (PNG, JPG o PDF)"}
                      </span>
                    </label>
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving || !file || !senderName.trim()}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    "Enviar Comprobante"
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  title,
  subtitle,
  confirmation,
  holder,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  confirmation: string;
  holder: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-2xl border p-4 text-left transition",
        active
          ? `${title === "PayPal" ? "border-blue-400/40 bg-blue-500/10 ring-2 ring-blue-400/30" : "border-purple-400/40 bg-purple-500/10 ring-2 ring-purple-400/30"}`
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
      ].join(" ")}
      aria-pressed={active}
      role="radio"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-300">{subtitle}</p>
          <p className="mt-0.5 text-base font-semibold text-white">{title}</p>
          <div className="mt-2 flex flex-col gap-0.5 text-sm text-gray-300">
            <span>{confirmation}</span>
            <span className="font-mono">{holder}</span>
          </div>
        </div>
        <div
          className={[
            "mt-1 grid h-5 w-5 place-items-center rounded-full border",
            active ? (title === "PayPal" ? "border-blue-300" : "border-purple-300") : "border-white/20",
          ].join(" ")}
        >
          <div
            className={[
              "h-2.5 w-2.5 rounded-full",
              active ? (title === "PayPal" ? "bg-blue-300" : "bg-purple-300") : "bg-transparent",
            ].join(" ")}
          />
        </div>
      </div>
    </button>
  );
}
