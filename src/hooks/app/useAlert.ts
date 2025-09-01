import { useContext } from 'react';
import { AlertContext, AlertContextType } from '../../components/AlertMessage/AlertContainer';

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Convenience hooks
export const useSuccessAlert = () => {
  const { success } = useAlert();
  return success;
};

export const useErrorAlert = () => {
  const { error } = useAlert();
  return error;
};

export const useWarningAlert = () => {
  const { warning } = useAlert();
  return warning;
};

export const useInfoAlert = () => {
  const { info } = useAlert();
  return info;
};
