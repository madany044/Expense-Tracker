import axios from "axios";

const base = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5001/api";
const api = axios.create({ baseURL: base });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// export functions
export const listExpenses = (params = {}) =>
  api.get("/expenses", { params }).then(r => (Array.isArray(r.data) ? r.data : []));

export const createExpense = async (payload) => {
  try {
    const res = await api.post("/expenses", payload);
    return res.data;
  } catch (err) {
    // Log details for debugging
    console.error("[api.createExpense] error:", err?.response?.status, err?.response?.data);
    // rethrow so UI can handle it
    throw err;
  }
};


export const updateExpense = (id, payload) =>
  api.put(`/expenses/${id}`, payload).then(r => r.data);

export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

export const login = (payload) => api.post("/auth/login", payload).then(r => r.data);
export const register = (payload) => api.post("/auth/register", payload).then(r => r.data);

export const summaryMonth = (year, month) =>
  api.get("/summary/month", { params: { year, month } }).then(r => r.data);

export const byCategory = (params = {}) =>
  api.get("/summary/by_category", { params }).then(r => (Array.isArray(r.data) ? r.data : []));

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);
