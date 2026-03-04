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
import { Cpu, Plus, Loader2, Shield, Clock } from "lucide-react"
import { toast } from "sonner"

export default function DevicesPage() {
  const { deviceLinks, refetch, loading } = useDevices()
  const [open, setOpen] = useState(false)
  const [deviceCode, setDeviceCode] = useState("")
  const [childName, setChildName] = useState("")
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleLink() {
    if (!consentAccepted) {
      toast.error("Debes aceptar el consentimiento para continuar")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_code: deviceCode,
          child_name: childName,
          consent_accepted: consentAccepted,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || "Error al vincular dispositivo")
        return
      }

      toast.success("Dispositivo vinculado correctamente")
      setOpen(false)
      setDeviceCode("")
      setChildName("")
      setConsentAccepted(false)
      await refetch()
    } catch {
      toast.error("Error de conexion")
    } finally {
      setSubmitting(false)
    }
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
            Gestiona los Micro:bit vinculados a tu cuenta
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Vincular dispositivo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Vincular Micro:bit</DialogTitle>
              <DialogDescription>
                Ingresa el codigo del dispositivo e identifica al menor
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="deviceCode" className="text-foreground">Codigo del dispositivo</Label>
                <Input
                  id="deviceCode"
                  placeholder="Ej: DEMO-001"
                  value={deviceCode}
                  onChange={(e) => setDeviceCode(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="childName" className="text-foreground">Nombre del menor (opcional)</Label>
                <Input
                  id="childName"
                  placeholder="Nombre del nino/a"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                />
              </div>

              {/* RGPD/COPPA Consent */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Consentimiento RGPD/COPPA
                  </span>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                  Al vincular este dispositivo, autorizo expresamente el tratamiento
                  de datos sensoriales (conductancia cutanea, niveles de sonido y
                  aceleracion) del menor identificado. Estos datos se procesan
                  unicamente con fines de monitoreo del bienestar sensorial,
                  conforme al Reglamento General de Proteccion de Datos (RGPD) y
                  la Ley de Proteccion de la Privacidad Infantil en Linea (COPPA).
                  Los datos son accesibles exclusivamente por los tutores
                  autorizados vinculados a este dispositivo.
                </p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="consent"
                    checked={consentAccepted}
                    onCheckedChange={(checked) =>
                      setConsentAccepted(checked === true)
                    }
                  />
                  <Label htmlFor="consent" className="text-xs leading-relaxed text-foreground">
                    Acepto el tratamiento de datos del menor y confirmo que tengo
                    la autoridad legal para otorgar este consentimiento.
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleLink}
                disabled={!deviceCode || !consentAccepted || submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vinculando...
                  </>
                ) : (
                  "Vincular dispositivo"
                )}
              </Button>
            </DialogFooter>
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
              Vincula tu primer Micro:bit para empezar
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
                      <CardDescription className="text-xs">
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
                      <span className="font-medium text-foreground">{link.child_name}</span>
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
