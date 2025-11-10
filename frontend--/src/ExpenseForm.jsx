import { useState } from "react";

export default function ExpenseForm({ onCreate }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    date: "",
    category: ""
  });
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!form.title.trim() || !form.amount || !form.date || !form.category.trim()) {
      setErr("Please fill all fields.");
      return;
    }
    await onCreate(form);
    setForm({ title: "", amount: "", date: "", category: "" });
  }

  return (
    <form onSubmit={submit} className="card" style={{ marginBottom: 16 }}>
      <h3>Add Expense</h3>
      {err && <div style={{ color: "crimson", marginBottom: 8 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input placeholder="Title" value={form.title} onChange={e=>setForm({ ...form, title: e.target.value })} />
        <input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={e=>setForm({ ...form, amount: e.target.value })} />
        <input type="date" value={form.date} onChange={e=>setForm({ ...form, date: e.target.value })} />
        <input placeholder="Category" value={form.category} onChange={e=>setForm({ ...form, category: e.target.value })} />
        <button className="primary">Add</button>
      </div>
    </form>
  );
}
