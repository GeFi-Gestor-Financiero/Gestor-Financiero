import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Account, Transaction, TransactionType } from '../types';
import { motion } from 'motion/react';

interface TransactionFormProps {
  onAddTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'uid'>) => Promise<void>;
  selectedMonth: number;
  selectedYear: number;
  accounts: Account[];
  currencies: string[];
  preferredCurrency?: string;
  baseCurrency?: string;
  categories: string[];
}

export default function TransactionForm({ onAddTransaction, selectedMonth, selectedYear, accounts, currencies, preferredCurrency = currencies[0] || 'ARS', baseCurrency = currencies[0] || 'ARS', categories }: TransactionFormProps) {
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
  const [moneda, setMoneda] = useState(preferredCurrency);
  const [effectiveBaseCurrency, setEffectiveBaseCurrency] = useState(baseCurrency);
  const [cotizacion, setCotizacion] = useState('1');
  const [categoriaDetalle, setCategoriaDetalle] = useState('General');
  const [cuentaOrigen, setCuentaOrigen] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showMoreMobile, setShowMoreMobile] = useState(false);
  const quoteLabel = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? `Exchange rate to ${effectiveBaseCurrency}` : `Cotización a ${effectiveBaseCurrency}`;

  // Sync date input if user shifts selected month/year and current date is no longer in range
  React.useEffect(() => {
    setFecha(getInitialDateString());
  }, [selectedMonth, selectedYear]);
  React.useEffect(() => { setEffectiveBaseCurrency(baseCurrency); setMoneda(preferredCurrency); setCotizacion(preferredCurrency === baseCurrency ? '1' : cotizacion); }, [preferredCurrency, baseCurrency]);
  React.useEffect(() => { const syncCurrency=(event:Event)=>{const currency=(event as CustomEvent<string>).detail;if(currency){setMoneda(currency);setEffectiveBaseCurrency(currency);setCotizacion('1');}};window.addEventListener('gefi:currency-preference',syncCurrency);return()=>window.removeEventListener('gefi:currency-preference',syncCurrency); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const valMonto = parseFloat(monto);
    if (!fecha || !categoria || isNaN(valMonto) || valMonto <= 0) {
      setError('Completá la fecha y un importe mayor que cero.'); return;
    }
    if (categoria === 'Transferencia' && (!cuentaOrigen || !cuentaDestino || cuentaOrigen === cuentaDestino)) {
      setError('Elegí una cuenta de origen y otra de destino. Este movimiento no se contará como gasto.'); return;
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
    <div id="add-transaction-form-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors duration-200">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-blue-500" />
        Nuevo Movimiento
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p role="alert" className="rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">{error}</p>}
        {/* Row for Fecha & Categoría */}
        <div className={`${showMoreMobile ? 'grid' : 'hidden'} grid-cols-1 sm:grid sm:grid-cols-2 gap-3`}>
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
              <option value="Transferencia">Transferencia entre cuenta y efectivo</option>
              <option value="Prestamo">Préstamo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 uppercase">Moneda</label><select value={moneda} onChange={e => { const value=e.target.value; setMoneda(value); if(value===effectiveBaseCurrency)setCotizacion('1'); }} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">{currencies.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="hidden space-y-1.5 sm:block"><label className="text-[11px] font-bold text-slate-500 uppercase">{quoteLabel}</label><input type="number" min="0.0001" step="any" value={cotizacion} onChange={e => setCotizacion(e.target.value)} disabled={moneda === effectiveBaseCurrency} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 disabled:opacity-50" /></div>
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

        <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 uppercase">{categoria === 'Transferencia' ? 'Sale de' : 'Cuenta origen'}</label><select value={cuentaOrigen} onChange={e => setCuentaOrigen(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><option value="">{categoria === 'Transferencia' ? 'Seleccionar' : 'Sin cuenta'}</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}{a.tipo === 'Efectivo' ? ' · Efectivo' : ''}</option>)}</select></div>
        <div className={`${showMoreMobile ? 'block' : 'hidden'} space-y-1.5 sm:block`}>
          <label className="text-[11px] font-bold text-slate-500 uppercase">Categoría de detalle</label><select value={categoriaDetalle} onChange={e => setCategoriaDetalle(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">{categories.map(c => <option key={c}>{c}</option>)}</select>
        </div>
        {categoria === 'Transferencia' && <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 uppercase">Entra a</label><select value={cuentaDestino} onChange={e => setCuentaDestino(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><option value="">Seleccionar</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}{a.tipo === 'Efectivo' ? ' · Efectivo' : ''}</option>)}</select><p className="text-[10px] text-slate-400">No modifica gastos, ingresos ni patrimonio.</p></div>}

        {/* Motivo */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Motivo / Detalle <span className="normal-case font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            placeholder="Ej: Compra supermercado mensual..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans transition-colors duration-150"
            maxLength={100}
          />
        </div>

        <button type="button" onClick={() => setShowMoreMobile(value => !value)} className="mx-auto flex min-h-10 items-center gap-1.5 px-4 text-xs font-bold text-blue-600 dark:text-blue-400 sm:hidden">
          {showMoreMobile ? <><ChevronUp className="h-4 w-4" />Ver menos</> : <><ChevronDown className="h-4 w-4" />Ver más</>}
        </button>

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
