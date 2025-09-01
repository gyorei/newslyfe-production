import React, { createContext, useState, ReactNode } from 'react';
import { AlertMessage } from './AlertMessage';
import styles from './AlertMessage.module.css'; // ✅ ÚJ: CSS import

// ✅ EXPORT hozzáadása
export interface AlertData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// ✅ EXPORT hozzáadása
export interface AlertContextType {
  showAlert: (message: string, type: AlertData['type'], duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  clearAllAlerts: () => void;
}

// ✅ EXPORT hozzáadása
export const AlertContext = createContext<AlertContextType | null>(null);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  const showAlert = (message: string, type: AlertData['type'], duration = 4000) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newAlert: AlertData = { id, message, type, duration };

    setAlerts((prev) => [...prev, newAlert]);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const contextValue: AlertContextType = {
    showAlert,
    success: (message, duration) => showAlert(message, 'success', duration),
    error: (message, duration) => showAlert(message, 'error', duration),
    warning: (message, duration) => showAlert(message, 'warning', duration),
    info: (message, duration) => showAlert(message, 'info', duration),
    clearAllAlerts,
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {/* ✅ JAVÍTOTT Alert Megjelenítő Terület CSS osztályokkal */}
      <div className={styles.alertContainer}>
        {alerts.map((alert) => (
          <div key={alert.id} className={styles.alertStack}>
            <AlertMessage
              message={alert.message}
              type={alert.type}
              onClose={() => removeAlert(alert.id)}
              duration={alert.duration}
            />
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
};
