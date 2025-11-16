import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "./api";
import ExpenseForm from "./ExpenseForm";
import ExpenseTable from "./ExpenseTable";
import Charts from "./Charts";
import Login from "./Login";
import Register from "./Register";

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [currentUser, setCurrentUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize, ...(fromDate && { from: fromDate }), ...(toDate && { to: toDate }) };
      const data = await listExpenses(params);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("refresh error", err);
      if (err?.response) {
        alert("Server error: " + (err.response.data?.error || JSON.stringify(err.response.data)));
      } else {
        alert("Network error: " + err.message);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [page, fromDate, toDate]);

  async function onCreate(form) {
    await createExpense(form);
    setPage(1);
    await refresh();
  }
  async function onDelete(id) {
    if (!confirm("Delete this expense?")) return;
    await deleteExpense(id);
    await refresh();
  }
  async function onQuickEdit(e) {
    const title = prompt("Title", e.title);
    if (title === null) return;
    const amount = prompt("Amount", e.amount);
    if (amount === null) return;
    const date = prompt("Date (YYYY-MM-DD)", e.date);
    if (date === null) return;
    const category = prompt("Category", e.category);
    if (category === null) return;
    await updateExpense(e.id, { title, amount, date, category });
    await refresh();
  }

  const visible = useMemo(() => {
    let arr = items || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
      );
    }
    const toAmt = x => Number(x.amount);
    const toTime = d => new Date(d).getTime();
    switch (sortBy) {
      case "date_asc": arr = [...arr].sort((a, b) => toTime(a.date) - toTime(b.date)); break;
      case "date_desc": arr = [...arr].sort((a, b) => toTime(b.date) - toTime(a.date)); break;
      case "amount_asc": arr = [...arr].sort((a, b) => toAmt(a) - toAmt(b)); break;
      case "amount_desc": arr = [...arr].sort((a, b) => toAmt(b) - toAmt(a)); break;
      default: break;
    }
    return arr;
  }, [items, search, sortBy]);

  function onAuthSuccess(user) {
    setCurrentUser(user);
    setShowLogin(false);
    setShowRegister(false);
    refresh();
  }
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    refresh();
  }

  return (
    <div className="container">
      {!currentUser ? (
        <div style={{
          maxWidth: 420,
          margin: "80px auto",
          padding: "28px",
          background: "white",
          borderRadius: "14px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
          animation: "fadeIn 0.4s ease"
        }}>
          <h1 style={{
            textAlign: "center",
            marginBottom: 24,
            fontSize: "26px",
            fontWeight: "600",
            color: "#333"
          }}>Expense Tracker</h1>
          {!showLogin && !showRegister && (
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => { setShowLogin(true); setShowRegister(false); }} style={{
                padding: "10px 22px", borderRadius: "8px", border: "none", cursor: "pointer", background: "#007bff", color: "white", fontWeight: "500"
              }}>Login</button>
              <button onClick={() => { setShowRegister(true); setShowLogin(false); }} style={{
                padding: "10px 22px", borderRadius: "8px", border: "none", cursor: "pointer", background: "#28a745", color: "white", fontWeight: "500"
              }}>Register</button>
            </div>
          )}
          <div style={{ animation: "fadeIn 0.35s ease" }}>
            {showLogin && <Login onAuthSuccess={onAuthSuccess} />}
            {showRegister && <Register onRegistered={() => { setShowRegister(false); setShowLogin(true); alert("Registered! Please login."); }} />}
          </div>
          <p style={{ textAlign: "center", marginTop: 20, color: "#777", fontSize: "14px" }}>
            Please log in to view your personal dashboard.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h1>Expense Tracker</h1>
            <div>
              <span style={{ marginRight: 12 }}>Hello, {currentUser.name || currentUser.email}</span>
              <button onClick={logout}>Logout</button>
            </div>
          </div>
          <div className="card" style={{ display: "grid", gap: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input placeholder="Search title/category" value={search} onChange={e => setSearch(e.target.value)} />
              <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
              <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="date_desc">Sort: Date ↓</option>
                <option value="date_asc">Sort: Date ↑</option>
                <option value="amount_desc">Sort: Amount ↓</option>
                <option value="amount_asc">Sort: Amount ↑</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
          <ExpenseForm onCreate={onCreate} />
          {loading ? <div className="card">Loading…</div> : <ExpenseTable items={visible} onDelete={onDelete} onQuickEdit={onQuickEdit} />}
          <Charts fromDate={fromDate} toDate={toDate} currentUser={currentUser} />
        </>
      )}
    </div>
  );
}
