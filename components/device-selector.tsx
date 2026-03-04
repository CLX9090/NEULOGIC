"use client"

import { useDevices } from "@/hooks/use-devices"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Cpu } from "lucide-react"

export function DeviceSelector() {
  const { deviceLinks, activeDevice, setActiveDevice, loading } = useDevices()

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cpu className="h-4 w-4 animate-pulse" />
        Cargando dispositivos...
      </div>
    )
  }

  if (deviceLinks.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cpu className="h-4 w-4" />
        Sin dispositivos vinculados
      </div>
    )
  }

  return (
    <Select
      value={activeDevice?.devices.id || ""}
      onValueChange={(val) => {
        const link = deviceLinks.find((d) => d.devices.id === val)
        setActiveDevice(link || null)
      }}
    >
      <SelectTrigger className="w-[240px]">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          <SelectValue placeholder="Seleccionar dispositivo" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {deviceLinks.map((link) => (
          <SelectItem key={link.devices.id} value={link.devices.id}>
            <span>{link.devices.device_name || link.devices.device_code}</span>
            {link.child_name && (
              <span className="ml-2 text-muted-foreground">
                ({link.child_name})
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
