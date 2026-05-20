import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const API = 'http://localhost:5000/api';

const initialState = {
  user: null,
  token: null,
  isLoggedIn: false,
  loading: true
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload.user, token: action.payload.token, isLoggedIn: true, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, token: null, isLoggedIn: false, loading: false };
    case 'UPDATE_PROFILE':
      return { ...state, user: { ...state.user, ...action.payload.user }, token: action.payload.token || state.token };
    case 'LOADED':
      return { ...state, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch({ type: 'LOGIN', payload: { user, token } });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOADED' });
      }
    } else {
      dispatch({ type: 'LOADED' });
    }
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Login failed');
    
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    dispatch({ type: 'LOGIN', payload: data.data });
    return data;
  };

  const register = async (username, email, password) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Registration failed');
    
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    dispatch({ type: 'LOGIN', payload: data.data });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (updates) => {
    const res = await fetch(`${API}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Update failed');
    
    if (data.data.token) localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    dispatch({ type: 'UPDATE_PROFILE', payload: data.data });
    return data;
  };

  const isUploader = state.user?.role === 'uploader' || state.user?.role === 'admin';
  const isAdmin = state.user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile, isUploader, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
