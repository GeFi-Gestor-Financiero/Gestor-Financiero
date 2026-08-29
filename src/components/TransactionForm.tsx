import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Account, Transaction, TransactionType } from '../types';
import { motion } from 'motion/react';

interface TransactionFormProps {
  onAddTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'uid'>) => Promise<void>;
  selectedMonth: number;
  selectedYear: number;
  accounts: Account[];
  currencies: string[];
  categories: string[];
}

export default function TransactionForm({ onAddTransaction, selectedMonth, selectedYear, accounts, currencies, categories }: TransactionFormProps) {
  // Set default date as current date formatted in selected month/year to prevent out of bounds
  const getInitialDateString = () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();

    if (todayYear === selectedYear && todayMonth === selectedMonth) {
      return today.toISOString().split('T')[0];
    }
    
    // Default to the first day of the selected month/year
    const formattedMonth = String(selectedMonth + 1).padStart(2, '0');
    return `${selectedYear}-${formattedMonth}-01`;
  };

  const [fecha, setFecha] = useState<string>(getInitialDateString());
  const [categoria, setCategoria] = useState<TransactionType>('Ingreso');
  const [monto, setMonto] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [moneda, setMoneda] = useState('ARS');
  const [cotizacion, setCotizacion] = useState('1');
  const [categoriaDetalle, setCategoriaDetalle] = useState('General');
  const [cuentaOrigen, setCuentaOrigen] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync date input if user shifts selected month/year and current date is no longer in range
  React.useEffect(() => {
    setFecha(getInitialDateString());
  }, [selectedMonth, selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const valMonto = parseFloat(monto);
    if (!fecha || !categoria || isNaN(valMonto) || valMonto <= 0 || !motivo.trim()) {
      setError('Completá fecha, importe y motivo con valores válidos.'); return;
    }

    setLoading(true);
    try {
      await onAddTransaction({
        fecha,
        categoria,
        monto: valMonto, motivo: motivo.trim(), moneda, cotizacion: Number(cotizacion) || 1,
        categoriaDetalle, cuentaOrigen: cuentaOrigen || undefined, cuentaDestino: cuentaDestino || undefined
      });
      // Reset form but keep date and category for user convenience
      setMonto('');
      setMotivo('');
    } catch (error) {
      console.error("Error al guardar la transacción:", error);
      setError(error instanceof Error ? error.message : 'No se pudo guardar el movimiento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="add-transaction-form-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors duration-200">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-blue-500" />
        Nuevo Movimiento
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p role="alert" className="rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">{error}</p>}
        {/* Row for Fecha & Categoría */}
        <div className="grid grid-cols-2 gap-3">
          {/* Fecha */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans transition-colors duration-150"
              required
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans cursor-pointer transition-colors duration-150"
            >
              <option value="Ingreso" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ingreso</option>
              <option value="Gasto" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Gasto</option>
              <option value="Inversion" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Inversión</option>
              <option value="Ahorro" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ahorro</option>
              <option value="Ef+" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ef+ (Efectivo)</option>
              <option value="Ef-" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Ef- (Efectivo)</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Prestamo">Préstamo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 uppercase">Moneda</label><select value={moneda} onChange={e => setMoneda(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">{currencies.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 uppercase">Cotización a ARS</label><input type="number" min="0.0001" step="any" value={cotizacion} onChange={e => setCotizacion(e.target.value)} disabled={moneda === 'ARS'} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 disabled:opacity-50" /></div>
        </div>

        {/* Monto */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Monto
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-xs">$</span>
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full text-xs pl-6 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono transition-colors duration-150"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 uppercase">Categoría</label><select value={categoriaDetalle} onChange={e => setCategoriaDetalle(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">{categories.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 uppercase">Cuenta origen</label><select value={cuentaOrigen} onChange={e => setCuentaOrigen(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><option value="">Sin cuenta</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
        </div>
        {categoria === 'Transferencia' && <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 uppercase">Cuenta destino</label><select value={cuentaDestino} onChange={e => setCuentaDestino(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><option value="">Seleccionar</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>}

        {/* Motivo */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Motivo / Detalle
          </label>
          <input
            type="text"
            placeholder="Ej: Compra supermercado mensual..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans transition-colors duration-150"
            maxLength={100}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 dark:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>AGREGAR REGISTRO</span>
          )}
        </button>
      </form>
    </div>
  );
}
export { TransactionForm };
