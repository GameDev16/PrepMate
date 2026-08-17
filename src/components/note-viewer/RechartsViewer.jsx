import React, { useState, useEffect } from "react";
import { LineChart } from "lucide-react";

function RechartsViewer({ chart }) {
  const [RechartsComponents, setRechartsComponents] = useState(null);

  useEffect(() => {
    let mounted = true;
    import("recharts")
      .then((mod) => {
        if (mounted) setRechartsComponents(mod);
      })
      .catch((err) => console.error("Failed to import recharts:", err));
    return () => {
      mounted = false;
    };
  }, []);

  if (!chart || !RechartsComponents) {
    return (
      <div className="my-6 p-6 bg-chalk border-2 border-ink rounded-2xl shadow-hard text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-electric-iris border-t-transparent mx-auto mb-2"></div>
        <p className="text-xs text-ink/60">Loading interactive chart...</p>
      </div>
    );
  }

  const {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
  } = RechartsComponents;

  const COLORS = [
    "#2727e6",
    "#16ab59",
    "#ffda00",
    "#ff4141",
    "#91d8ec",
    "#ffbac4",
  ];

  const data = (chart.labels || []).map((label, idx) => {
    const row = { name: label };
    (chart.series || []).forEach((s) => {
      row[s.name || "Value"] = s.data?.[idx] ?? 0;
    });
    return row;
  });

  const firstSeriesName = chart.series?.[0]?.name || "Value";

  return (
    <div className="my-6 p-6 bg-paper border-2 border-ink rounded-2xl shadow-hard">
      <h4 className="font-display font-bold text-lg text-ink mb-4 flex items-center gap-2">
        <LineChart size={20} strokeWidth={2} className="text-electric-iris shrink-0" />
        {chart.title || "Quantitative Visualization"}
      </h4>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "pie" ? (
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={data.map((d) => ({
                  name: d.name,
                  value: d[firstSeriesName],
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          ) : chart.type === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1edff" />
              <XAxis dataKey="name" stroke="#111118" />
              <YAxis stroke="#111118" />
              <Tooltip />
              <Legend />
              {(chart.series || []).map((s, idx) => (
                <Line
                  key={s.name || idx}
                  type="monotone"
                  dataKey={s.name || "Value"}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={3}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1edff" />
              <XAxis dataKey="name" stroke="#111118" />
              <YAxis stroke="#111118" />
              <Tooltip />
              <Legend />
              {(chart.series || []).map((s, idx) => (
                <Bar
                  key={s.name || idx}
                  dataKey={s.name || "Value"}
                  fill={COLORS[idx % COLORS.length]}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RechartsViewer;
