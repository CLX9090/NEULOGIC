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
  const limit = parseInt(searchParams.get("limit") || "100")

  if (!deviceId) {
    return NextResponse.json({ error: "Se requiere device_id" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("sensor_data")
    .select("*")
    .eq("device_id", deviceId)
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return in chronological order for charts
  return NextResponse.json({ data: data?.reverse() || [] })
}
