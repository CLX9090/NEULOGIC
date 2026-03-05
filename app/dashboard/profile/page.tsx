"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Cpu, Loader2 } from "lucide-react"
import { useDevices } from "@/hooks/use-devices"

interface UserProfile {
  email: string
  full_name: string
  role: string
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { deviceLinks } = useDevices()

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setProfile({
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "Usuario",
          role: user.user_metadata?.role || "parent",
          created_at: user.created_at,
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) return null

  const roleLabels: Record<string, string> = {
    parent: "Padre / Madre",
    teacher: "Docente",
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Informacion de tu cuenta y dispositivos vinculados
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <User className="h-4 w-4 text-primary" />
              Informacion personal
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nombre</span>
              <span className="text-sm font-medium text-foreground">
                {profile.full_name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" /> Email
              </span>
              <span className="text-sm text-foreground">{profile.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rol</span>
              <Badge variant="secondary" className="text-xs">
                {roleLabels[profile.role] || profile.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Registro</span>
              <span className="text-xs text-foreground">
                {new Date(profile.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Cpu className="h-4 w-4 text-primary" />
              Dispositivos
            </CardTitle>
            <CardDescription>
              ESP8266 vinculados a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total vinculados</span>
              <span className="text-sm font-bold text-foreground">
                {deviceLinks.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Activos</span>
              <span className="text-sm font-medium text-foreground">
                {deviceLinks.filter((d) => d.is_active).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Shield className="h-3 w-3" /> Consentimientos
              </span>
              <Badge variant="default" className="text-xs">
                {deviceLinks.length} otorgados
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
