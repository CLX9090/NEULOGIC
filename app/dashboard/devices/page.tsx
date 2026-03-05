"use client"

import { useState, useRef, useCallback, useEffect } from "react"
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
  Download,
  TerminalSquare,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

type SetupStep = "connect" | "wifi" | "provisioning" | "uploading" | "verifying" | "complete"

// Generates the complete Arduino sketch for ESP8266 with simulated sensor data
function generateArduinoSketch(params: {
  ssid: string
  password: string
  authToken: string
  serverHost: string
  serverPath: string
}): string {
  return `/*
 * NeuroSense ESP8266 Firmware v1.0
 * Modo: Simulacion de sensores
 * 
 * Este sketch conecta el ESP8266 a WiFi y envia datos
 * simulados de sensores (GSR, sonido, acelerometro)
 * al servidor de NeuroSense para verificar la conexion.
 * 
 * Generado automaticamente por NeuroSense.
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURACION (generada automaticamente) =====
const char* WIFI_SSID     = "${params.ssid}";
const char* WIFI_PASSWORD = "${params.password}";
const char* AUTH_TOKEN    = "${params.authToken}";
const char* SERVER_HOST   = "${params.serverHost}";
const char* API_PATH      = "${params.serverPath}";
// =====================================================

const int SEND_INTERVAL_MS = 2000; // Enviar cada 2 segundos
unsigned long lastSendTime = 0;
int packetCount = 0;
bool configReceived = false;

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println();
  Serial.println("========================================");
  Serial.println("  NeuroSense ESP8266 v1.0 - Simulacion");
  Serial.println("========================================");
  Serial.println("STATUS:BOOTING");

  // Conectar a WiFi
  Serial.print("Conectando a WiFi: ");
  Serial.println(WIFI_SSID);
  Serial.println("STATUS:WIFI_CONNECTING");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi conectado! IP: ");
    Serial.println(WiFi.localIP());
    Serial.println("STATUS:WIFI_CONNECTED");
    Serial.print("RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("ERROR: No se pudo conectar a WiFi");
    Serial.println("STATUS:WIFI_FAILED");
    Serial.println("Reiniciando en 10 segundos...");
    delay(10000);
    ESP.restart();
  }
  
  Serial.println("STATUS:READY");
  Serial.println("Iniciando envio de datos simulados...");
  Serial.println("----------------------------------------");
}

// Genera valores simulados de sensor GSR
float simulateGSR() {
  float base = 0.3 + (random(0, 100) / 100.0) * 0.4;
  float noise = (random(-50, 50) / 1000.0);
  return constrain(base + noise, 0.0, 1.0);
}

// Genera valores simulados de sonido ambiental
float simulateSound() {
  float base = 60.0 + random(0, 80);
  float noise = random(-10, 10);
  return constrain(base + noise, 0.0, 255.0);
}

// Genera valores simulados de acelerometro
void simulateAccel(float &ax, float &ay, float &az) {
  ax = random(-200, 200) + (random(-50, 50) / 10.0);
  ay = random(-200, 200) + (random(-50, 50) / 10.0);
  az = 1024.0 + random(-100, 100) + (random(-50, 50) / 10.0);
}

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("STATUS:WIFI_DISCONNECTED");
    Serial.println("Reconectando WiFi...");
    WiFi.reconnect();
    delay(5000);
    return;
  }

  float gsr = simulateGSR();
  float sound = simulateSound();
  float ax, ay, az;
  simulateAccel(ax, ay, az);
  unsigned long sentAt = millis();

  // Construir JSON
  StaticJsonDocument<256> doc;
  doc["auth_token"] = AUTH_TOKEN;
  doc["gsr"] = gsr;
  doc["sound"] = sound;
  doc["accel_x"] = ax;
  doc["accel_y"] = ay;
  doc["accel_z"] = az;
  doc["sent_at"] = sentAt;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // Enviar via HTTP
  WiFiClient client;
  HTTPClient http;
  
  String url = String("http://") + SERVER_HOST + API_PATH;
  
  Serial.print("Enviando paquete #");
  Serial.print(++packetCount);
  Serial.print(" -> ");
  
  unsigned long sendStart = millis();
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(jsonPayload);
  unsigned long rtt = millis() - sendStart;
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("HTTP ");
    Serial.print(httpCode);
    Serial.print(" | RTT: ");
    Serial.print(rtt);
    Serial.println("ms");
    
    if (httpCode == 200) {
      Serial.println("STATUS:DATA_SENT");
      Serial.print("DATA:");
      Serial.print("gsr=");
      Serial.print(gsr, 3);
      Serial.print(",sound=");
      Serial.print(sound, 1);
      Serial.print(",ax=");
      Serial.print(ax, 1);
      Serial.print(",ay=");
      Serial.print(ay, 1);
      Serial.print(",az=");
      Serial.print(az, 1);
      Serial.print(",rtt=");
      Serial.println(rtt);
    } else {
      Serial.print("STATUS:HTTP_ERROR:");
      Serial.println(httpCode);
      Serial.print("Response: ");
      Serial.println(response);
    }
  } else {
    Serial.print("STATUS:CONNECTION_FAILED:");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
}

void loop() {
  // Verificar comandos Serial
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    if (cmd == "PING") {
      Serial.println("PONG:NEUROSENSE_ESP8266_v1.0");
    } else if (cmd == "STATUS") {
      Serial.print("WiFi: ");
      Serial.println(WiFi.status() == WL_CONNECTED ? "Conectado" : "Desconectado");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
      Serial.print("Paquetes enviados: ");
      Serial.println(packetCount);
    } else if (cmd == "VERIFY") {
      Serial.println("VERIFY:OK:NEUROSENSE");
    }
  }

  // Enviar datos periodicamente
  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;
    sendSensorData();
  }
  
  delay(10);
}
`
}

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

  // Serial monitor / verification state
  const [serialLog, setSerialLog] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState("")
  const [codeUploaded, setCodeUploaded] = useState(false)
  const [espVerified, setEspVerified] = useState(false)
  const [wifiConnected, setWifiConnected] = useState(false)
  const [dataSending, setDataSending] = useState(false)
  const [verificationCheckActive, setVerificationCheckActive] = useState(false)
  const serialReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const serialLogRef = useRef<HTMLDivElement | null>(null)

  function addSerialLog(msg: string) {
    setSerialLog((prev) => [...prev.slice(-80), msg])
  }

  // Auto-scroll serial log
  useEffect(() => {
    if (serialLogRef.current) {
      serialLogRef.current.scrollTop = serialLogRef.current.scrollHeight
    }
  }, [serialLog])

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
    setSerialLog([])
    setUploadProgress("")
    setCodeUploaded(false)
    setEspVerified(false)
    setWifiConnected(false)
    setDataSending(false)
    setVerificationCheckActive(false)
    stopSerialReader()
    if (serialPort) {
      try {
        serialPort.close()
      } catch {
        // ignore
      }
    }
    setSerialPort(null)
  }

  function stopSerialReader() {
    if (serialReaderRef.current) {
      try {
        serialReaderRef.current.cancel()
      } catch {
        // ignore
      }
      serialReaderRef.current = null
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetWizard()
    }
    setOpen(isOpen)
  }

  // Start reading serial data from the ESP8266
  const startSerialReader = useCallback(async (port: SerialPort) => {
    if (!port.readable) return
    const decoder = new TextDecoder()
    let buffer = ""

    try {
      const reader = port.readable.getReader()
      serialReaderRef.current = reader

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Process complete lines
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          addSerialLog(trimmed)

          // Parse status messages from ESP8266
          if (trimmed === "PONG:NEUROSENSE_ESP8266_v1.0") {
            setEspVerified(true)
          } else if (trimmed === "VERIFY:OK:NEUROSENSE") {
            setCodeUploaded(true)
            setEspVerified(true)
          } else if (trimmed === "STATUS:WIFI_CONNECTED") {
            setWifiConnected(true)
          } else if (trimmed === "STATUS:WIFI_FAILED") {
            setWifiConnected(false)
          } else if (trimmed === "STATUS:DATA_SENT") {
            setDataSending(true)
          } else if (trimmed === "STATUS:READY") {
            setCodeUploaded(true)
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "NetworkError") {
        addSerialLog(`[Error serial]: ${err.message}`)
      }
    }
  }, [])

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
      addSerialLog("[Sistema] Puerto serial abierto (115200 baud)")
      toast.success("ESP8266 detectado correctamente")

      // Start reading serial to check if firmware is already loaded
      startSerialReader(port)

      // Send VERIFY command to check if NeuroSense firmware is already on the ESP
      if (port.writable) {
        try {
          const writer = port.writable.getWriter()
          await writer.write(new TextEncoder().encode("VERIFY\n"))
          writer.releaseLock()
          addSerialLog("[Sistema] Verificando firmware existente...")
        } catch {
          // ignore
        }
      }

      // Wait a moment for response then move to next step
      setTimeout(() => {
        setStep("wifi")
      }, 1500)
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
      addSerialLog("[Sistema] Registrando dispositivo en el servidor...")
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

      addSerialLog(`[Sistema] Dispositivo registrado: ${json.device.device_code}`)
      addSerialLog(`[Sistema] Token generado: ${json.device.auth_token.substring(0, 8)}...`)

      setProvisionedDevice({
        device_code: json.device.device_code,
        auth_token: json.device.auth_token,
        device_name: json.device.device_name,
      })

      // Step 2: Generate Arduino sketch
      setStep("uploading")
      addSerialLog("[Sistema] Generando firmware Arduino...")

      const serverHost = window.location.host
      const sketch = generateArduinoSketch({
        ssid: wifiSsid,
        password: wifiPassword,
        authToken: json.device.auth_token,
        serverHost: serverHost,
        serverPath: "/api/v1/data",
      })

      // Step 3: Send the sketch via Serial for reference
      // The actual upload must be done via Arduino IDE, but we send config
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
          await writer.write(new TextEncoder().encode(config + "\n"))
          writer.releaseLock()
          addSerialLog("[Sistema] Configuracion enviada al ESP8266 via Serial")
        } catch {
          addSerialLog("[Sistema] No se pudo enviar config por Serial")
        }
      }

      setUploadProgress("Firmware generado. Descarga el sketch .ino y subelo con Arduino IDE.")
      addSerialLog("[Sistema] IMPORTANTE: Descarga el archivo .ino y subelo al ESP8266 con Arduino IDE")

      // Move to verification step
      setStep("verifying")
      await refetch()
    } catch {
      toast.error("Error de conexion al servidor")
      setStep("wifi")
    } finally {
      setSubmitting(false)
    }
  }

  // Verify ESP8266 connection by checking if data arrives at the server
  async function handleVerifyConnection() {
    if (!provisionedDevice) return
    setVerificationCheckActive(true)
    addSerialLog("[Sistema] Verificando si el ESP8266 esta enviando datos al servidor...")

    // Send PING via serial if port is still open
    if (serialPort && serialPort.writable) {
      try {
        const writer = serialPort.writable.getWriter()
        await writer.write(new TextEncoder().encode("PING\n"))
        writer.releaseLock()
      } catch {
        // Port might be closed after upload
      }
    }

    // Check on the server if any data has arrived from this device
    try {
      const res = await fetch(`/api/devices/verify?device_code=${provisionedDevice.device_code}`)
      const json = await res.json()

      if (json.online) {
        setDataSending(true)
        setWifiConnected(true)
        addSerialLog(`[Servidor] Dispositivo EN LINEA - Ultimo dato: ${json.last_seen}`)
        addSerialLog(`[Servidor] Paquetes recibidos: ${json.packet_count}`)
        toast.success("El ESP8266 esta conectado y enviando datos correctamente")
      } else {
        addSerialLog("[Servidor] Aun no se reciben datos del ESP8266")
        addSerialLog("[Sistema] Asegurate de haber subido el firmware con Arduino IDE")
        toast.info("Aun no se reciben datos. Verifica que el firmware fue cargado al ESP8266.")
      }
    } catch {
      addSerialLog("[Sistema] Error al verificar con el servidor")
    } finally {
      setVerificationCheckActive(false)
      await refetch()
    }
  }

  function downloadSketch() {
    if (!provisionedDevice) return
    const serverHost = window.location.host
    const sketch = generateArduinoSketch({
      ssid: wifiSsid,
      password: wifiPassword,
      authToken: provisionedDevice.auth_token,
      serverHost: serverHost,
      serverPath: "/api/v1/data",
    })
    const blob = new Blob([sketch], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `neurosense_${provisionedDevice.device_code}.ino`
    a.click()
    URL.revokeObjectURL(url)
    addSerialLog(`[Sistema] Sketch descargado: neurosense_${provisionedDevice.device_code}.ino`)
    toast.success("Archivo .ino descargado")
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
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Configurar ESP8266
              </DialogTitle>
              <DialogDescription>
                Conecta tu ESP8266 por USB, configura WiFi y descarga el firmware
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center gap-1.5 py-2">
              {(["connect", "wifi", "provisioning", "uploading", "verifying", "complete"] as SetupStep[]).map(
                (s, i) => {
                  const allSteps: SetupStep[] = ["connect", "wifi", "provisioning", "uploading", "verifying", "complete"]
                  const currentIdx = allSteps.indexOf(step)
                  return (
                    <div key={s} className="flex items-center gap-1.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                          step === s
                            ? "bg-primary text-primary-foreground"
                            : currentIdx > i
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {currentIdx > i ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      {i < allSteps.length - 1 && (
                        <div
                          className={`h-px w-4 ${
                            currentIdx > i ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                  )
                }
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
                    <p>1. Conecta tu ESP8266 al computador usando un cable micro-USB</p>
                    <p>2. Asegurate de que el driver CH340/CP210x esta instalado</p>
                    <p>3. Haz clic en el boton y selecciona el puerto serial</p>
                  </div>
                  <div className="mt-3 rounded-md border border-chart-3/30 bg-chart-3/5 p-2.5 text-xs text-chart-3">
                    <AlertCircle className="mb-1 inline h-3.5 w-3.5" />{" "}
                    El navegador pedira permiso para acceder al puerto serial. Es seguro aceptar.
                  </div>
                </div>
                <Button onClick={handleConnectSerial} className="w-full" size="lg">
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
                    ESP8266 conectado por USB
                    {espVerified && " - Firmware NeuroSense detectado"}
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
                  <p className="mb-3 text-xs text-muted-foreground">
                    El ESP8266 se conectara a esta red para enviar datos al servidor.
                  </p>
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
                          {showWifiPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
                    RGPD y COPPA. Los datos son accesibles exclusivamente por los tutores
                    autorizados vinculados a este dispositivo.
                  </p>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="consent"
                      checked={consentAccepted}
                      onCheckedChange={(checked) => setConsentAccepted(checked === true)}
                    />
                    <Label htmlFor="consent" className="text-xs leading-relaxed text-foreground">
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
                    Registrar y generar firmware
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* Step 3: Provisioning */}
            {step === "provisioning" && (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Registrando dispositivo y generando token...
                </p>
              </div>
            )}

            {/* Step 4: Uploading / Download sketch */}
            {step === "uploading" && (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Generando firmware personalizado...
                </p>
              </div>
            )}

            {/* Step 5: Verify - Download sketch + verify connection */}
            {step === "verifying" && provisionedDevice && (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex items-center gap-2 rounded-lg border border-chart-2/30 bg-chart-2/5 p-3 text-sm text-chart-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="font-medium">
                    Dispositivo registrado: {provisionedDevice.device_code}
                  </span>
                </div>

                {/* Download Firmware */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Download className="h-4 w-4 text-primary" />
                    Paso 1: Descargar firmware
                  </h4>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                    Descarga el archivo <code className="rounded bg-secondary px-1 py-0.5 font-mono text-foreground">.ino</code> y
                    subelo al ESP8266 usando <strong>Arduino IDE</strong>. El firmware ya incluye
                    tu red WiFi, contrasena y token de autenticacion.
                  </p>
                  <div className="mb-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <p>1. Abre Arduino IDE</p>
                    <p>2. Selecciona la placa: <strong>NodeMCU 1.0 (ESP-12E Module)</strong></p>
                    <p>3. Instala las librerias: <strong>ESP8266WiFi, ArduinoJson, ESP8266HTTPClient</strong></p>
                    <p>4. Abre el archivo .ino descargado y haz clic en <strong>Subir</strong></p>
                  </div>
                  <Button onClick={downloadSketch} className="w-full" variant="default">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar neurosense_{provisionedDevice.device_code}.ino
                  </Button>
                </div>

                {/* Auth Token */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-chart-4" />
                    <span className="text-xs font-semibold text-foreground">
                      Token de autenticacion unico
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 overflow-hidden text-ellipsis rounded bg-secondary px-2 py-1 text-xs font-mono text-foreground">
                      {showAuthToken ? provisionedDevice.auth_token : "********************************"}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setShowAuthToken(!showAuthToken)}
                    >
                      {showAuthToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyToClipboard(provisionedDevice.auth_token, "Token")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-1.5 text-xs text-chart-4">
                    Este token vincula exclusivamente este ESP8266 con tu cuenta.
                  </p>
                </div>

                {/* Verify Connection */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Signal className="h-4 w-4 text-primary" />
                    Paso 2: Verificar conexion
                  </h4>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Despues de subir el firmware, haz clic para verificar que el ESP8266
                    esta conectado a WiFi y enviando datos al servidor.
                  </p>

                  {/* Status indicators */}
                  <div className="mb-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${codeUploaded ? "bg-chart-2" : "bg-muted-foreground/30"}`} />
                      <span className={codeUploaded ? "text-chart-2" : "text-muted-foreground"}>
                        Firmware cargado
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${wifiConnected ? "bg-chart-2" : "bg-muted-foreground/30"}`} />
                      <span className={wifiConnected ? "text-chart-2" : "text-muted-foreground"}>
                        WiFi conectado
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${dataSending ? "bg-chart-2" : "bg-muted-foreground/30"}`} />
                      <span className={dataSending ? "text-chart-2" : "text-muted-foreground"}>
                        Enviando datos al servidor
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleVerifyConnection}
                    disabled={verificationCheckActive}
                    variant="outline"
                    className="w-full"
                  >
                    {verificationCheckActive ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Verificar conexion
                  </Button>
                </div>

                {/* Serial Monitor */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <TerminalSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      Monitor Serial
                    </span>
                  </div>
                  <div
                    ref={serialLogRef}
                    className="h-32 overflow-y-auto rounded border border-border bg-background p-2 font-mono text-[10px] leading-relaxed text-muted-foreground"
                  >
                    {serialLog.length === 0 ? (
                      <span className="italic">Esperando datos del ESP8266...</span>
                    ) : (
                      serialLog.map((line, i) => (
                        <div
                          key={i}
                          className={
                            line.startsWith("[Sistema]")
                              ? "text-primary"
                              : line.startsWith("[Servidor]")
                                ? "text-chart-2"
                                : line.includes("ERROR") || line.includes("FAILED")
                                  ? "text-destructive"
                                  : line.includes("STATUS:")
                                    ? "text-chart-4"
                                    : ""
                          }
                        >
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => setStep("complete")}
                  className="w-full"
                  size="lg"
                  variant={dataSending ? "default" : "outline"}
                >
                  {dataSending ? "Finalizar configuracion" : "Continuar sin verificar"}
                </Button>
              </div>
            )}

            {/* Step 6: Complete */}
            {step === "complete" && provisionedDevice && (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex items-center gap-2 rounded-lg border border-chart-2/30 bg-chart-2/5 p-3 text-sm text-chart-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="font-medium">
                    {dataSending
                      ? "ESP8266 vinculado y transmitiendo datos"
                      : "Dispositivo registrado correctamente"}
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    Resumen del dispositivo
                  </h4>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Codigo</span>
                      <code className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-foreground">
                        {provisionedDevice.device_code}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Nombre</span>
                      <span className="text-xs text-foreground">{provisionedDevice.device_name}</span>
                    </div>
                    {wifiSsid && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">WiFi</span>
                        <span className="text-xs text-foreground">{wifiSsid}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Estado</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${dataSending ? "bg-chart-2" : "bg-chart-3"}`} />
                        <span className="text-xs text-foreground">
                          {dataSending ? "Transmitiendo" : "Pendiente de firmware"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {!dataSending && (
                  <div className="rounded-md border border-chart-3/30 bg-chart-3/5 p-3 text-xs text-chart-3">
                    <AlertCircle className="mb-1 inline h-3.5 w-3.5" />{" "}
                    Recuerda subir el firmware .ino al ESP8266 con Arduino IDE para que
                    comience a enviar datos. Puedes descargarlo nuevamente desde el boton de abajo.
                  </div>
                )}

                <div className="flex gap-2">
                  {!dataSending && (
                    <Button onClick={downloadSketch} variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar .ino
                    </Button>
                  )}
                  <Button
                    onClick={() => handleOpenChange(false)}
                    className="flex-1"
                    size="lg"
                  >
                    Finalizar
                  </Button>
                </div>
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
                          link.devices.is_online ? "bg-chart-2" : "bg-muted-foreground/40"
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
                      <Shield className="h-3 w-3 text-chart-2" />
                      <span className="text-xs text-chart-2">Aceptado</span>
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
                  {link.devices.last_seen_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ultimo dato</span>
                      <span className="text-xs text-foreground">
                        {new Date(link.devices.last_seen_at).toLocaleTimeString("es-ES")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
