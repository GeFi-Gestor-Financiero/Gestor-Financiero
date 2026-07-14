import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Alert } from '../context/NotificationContext';

interface AlertModalProps {
  alert: Alert;
  onClose: (id: string) => void;
}

export default function AlertModal({ alert, onClose }: AlertModalProps) {
  const iconMap = {
    success: <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    error: <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    info: <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
  };

  const bgColorMap = {
    success: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30',
    error: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30',
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30',
  };

  const buttonColorMap = {
    success: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600',
    error: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600',
    warning: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600',
    info: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
  };

  const handleConfirm = () => {
    if (alert.onConfirm) {
      alert.onConfirm();
    }
    onClose(alert.id);
  };

  const handleCancel = () => {
    if (alert.onCancel) {
      alert.onCancel();
    }
    onClose(alert.id);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => handleCancel()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`${bgColorMap[alert.type]} border rounded-2xl shadow-xl p-6 max-w-sm w-full transition-colors duration-200`}
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5">
              {iconMap[alert.type]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-base">
                {alert.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-normal">
                {alert.message}
              </p>
            </div>
            <button
              onClick={() => handleCancel()}
              className="shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex gap-3">
            {alert.isConfirm && (
              <button
                onClick={() => handleCancel()}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={() => handleConfirm()}
              className={`flex-1 px-4 py-2 rounded-lg ${buttonColorMap[alert.type]} text-white font-semibold text-sm transition`}
            >
              {alert.isConfirm ? 'Confirmar' : 'Aceptar'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
