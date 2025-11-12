import { useEffect, useState } from "react";
import { summaryMonth, byCategory } from "./api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Charts({ fromDate, toDate }) {
  const [categoryData, setCategoryData] = useState([]);
  const [monthTotal, setMonthTotal] = useState("0");
  const COLORS = ["#0088FE","#00C49F","#FFBB28","#FF8042","#8884D8","#82CA9D","#FF6B6B","#4ECDC4"];

  useEffect(() => {
    (async () => {
      const now = new Date();
      const s = await summaryMonth(now.getFullYear(), now.getMonth() + 1);
      setMonthTotal(s.total);
      const cats = await byCategory({
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      });
      const safe = Array.isArray(cats) ? cats : [];
      setCategoryData(safe.map(c => ({ name: c.category, value: Number(c.total) })));
    })();
  }, [fromDate, toDate]);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h3>Summary</h3>
        <div className="badge">This month: ₹{monthTotal}</div>
      </div>
      <div style={{ width: "100%", overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={120} label>
              {categoryData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
