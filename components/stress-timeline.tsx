"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"
import type { SensorReading } from "@/hooks/use-realtime"

interface StressTimelineProps {
  data: SensorReading[]
  className?: string
}

const formatTime = (ts: number) => {
  const d = new Date(ts * 1000)
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

export function StressTimeline({ data, className }: StressTimelineProps) {
  const chartConfig: ChartConfig = {
    stress: {
      label: "Estres",
      color: "#f97316",
    },
  }

  const chartData = data.map((d) => ({
    time: formatTime(d.timestamp),
    stress: Math.round((d.stress_index ?? 0) * 100),
    timestamp: d.timestamp,
  }))

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Linea de Tiempo - Estres
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
              Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
              Elevado
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
              Critico
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value}%`, "Estres"]}
                />
              }
            />
            <ReferenceLine
              y={70}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <ReferenceLine
              y={50}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="stress"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#stressFill)"
              dot={false}
              animationDuration={300}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
