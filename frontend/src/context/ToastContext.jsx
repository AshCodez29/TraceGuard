import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone });
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(null), 3200);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={value}>{children}{toast && <div className={`toast gl ${toast.tone}`} role="status">{toast.message}</div>}</ToastContext.Provider>;
}

export const useToast = () => {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used within ToastProvider');
  return value;
};
