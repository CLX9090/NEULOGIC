"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface DeviceInfo {
  id: string
  device_code: string
  device_name: string | null
  is_online: boolean
  last_seen_at: string | null
  wifi_ssid: string | null
  wifi_configured: boolean
  firmware_version: string | null
}

interface DeviceLink {
  id: string
  child_name: string | null
  is_active: boolean
  consent_accepted_at: string
  created_at: string
  devices: DeviceInfo
}

interface DeviceContextType {
  deviceLinks: DeviceLink[]
  activeDevice: DeviceLink | null
  setActiveDevice: (device: DeviceLink | null) => void
  loading: boolean
  refetch: () => Promise<void>
}

const DeviceContext = createContext<DeviceContextType>({
  deviceLinks: [],
  activeDevice: null,
  setActiveDevice: () => {},
  loading: true,
  refetch: async () => {},
})

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [deviceLinks, setDeviceLinks] = useState<DeviceLink[]>([])
  const [activeDevice, setActiveDevice] = useState<DeviceLink | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchDevices() {
    try {
      const res = await fetch("/api/devices")
      const json = await res.json()
      if (json.devices) {
        setDeviceLinks(json.devices)
        // Auto-select first active device if none selected
        if (!activeDevice && json.devices.length > 0) {
          const firstActive = json.devices.find((d: DeviceLink) => d.is_active)
          setActiveDevice(firstActive || json.devices[0])
        }
      }
    } catch {
      // Handle silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <DeviceContext.Provider
      value={{
        deviceLinks,
        activeDevice,
        setActiveDevice,
        loading,
        refetch: fetchDevices,
      }}
    >
      {children}
    </DeviceContext.Provider>
  )
}

export function useDevices() {
  return useContext(DeviceContext)
}
