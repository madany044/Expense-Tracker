import { useEffect, useState } from "react";
import { summaryMonth, byCategory } from "./api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Charts({ fromDate, toDate }) {
  const [categoryData, setCategoryData] = useState([]);
  const [monthTotal, setMonthTotal] = useState("0");

  // 🎨 color palette for slices
  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
    "#8884D8", "#82CA9D", "#FF6B6B", "#4ECDC4"
  ];

  useEffect(() => {
    (async () => {
      try {
        // fetch total for current month
        const now = new Date();
        const s = await summaryMonth(now.getFullYear(), now.getMonth() + 1);
        setMonthTotal(s.total);

        // fetch category-wise totals
        const cats = await byCategory({
          ...(fromDate ? { from: fromDate } : {}),
          ...(toDate ? { to: toDate } : {}),
        });

        // ✅ safe fallback in case backend returns object
        const safeCats = Array.isArray(cats) ? cats : [];
        const withColors = safeCats.map((c) => ({
          name: c.category,
          value: Number(c.total),
        }));

        setCategoryData(withColors);
      } catch (e) {
        console.error("chart fetch error", e);
        setCategoryData([]); // fallback to empty list if error
      }
    })();
  }, [fromDate, toDate]); // re-run when date filters change

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h3>Summary</h3>
        <div className="badge">This month: ₹{monthTotal}</div>
      </div>

      <div style={{ width: "100%", overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              label
            >
              {categoryData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
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
