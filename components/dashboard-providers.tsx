"use client"

import { DeviceProvider } from "@/hooks/use-devices"

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return <DeviceProvider>{children}</DeviceProvider>
}
