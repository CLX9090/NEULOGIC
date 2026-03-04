import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import {
  kalmanFilter,
  normalizeGSR,
  normalizeSound,
  normalizeAccel,
  computeStressIndex,
  detectAlerts,
} from "@/lib/sensor-processing"

// Use service role for sensor data ingestion (no user auth needed)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { device_id, gsr, sound, accel_x, accel_y, accel_z, password } = body

    // Validate required fields
    if (!device_id || gsr === undefined || sound === undefined) {
      return NextResponse.json(
        { error: "Campos requeridos: device_id, gsr, sound" },
        { status: 400 }
      )
    }

    // Verify device exists and password matches
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id, password_hash")
      .eq("device_code", device_id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json(
        { error: "Dispositivo no encontrado" },
        { status: 404 }
      )
    }

    // Simple password check (in production, use bcrypt compare)
    if (password && device.password_hash !== password) {
      return NextResponse.json(
        { error: "Credenciales invalidas" },
        { status: 401 }
      )
    }

    // Normalize sensor values
    const gsrNorm = normalizeGSR(gsr)
    const soundNorm = normalizeSound(sound)
    const ax = accel_x ?? 0
    const ay = accel_y ?? 0
    const az = accel_z ?? 0
    const accelNorm = normalizeAccel(ax, ay, az)

    // Apply Kalman filter to stress index for noise reduction
    const rawStress = computeStressIndex(gsrNorm, soundNorm, accelNorm)
    const filteredStress = kalmanFilter(device.id, rawStress)

    const timestamp = Math.floor(Date.now() / 1000)

    // Store sensor data
    const { error: insertError } = await supabase.from("sensor_data").insert({
      device_id: device.id,
      gsr: gsrNorm,
      sound: soundNorm,
      accel_x: ax,
      accel_y: ay,
      accel_z: az,
      stress_index: filteredStress,
      timestamp,
    })

    if (insertError) {
      return NextResponse.json(
        { error: "Error al guardar datos", details: insertError.message },
        { status: 500 }
      )
    }

    // Detect and store alerts
    const alerts = detectAlerts(filteredStress, gsrNorm, soundNorm, accelNorm)
    if (alerts.length > 0) {
      const alertRows = alerts.map((a) => ({
        device_id: device.id,
        alert_type: a.type,
        severity: a.severity,
        message: a.message,
        stress_value: filteredStress,
      }))

      await supabase.from("alerts").insert(alertRows)
    }

    return NextResponse.json({
      stored: true,
      stress_index: filteredStress,
      alerts: alerts.length,
      timestamp,
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "NeuroSense API v1 - Sensor data endpoint" })
}
