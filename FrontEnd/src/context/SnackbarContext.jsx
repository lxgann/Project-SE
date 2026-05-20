import React, { createContext, useContext, useState, useCallback } from 'react';
import './Snackbar.css';

const SnackbarContext = createContext();

export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'info' });

  const showSnackbar = useCallback((message, type = 'info') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 5000);
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar.open && (
        <div className={`snackbar snackbar-${snackbar.type} snackbar-show`}>
          <span className="snackbar-icon">
            {snackbar.type === 'success' && '✓'}
            {snackbar.type === 'error' && '✕'}
            {snackbar.type === 'warning' && '⚠'}
            {snackbar.type === 'info' && 'ℹ'}
          </span>
          <span className="snackbar-message">{snackbar.message}</span>
          <button className="snackbar-close" onClick={closeSnackbar}>×</button>
        </div>
      )}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => useContext(SnackbarContext);
