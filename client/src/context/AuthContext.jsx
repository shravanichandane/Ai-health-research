import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkUser();
    } else {
      setLoading(false);
    }
  }, []);

  const checkUser = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/me`);
      setUser(data);
    } catch {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data);
    return data;
  };

  const register = async (email, password, name, role) => {
    const { data } = await axios.post(`${API_URL}/api/auth/register`, { email, password, name, role });
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
