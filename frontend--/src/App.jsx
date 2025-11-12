import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "./api";
import ExpenseForm from "./ExpenseForm";
import ExpenseTable from "./ExpenseTable";
import Charts from "./Charts";

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc|date_asc|amount_desc|amount_asc
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  async function refresh() {
    setLoading(true);
    const data = await listExpenses({
      page, page_size: pageSize,
      ...(fromDate ? { from: fromDate } : {}),
      ...(toDate ? { to: toDate } : {}),
    });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, [page, fromDate, toDate]);

  async function onCreate(form) { await createExpense(form); setPage(1); await refresh(); }
  async function onDelete(id) { await deleteExpense(id); await refresh(); }
  async function onQuickEdit(e) {
    const title = prompt("Title", e.title); if (title === null) return;
    const amount = prompt("Amount", e.amount); if (amount === null) return;
    const date = prompt("Date (YYYY-MM-DD)", e.date); if (date === null) return;
    const category = prompt("Category", e.category); if (category === null) return;
    await updateExpense(e.id, { title, amount, date, category });
    await refresh();
  }

  // client-side search + sort
  const visible = useMemo(() => {
    let arr = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(e => e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    const toAmt = x => Number(x.amount);
    const toTime = d => new Date(d).getTime();
    switch (sortBy) {
      case "date_asc":    arr = [...arr].sort((a,b)=>toTime(a.date)-toTime(b.date)); break;
      case "date_desc":   arr = [...arr].sort((a,b)=>toTime(b.date)-toTime(a.date)); break;
      case "amount_asc":  arr = [...arr].sort((a,b)=>toAmt(a)-toAmt(b)); break;
      case "amount_desc": arr = [...arr].sort((a,b)=>toAmt(b)-toAmt(a)); break;
      default: break;
    }
    return arr;
  }, [items, search, sortBy]);

  return (
    <div className="container">
      <h1>Expense Tracker</h1>

      {/* Filters */}
      <div className="card" style={{display:"grid",gap:8,marginBottom:16}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input placeholder="Search title/category" value={search} onChange={e=>setSearch(e.target.value)} />
          <input type="date" value={fromDate} onChange={e=>{ setFromDate(e.target.value); setPage(1); }} />
          <input type="date" value={toDate} onChange={e=>{ setToDate(e.target.value); setPage(1); }} />
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="date_desc">Sort: Date ↓</option>
            <option value="date_asc">Sort: Date ↑</option>
            <option value="amount_desc">Sort: Amount ↓</option>
            <option value="amount_asc">Sort: Amount ↑</option>
          </select>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
          <span>Page {page}</span>
          <button onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      </div>

      <ExpenseForm onCreate={onCreate} />

      {loading ? (
        <div className="card">Loading…</div>
      ) : (
        <ExpenseTable items={visible} onDelete={onDelete} onQuickEdit={onQuickEdit} />
      )}

      <Charts fromDate={fromDate} toDate={toDate} />
    </div>
  );
}
