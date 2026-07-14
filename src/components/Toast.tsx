import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast } from '../context/NotificationContext';

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export default function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const iconMap = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colorMap = {
    success: 'bg-emerald-600 dark:bg-emerald-700 text-white',
    error: 'bg-rose-600 dark:bg-rose-700 text-white',
    warning: 'bg-amber-600 dark:bg-amber-700 text-white',
    info: 'bg-blue-600 dark:bg-blue-700 text-white',
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className={`${colorMap[toast.type]} rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-sm`}
    >
      {iconMap[toast.type]}
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="shrink-0 hover:opacity-80 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
