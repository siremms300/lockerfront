// components/admin/monitoring/metrics-chart.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MetricsChartProps {
  title: string
  data: Array<{ time: string; value: number }>
}

export function SystemMetricsChart({ title, data }: MetricsChartProps) {
  const sampleData = [
    { time: '14:00', value: 120 },
    { time: '14:05', value: 135 },
    { time: '14:10', value: 125 },
    { time: '14:15', value: 145 },
    { time: '14:20', value: 130 },
    { time: '14:25', value: 140 },
  ]

  const chartData = data.length > 0 ? data : sampleData

  return (
    <div className="bg-white p-6 rounded-lg shadow-soft">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}