// frontend/src/Charts.jsx
import { useEffect, useState } from "react";
import { summaryMonth, byCategory } from "./api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Charts({ fromDate, toDate, currentUser }) {
  const [categoryData, setCategoryData] = useState([]);
  const [monthTotal, setMonthTotal] = useState("0");
  const [loading, setLoading] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentUser) {
        // if not logged in, clear chart (you show login first so this is safe)
        setCategoryData([]);
        setMonthTotal("0");
        return;
      }

      setLoading(true);
      try {
        const now = new Date();
        const s = await summaryMonth(now.getFullYear(), now.getMonth() + 1);
        if (!mounted) return;
        setMonthTotal(s?.total ?? "0");

        const params = {
          ...(fromDate ? { from: fromDate } : {}),
          ...(toDate ? { to: toDate } : {}),
        };

        const cats = await byCategory(params);
        if (!mounted) return;

        if (Array.isArray(cats)) {
          setCategoryData(cats.map(c => ({ name: c.category, value: Number(c.total) })));
        } else {
          setCategoryData([]);
        }
      } catch (e) {
        console.error("chart fetch error", e);
        setCategoryData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [fromDate, toDate, currentUser]);

  if (!currentUser) {
    return (
      <div className="card">
        <h3>Summary</h3>
        <p>Please log in to view your personal chart.</p>
      </div>
    );
  }

  if (loading) return <div className="card">Loading chart…</div>;
  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Summary</h3>
          <div className="badge">This month: ₹{monthTotal}</div>
        </div>
        <p style={{ marginTop: 12 }}>No category data to display.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Summary</h3>
        <div className="badge">This month: ₹{monthTotal}</div>
      </div>

      <div style={{ width: "100%", overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={120} label>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
