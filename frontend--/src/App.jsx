import { useEffect, useState } from "react";
import "./styles.css";
import { listExpenses, createExpense } from "./api";
import ExpenseForm from "./ExpenseForm";
import Charts from "./Charts";


export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const data = await listExpenses();
      setItems(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setErr("API did not return a list.");
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to fetch.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function onCreate(form) {
    await createExpense(form);
    await refresh();
  }

  return (
    <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1>Expense Tracker</h1>

      <ExpenseForm onCreate={onCreate} />

      <div className="card">
        <h3>Expenses</h3>
        {loading ? (
          <div>Loading…</div>
        ) : err ? (
          <div style={{ color: "crimson" }}>{err}</div>
        ) : items.length === 0 ? (
          <div>No expenses yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Amount</th><th>Date</th><th>Category</th></tr>
            </thead>
            <tbody>
              {items.map(e => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>₹{e.amount}</td>
                  <td>{e.date}</td>
                  <td><span className="badge">{e.category}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Charts/>
    </div>
  );
}
