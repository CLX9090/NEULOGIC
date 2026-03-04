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
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import type { SensorReading } from "@/hooks/use-realtime"

interface SensorChartProps {
  data: SensorReading[]
  title: string
  dataKey: keyof SensorReading | "accel_magnitude"
  color: string
  threshold?: number
  thresholdLabel?: string
  unit?: string
  className?: string
}

const formatTime = (ts: number) => {
  const d = new Date(ts * 1000)
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`
}

export function SensorChart({
  data,
  title,
  dataKey,
  color,
  threshold,
  thresholdLabel,
  unit = "",
  className,
}: SensorChartProps) {
  const chartConfig: ChartConfig = {
    value: {
      label: title,
      color: color,
    },
  }

  const chartData = data.map((d) => {
    let val: number
    if (dataKey === "accel_magnitude") {
      val = Math.sqrt(d.accel_x ** 2 + d.accel_y ** 2 + d.accel_z ** 2)
      val = Math.round(val * 100) / 100
    } else {
      val = d[dataKey] as number
    }
    return {
      time: formatTime(d.timestamp),
      value: Math.round(val * 1000) / 1000,
      timestamp: d.timestamp,
    }
  })

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`fill-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              domain={[0, "auto"]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value}${unit}`, title]}
                />
              }
            />
            {threshold !== undefined && (
              <ReferenceLine
                y={threshold}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: thresholdLabel || `Umbral: ${threshold}`,
                  position: "right",
                  fontSize: 10,
                  fill: "#ef4444",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#fill-${title})`}
              dot={false}
              animationDuration={300}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
