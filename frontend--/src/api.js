import axios from "axios";

const base = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5001/api";
console.log("[api.js] base =", base);

const api = axios.create({ baseURL: base });

export const listExpenses = async (params = {}) => {
  const res = await api.get("/expenses", { params });
  console.log("[api.js] /expenses ->", res.data);
  return Array.isArray(res.data) ? res.data : [];
};

export const createExpense = async (payload) => {
  const res = await api.post("/expenses", payload);
  return res.data;
};

export const updateExpense = async (id, payload) => {
  const res = await api.put(`/expenses/${id}`, payload);
  return res.data;
};

export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

export const summaryMonth = async (year, month) => {
  const res = await api.get("/summary/month", { params: { year, month } });
  console.log("[api.js] /summary/month ->", res.data);
  return res.data;
};

export const byCategory = async (params = {}) => {
  const res = await api.get("/summary/by_category", { params });
  console.log("[api.js] /summary/by_category ->", res.data);
  // FORCE array no matter what
  return Array.isArray(res.data) ? res.data : [];
};
