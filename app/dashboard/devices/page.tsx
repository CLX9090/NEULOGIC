"use client"

import { useState } from "react"
import { useDevices } from "@/hooks/use-devices"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Cpu,
  Plus,
  Loader2,
  Shield,
  Clock,
  Usb,
  Wifi,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Signal,
} from "lucide-react"
import { toast } from "sonner"

type SetupStep = "connect" | "wifi" | "provisioning" | "complete"

export default function DevicesPage() {
  const { deviceLinks, refetch, loading } = useDevices()
  const [open, setOpen] = useState(false)

  // Setup wizard state
  const [step, setStep] = useState<SetupStep>("connect")
  const [serialConnected, setSerialConnected] = useState(false)
  const [wifiSsid, setWifiSsid] = useState("")
  const [wifiPassword, setWifiPassword] = useState("")
  const [showWifiPassword, setShowWifiPassword] = useState(false)
  const [deviceName, setDeviceName] = useState("")
  const [childName, setChildName] = useState("")
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [provisionedDevice, setProvisionedDevice] = useState<{
    device_code: string
    auth_token: string
    device_name: string
  } | null>(null)
  const [showAuthToken, setShowAuthToken] = useState(false)
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null)

  function resetWizard() {
    setStep("connect")
    setSerialConnected(false)
    setWifiSsid("")
    setWifiPassword("")
    setShowWifiPassword(false)
    setDeviceName("")
    setChildName("")
    setConsentAccepted(false)
    setSubmitting(false)
    setProvisionedDevice(null)
    setShowAuthToken(false)
    if (serialPort) {
      try {
        serialPort.close()
      } catch {
        // ignore
      }
    }
    setSerialPort(null)
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetWizard()
    }
    setOpen(isOpen)
  }

  async function handleConnectSerial() {
    try {
      if (!("serial" in navigator)) {
        toast.error("Tu navegador no soporta Web Serial API", {
          description:
            "Usa Google Chrome o Microsoft Edge para conectar el ESP8266 por USB.",
        })
        return
      }

      const port = await (navigator as Navigator & { serial: Serial }).serial.requestPort({
        filters: [
          { usbVendorId: 0x1a86 }, // CH340
          { usbVendorId: 0x10c4 }, // CP210x
          { usbVendorId: 0x0403 }, // FTDI
        ],
      })

      await port.open({ baudRate: 115200 })
      setSerialPort(port)
      setSerialConnected(true)
      toast.success("ESP8266 detectado correctamente")
      setStep("wifi")
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotFoundError") {
        toast.error("No se selecciono ningun dispositivo", {
          description: "Asegurate de que el ESP8266 esta conectado por USB.",
        })
      } else {
        toast.error("Error al conectar con el ESP8266", {
          description: "Verifica la conexion USB e intentalo de nuevo.",
        })
      }
    }
  }

  async function handleProvision() {
    if (!consentAccepted) {
      toast.error("Debes aceptar el consentimiento para continuar")
      return
    }

    setSubmitting(true)
    setStep("provisioning")

    try {
      // Step 1: Provision the device on the server
      const res = await fetch("/api/devices/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_name: deviceName || undefined,
          child_name: childName || undefined,
          consent_accepted: consentAccepted,
          wifi_ssid: wifiSsid || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || "Error al provisionar dispositivo")
        setStep("wifi")
        setSubmitting(false)
        return
      }

      // Step 2: Send config to ESP8266 via Serial
      if (serialPort && serialPort.writable) {
        try {
          const writer = serialPort.writable.getWriter()
          const config = JSON.stringify({
            cmd: "config",
            ssid: wifiSsid,
            pass: wifiPassword,
            token: json.device.auth_token,
            server: window.location.origin,
            endpoint: "/api/v1/data",
          })
          const encoder = new TextEncoder()
          await writer.write(encoder.encode(config + "\n"))
          writer.releaseLock()
          toast.success("Configuracion enviada al ESP8266")
        } catch {
          toast.info(
            "No se pudo enviar la configuracion al ESP8266 por serial. Usa el token manualmente."
          )
        }
      }

      setProvisionedDevice({
        device_code: json.device.device_code,
        auth_token: json.device.auth_token,
        device_name: json.device.device_name,
      })
      setStep("complete")
      await refetch()
    } catch {
      toast.error("Error de conexion al servidor")
      setStep("wifi")
    } finally {
      setSubmitting(false)
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado al portapapeles`)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dispositivos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los ESP8266 vinculados a tu cuenta
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar dispositivo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Configurar ESP8266
              </DialogTitle>
              <DialogDescription>
                Conecta tu ESP8266 por USB para configurar la red WiFi y vincularlo a tu cuenta
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 py-2">
              {(["connect", "wifi", "provisioning", "complete"] as SetupStep[]).map(
                (s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        step === s
                          ? "bg-primary text-primary-foreground"
                          : (["connect", "wifi", "provisioning", "complete"].indexOf(step) >
                              i)
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {["connect", "wifi", "provisioning", "complete"].indexOf(step) > i ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < 3 && (
                      <div
                        className={`h-px w-6 ${
                          ["connect", "wifi", "provisioning", "complete"].indexOf(step) > i
                            ? "bg-primary"
                            : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                )
              )}
            </div>

            {/* Step 1: Connect USB */}
            {step === "connect" && (
              <div className="flex flex-col gap-4 py-2">
                <div className="rounded-lg border border-border bg-muted/30 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Usb className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Conectar ESP8266 por USB
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Se requiere Google Chrome o Microsoft Edge
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <p>1. Conecta tu ESP8266 al computador usando un cable USB</p>
                    <p>2. Asegurate de que el driver CH340/CP210x esta instalado</p>
                    <p>
                      3. Haz clic en el boton de abajo y selecciona el puerto serial del ESP8266
                    </p>
                  </div>
                  <div className="mt-2 rounded-md border border-chart-3/30 bg-chart-3/5 p-2.5 text-xs text-chart-3">
                    <AlertCircle className="mb-1 inline h-3.5 w-3.5" /> El navegador pedira
                    permiso para acceder al puerto serial. Es seguro aceptar.
                  </div>
                </div>
                <Button
                  onClick={handleConnectSerial}
                  className="w-full"
                  size="lg"
                >
                  <Usb className="mr-2 h-4 w-4" />
                  Detectar ESP8266
                </Button>
              </div>
            )}

            {/* Step 2: WiFi Config + Consent */}
            {step === "wifi" && (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex items-center gap-2 rounded-lg border border-chart-2/30 bg-chart-2/5 p-3 text-xs text-chart-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    ESP8266 conectado correctamente por USB
                  </span>
                </div>

                {/* WiFi Config */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Configuracion de Red WiFi
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="wifiSsid" className="text-xs text-foreground">
                        Nombre de la red
                      </Label>
                      <Input
                        id="wifiSsid"
                        placeholder="Mi_Red_WiFi"
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="wifiPassword" className="text-xs text-foreground">
                        Contrasena
                      </Label>
                      <div className="relative">
                        <Input
                          id="wifiPassword"
                          type={showWifiPassword ? "text" : "password"}
                          placeholder="Contrasena de la red"
                          value={wifiPassword}
                          onChange={(e) => setWifiPassword(e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                          onClick={() => setShowWifiPassword(!showWifiPassword)}
                          type="button"
                        >
                          {showWifiPassword ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device Info */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deviceName" className="text-xs text-foreground">
                      Nombre del dispositivo (opcional)
                    </Label>
                    <Input
                      id="deviceName"
                      placeholder="Ej: Sensor salon de clases"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="childName" className="text-xs text-foreground">
                      Nombre del menor (opcional)
                    </Label>
                    <Input
                      id="childName"
                      placeholder="Nombre del nino/a"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* RGPD/COPPA Consent */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Consentimiento RGPD/COPPA
                    </span>
                  </div>
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                    Al vincular este dispositivo ESP8266, autorizo expresamente el
                    tratamiento de datos sensoriales (conductancia cutanea, niveles de
                    sonido y aceleracion) del menor identificado. Estos datos se procesan
                    unicamente con fines de monitoreo del bienestar sensorial, conforme al
                    Reglamento General de Proteccion de Datos (RGPD) y la Ley de
                    Proteccion de la Privacidad Infantil en Linea (COPPA). Los datos son
                    accesibles exclusivamente por los tutores autorizados vinculados a
                    este dispositivo.
                  </p>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="consent"
                      checked={consentAccepted}
                      onCheckedChange={(checked) =>
                        setConsentAccepted(checked === true)
                      }
                    />
                    <Label
                      htmlFor="consent"
                      className="text-xs leading-relaxed text-foreground"
                    >
                      Acepto el tratamiento de datos del menor y confirmo que tengo la
                      autoridad legal para otorgar este consentimiento.
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleProvision}
                    disabled={!wifiSsid || !consentAccepted || submitting}
                    className="w-full"
                    size="lg"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Configurar y vincular
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* Step 3: Provisioning in progress */}
            {step === "provisioning" && (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Configurando dispositivo y generando token de autenticacion...
                </p>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === "complete" && provisionedDevice && (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex items-center gap-2 rounded-lg border border-chart-2/30 bg-chart-2/5 p-3 text-sm text-chart-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="font-medium">
                    Dispositivo configurado y vinculado correctamente
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    Datos del dispositivo
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Codigo del dispositivo
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-foreground">
                          {provisionedDevice.device_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            copyToClipboard(
                              provisionedDevice.device_code,
                              "Codigo"
                            )
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Auth Token - Critical */}
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-chart-4" />
                        <span className="text-xs font-semibold text-foreground">
                          Token de autenticacion unico
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 overflow-hidden rounded bg-secondary px-2 py-1 text-xs font-mono text-foreground">
                          {showAuthToken
                            ? provisionedDevice.auth_token
                            : "********************************"}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setShowAuthToken(!showAuthToken)}
                        >
                          {showAuthToken ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() =>
                            copyToClipboard(
                              provisionedDevice.auth_token,
                              "Token"
                            )
                          }
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-chart-4">
                        Este token vincula exclusivamente este ESP8266 con tu cuenta.
                        Los datos enviados con este token solo seran visibles por ti.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleOpenChange(false)}
                  className="w-full"
                  size="lg"
                >
                  Finalizar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Device List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : deviceLinks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cpu className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Sin dispositivos
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Conecta tu primer ESP8266 por USB para empezar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deviceLinks.map((link) => (
            <Card key={link.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Cpu className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-foreground">
                        {link.devices.device_name || link.devices.device_code}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Signal className="h-3 w-3" />
                        {link.devices.device_code}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={link.is_active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {link.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 text-sm">
                  {link.child_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Menor</span>
                      <span className="font-medium text-foreground">
                        {link.child_name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estado</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          link.devices.is_online ? "bg-success" : "bg-muted-foreground/40"
                        }`}
                      />
                      <span className="text-xs text-foreground">
                        {link.devices.is_online ? "En linea" : "Desconectado"}
                      </span>
                    </div>
                  </div>
                  {link.devices.wifi_ssid && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">WiFi</span>
                      <div className="flex items-center gap-1">
                        <Wifi className="h-3 w-3 text-primary" />
                        <span className="text-xs text-foreground">
                          {link.devices.wifi_ssid}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Consentimiento</span>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-success" />
                      <span className="text-xs text-success">Aceptado</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vinculado</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-foreground">
                        {formatDate(link.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
