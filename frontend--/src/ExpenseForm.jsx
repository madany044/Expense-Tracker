// frontend/src/ExpenseForm.jsx
import { useState } from "react";

export default function ExpenseForm({ onCreate }) {
  const [form, setForm] = useState({ title: "", amount: "", date: "", category: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // === Debug: show what's being sent (inspect in console) ===
    console.log("[ExpenseForm] sending payload:", form);

    try {
      // call parent handler
      await onCreate(form);
      // reset
      setForm({ title: "", amount: "", date: "", category: "" });
    } catch (err) {
      // show friendly message + server details when available
      console.error("ExpenseForm submit error:", err);
      const serverData = err?.response?.data;
      if (serverData) {
        // show readable server message (may be object or string)
        alert("Server rejected request:\n" + (typeof serverData === "string" ? serverData : JSON.stringify(serverData)));
      } else {
        alert("Request failed: " + (err.message || "unknown error"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Add Expense</h3>
      <div className="row">
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <input name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} required />
        <input name="date" type="date" value={form.date} onChange={handleChange} required />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} required />
        <button type="submit" disabled={loading}>{loading ? "Adding…" : "Add"}</button>
      </div>
    </form>
  );
}
