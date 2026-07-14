import { useNotification } from '../context/NotificationContext';

export const useToast = () => {
  const { showToast } = useNotification();

  return {
    success: (message: string) => showToast({ type: 'success', message }),
    error: (message: string) => showToast({ type: 'error', message }),
    warning: (message: string) => showToast({ type: 'warning', message }),
    info: (message: string) => showToast({ type: 'info', message }),
  };
};
