// frontend/src/Register.jsx
import { useState } from "react";
import { register } from "./api";

export default function Register({ onRegistered }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await register({ email, password, name });
      onRegistered && onRegistered(res);
    } catch (error) {
      setErr(error?.response?.data?.error || "Registration failed");
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ marginBottom: 12 }}>
      <h3>Register</h3>
      {err && <div style={{color:"crimson"}}>{err}</div>}
      <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <div style={{display:"flex", gap:8}}>
        <button type="submit">Create Account</button>
      </div>
    </form>
  );
}
