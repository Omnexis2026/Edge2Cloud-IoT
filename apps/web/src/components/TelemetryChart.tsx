import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "../hooks/useMqttDashboard";

type Props = {
  data: ChartPoint[];
  emptyHint: string;
};

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TelemetryChart({ data, emptyHint }: Props) {
  const chartData = data.map((p) => ({
    ...p,
    label: formatTime(p.at),
  }));

  const show = chartData.length > 0;

  return (
    <div className="chart-wrap">
      {!show ? (
        <p className="chart-empty">{emptyHint}</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={280}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-temp)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-temp)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillHum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-hum)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-hum)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle)" }}
            />
            <YAxis
              yAxisId="t"
              domain={["auto", "auto"]}
              width={40}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle)" }}
              label={{
                value: "°C",
                angle: -90,
                position: "insideLeft",
                fill: "var(--chart-temp)",
                fontSize: 11,
              }}
            />
            <YAxis
              yAxisId="h"
              orientation="right"
              domain={[0, 100]}
              width={36}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle)" }}
              label={{
                value: "%",
                angle: 90,
                position: "insideRight",
                fill: "var(--chart-hum)",
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
              }}
              labelStyle={{ color: "var(--text-muted)" }}
            />
            <Legend />
            <Area
              yAxisId="t"
              type="monotone"
              dataKey="temp"
              name="Temperature"
              stroke="var(--chart-temp)"
              fill="url(#fillTemp)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Area
              yAxisId="h"
              type="monotone"
              dataKey="hum"
              name="Humidity"
              stroke="var(--chart-hum)"
              fill="url(#fillHum)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
