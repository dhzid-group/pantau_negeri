'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface IndicatorRow {
  indicatorCode: string;
  value: string;
  periodDate: string;
}

export default function EconomicCharts({ indicators }: { indicators: IndicatorRow[] }) {
  const codes = [...new Set(indicators.map((item) => item.indicatorCode))];

  return (
    <section className="mt-8 grid gap-5 md:grid-cols-2">
      {codes.slice(0, 4).map((code) => {
        const chartData = indicators
          .filter((item) => item.indicatorCode === code)
          .map((item) => ({ period: item.periodDate, value: Number(item.value) }))
          .reverse();
        return (
          <div key={code} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold">{code}</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </section>
  );
}
