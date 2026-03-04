import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const deviceId = searchParams.get("device_id")
  const acknowledged = searchParams.get("acknowledged")

  let query = supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (deviceId) {
    query = query.eq("device_id", deviceId)
  }

  if (acknowledged !== null && acknowledged !== undefined) {
    query = query.eq("acknowledged", acknowledged === "true")
  }

  const { data: alerts, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ alerts })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const body = await request.json()
  const { alert_id } = body

  if (!alert_id) {
    return NextResponse.json({ error: "Se requiere alert_id" }, { status: 400 })
  }

  const { error } = await supabase
    .from("alerts")
    .update({ acknowledged: true })
    .eq("id", alert_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ acknowledged: true })
}
