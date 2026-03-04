import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { data: links, error } = await supabase
    .from("device_links")
    .select(`
      id,
      child_name,
      is_active,
      consent_accepted_at,
      created_at,
      devices (
        id,
        device_code,
        device_name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ devices: links })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const body = await request.json()
  const { device_code, child_name, consent_accepted } = body

  if (!device_code || !consent_accepted) {
    return NextResponse.json(
      { error: "Se requiere codigo de dispositivo y aceptacion de consentimiento" },
      { status: 400 }
    )
  }

  // Find the device
  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("id")
    .eq("device_code", device_code)
    .single()

  if (deviceError || !device) {
    return NextResponse.json(
      { error: "Dispositivo no encontrado. Verifica el codigo." },
      { status: 404 }
    )
  }

  // Create the link with consent
  const consentText = `Acepto el tratamiento de datos sensoriales del menor "${child_name || 'Sin nombre'}" a traves del dispositivo ${device_code}. Comprendo que los datos se procesan conforme al RGPD y COPPA. Consentimiento otorgado el ${new Date().toISOString()}.`

  const { data: link, error: linkError } = await supabase
    .from("device_links")
    .insert({
      user_id: user.id,
      device_id: device.id,
      child_name: child_name || null,
      consent_text: consentText,
    })
    .select()
    .single()

  if (linkError) {
    if (linkError.code === '23505') {
      return NextResponse.json(
        { error: "Este dispositivo ya esta vinculado a tu cuenta" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  return NextResponse.json({ linked: true, link })
}
