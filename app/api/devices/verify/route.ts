import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/devices/verify?device_code=ESP-XXXX
 * Checks if a device is online and has sent data recently.
 * Used during device setup to verify firmware upload was successful.
 */
export async function GET(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const deviceCode = searchParams.get("device_code")

  if (!deviceCode) {
    return NextResponse.json(
      { error: "Se requiere device_code" },
      { status: 400 }
    )
  }

  try {
    // Get device info
    const { data: device, error: deviceError } = await supabaseAdmin
      .from("devices")
      .select("id, is_online, last_seen_at, device_code")
      .eq("device_code", deviceCode)
      .single()

    if (deviceError || !device) {
      return NextResponse.json(
        { error: "Dispositivo no encontrado" },
        { status: 404 }
      )
    }

    // Verify user owns the device
    const { data: link } = await supabaseAdmin
      .from("device_links")
      .select("id")
      .eq("user_id", user.id)
      .eq("device_id", device.id)
      .single()

    if (!link) {
      return NextResponse.json(
        { error: "No tienes acceso a este dispositivo" },
        { status: 403 }
      )
    }

    // Count recent sensor data packets (last 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from("sensor_data")
      .select("id", { count: "exact", head: true })
      .eq("device_id", device.id)
      .gte("created_at", fiveMinAgo)

    const isOnline = device.is_online && (count ?? 0) > 0

    return NextResponse.json({
      online: isOnline,
      last_seen: device.last_seen_at,
      packet_count: count ?? 0,
      device_code: device.device_code,
    })
  } catch {
    return NextResponse.json(
      { error: "Error al verificar dispositivo" },
      { status: 500 }
    )
  }
}
