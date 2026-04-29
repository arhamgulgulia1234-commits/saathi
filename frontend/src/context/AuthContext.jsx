import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('saathi_token') || null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);

  const API = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    if (token) {
      localStorage.setItem('saathi_token', token);
      fetchUser(token);
    } else {
      localStorage.removeItem('saathi_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async (authToken) => {
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsAnonymous(false);
      } else {
        setToken(null);
      }
    } catch (err) {
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const register = async (username, email, password) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAnonymous(false);
  };

  const continueAsAnonymous = () => {
    setIsAnonymous(true);
    setLoading(false);
  };

  const value = {
    user,
    token,
    loading,
    isAnonymous,
    login,
    register,
    logout,
    continueAsAnonymous,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
