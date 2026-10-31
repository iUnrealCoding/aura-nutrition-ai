"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
export default function TrendChart({
  points,
}: {
  points: { date: string; raw: number; ema: number }[];
}) {
  if (points.length < 2)
    return (
      <div className="empty" style={{ padding: 30 }}>
        <p className="muted">Log at least two weigh-ins to see your trend.</p>
      </div>
    );
  return (
    <div
      className="chart"
      role="img"
      aria-label="Weight and smoothed weight trend in pounds"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points.slice(-30)}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="#2a2c36"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
            tick={{ fill: "#9295a8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={35}
          />
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
            tick={{ fill: "#9295a8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => Number(v).toFixed(0)}
          />
          <Tooltip
            contentStyle={{
              background: "#20232d",
              border: "1px solid #353847",
              borderRadius: 10,
            }}
            labelFormatter={(v) => new Date(v).toLocaleDateString()}
            formatter={(v: number) => [v.toFixed(1) + " lb"]}
          />
          <Line
            name="Weight"
            type="monotone"
            dataKey="raw"
            stroke="#676a7d"
            strokeWidth={1.5}
            dot={{ r: 3 }}
          />
          <Line
            name="Smoothed"
            type="monotone"
            dataKey="ema"
            stroke="#b6a0ff"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
