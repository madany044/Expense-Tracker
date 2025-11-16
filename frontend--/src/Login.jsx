// frontend/src/Login.jsx
import { useState } from "react";
import { login } from "./api";

export default function Login({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      onAuthSuccess(res.user);
    } catch (error) {
      setErr(error?.response?.data?.error || "Login failed");
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ marginBottom: 12 }}>
      <h3>Login</h3>
      {err && <div style={{color:"crimson"}}>{err}</div>}
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <div style={{display:"flex", gap:8}}>
        <button type="submit">Login</button>
      </div>
    </form>
  );
}
