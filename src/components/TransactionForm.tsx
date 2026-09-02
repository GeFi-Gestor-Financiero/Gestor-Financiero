import React, { useState } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, ChevronUp, Delete, Plus, Tag, WalletCards } from 'lucide-react';
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
  investmentPlatforms?: string[];
}

export default function TransactionForm({ onAddTransaction, selectedMonth, selectedYear, accounts, currencies, preferredCurrency = currencies[0] || 'ARS', baseCurrency = currencies[0] || 'ARS', categories, investmentPlatforms = [] }: TransactionFormProps) {
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
  const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];
  const appendAmount = (key: string) => setMonto(current => {
    if (key === '.' && current.includes('.')) return current;
    if (current.replace('.', '').length >= 10) return current;
    if (current === '0' && key !== '.') return key;
    return `${current}${key}`;
  });

  // Sync date input if user shifts selected month/year and current date is no longer in range
  React.useEffect(() => {
    setFecha(getInitialDateString());
  }, [selectedMonth, selectedYear]);
  React.useEffect(() => { setEffectiveBaseCurrency(baseCurrency); setMoneda(preferredCurrency); setCotizacion(preferredCurrency === baseCurrency ? '1' : cotizacion); }, [preferredCurrency, baseCurrency]);
  React.useEffect(() => { const syncCurrency=(event:Event)=>{const currency=(event as CustomEvent<string>).detail;if(currency){setMoneda(currency);setEffectiveBaseCurrency(currency);setCotizacion('1');}};window.addEventListener('gefi:currency-preference',syncCurrency);return()=>window.removeEventListener('gefi:currency-preference',syncCurrency); }, []);
  React.useEffect(() => { const options=categoria==='Inversion'&&investmentPlatforms.length?investmentPlatforms:categories;if(options.length&&!options.includes(categoriaDetalle))setCategoriaDetalle(options[0]); }, [categoria, categories, investmentPlatforms]);

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
    <div id="add-transaction-form-card" className="gefi-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors duration-200">
      <form onSubmit={handleSubmit} className="mobile-quick-entry -m-4 overflow-hidden rounded-2xl border border-slate-800 bg-[#070a10] text-slate-100 sm:hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">Registrar movimiento</h3>
            <p className="mt-1 text-[11px] text-slate-500">Carga manual</p>
          </div>
          <select value={moneda} onChange={e=>setMoneda(e.target.value)} aria-label="Moneda" className="min-h-9 rounded-lg border border-slate-700 bg-[#0d121c] px-3 text-xs font-semibold text-slate-200 outline-none focus:border-blue-500">
            {currencies.map(currency=><option key={currency} className="bg-slate-900">{currency}</option>)}
          </select>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="grid grid-cols-2 border-b border-slate-800">
            <button type="button" onClick={()=>setCategoria('Ingreso')} className={`min-h-10 border-b-2 text-xs font-semibold transition-colors ${categoria==='Ingreso'?'border-blue-500 text-white':'border-transparent text-slate-500 hover:text-slate-300'}`}>Ingreso</button>
            <button type="button" onClick={()=>setCategoria('Gasto')} className={`min-h-10 border-b-2 text-xs font-semibold transition-colors ${categoria==='Gasto'?'border-blue-500 text-white':'border-transparent text-slate-500 hover:text-slate-300'}`}>Gasto</button>
          </div>

          <div className="py-7">
            <label htmlFor="mobile-amount" className="text-[11px] font-medium text-slate-500">Importe</label>
            <div className="mt-2 flex items-baseline gap-3 text-white">
              <span className="font-mono text-sm font-medium text-blue-400">{moneda}</span>
              <input id="mobile-amount" value={monto} onChange={e=>setMonto(e.target.value)} inputMode="decimal" placeholder="0" aria-label="Importe" className="min-h-0 w-full border-0 bg-transparent p-0 font-mono text-5xl font-medium tracking-[-0.06em] text-white outline-none placeholder:text-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-800 border-y border-slate-800">
            <label className="flex min-w-0 cursor-pointer flex-col gap-1 px-3 py-3 text-[10px] font-medium text-slate-500 active:bg-slate-900"><CalendarDays className="h-4 w-4 text-blue-400"/><span className="max-w-full truncate text-slate-300">{new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR',{day:'2-digit',month:'short'})}</span><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} className="sr-only"/></label>
            <label className="flex min-w-0 cursor-pointer flex-col gap-1 px-3 py-3 text-[10px] font-medium text-slate-500 active:bg-slate-900"><Tag className="h-4 w-4 text-blue-400"/><select aria-label="Tipo de movimiento" value={categoria} onChange={e=>setCategoria(e.target.value as TransactionType)} className="min-h-0 max-w-full border-0 bg-transparent p-0 text-[10px] text-slate-300 outline-none"><option className="bg-slate-900" value="Ingreso">Ingreso</option><option className="bg-slate-900" value="Gasto">Gasto</option><option className="bg-slate-900" value="Inversion">Inversión</option><option className="bg-slate-900" value="Ahorro">Ahorro</option><option className="bg-slate-900" value="Transferencia">Transferencia</option><option className="bg-slate-900" value="Prestamo">Préstamo</option></select></label>
            <label className="flex min-w-0 cursor-pointer flex-col gap-1 px-3 py-3 text-[10px] font-medium text-slate-500 active:bg-slate-900"><WalletCards className="h-4 w-4 text-blue-400"/><select aria-label="Cuenta de origen" value={cuentaOrigen} onChange={e=>setCuentaOrigen(e.target.value)} className="min-h-0 max-w-full border-0 bg-transparent p-0 text-[10px] text-slate-300 outline-none"><option className="bg-slate-900" value="">Sin cuenta</option>{accounts.map(account=><option className="bg-slate-900" key={account.id} value={account.id}>{account.nombre}</option>)}</select></label>
          </div>
          <label className="flex min-h-11 items-center justify-between gap-3 border-b border-slate-800 px-1 text-[10px] font-medium text-slate-500"><span>{categoria==='Transferencia'?'Cuenta destino':categoria==='Inversion'?'Plataforma':'Categoría'}</span>{categoria==='Transferencia'?<select aria-label="Cuenta de destino" value={cuentaDestino} onChange={e=>setCuentaDestino(e.target.value)} className="min-h-0 max-w-[65%] border-0 bg-transparent p-0 text-right text-[10px] text-slate-300 outline-none"><option className="bg-slate-900" value="">Seleccionar</option>{accounts.map(account=><option className="bg-slate-900" key={account.id} value={account.id}>{account.nombre}</option>)}</select>:<select aria-label={categoria==='Inversion'?'Plataforma de inversión':'Categoría de detalle'} value={categoriaDetalle} onChange={e=>setCategoriaDetalle(e.target.value)} className="min-h-0 max-w-[65%] border-0 bg-transparent p-0 text-right text-[10px] text-slate-300 outline-none">{(categoria==='Inversion'&&investmentPlatforms.length?investmentPlatforms:categories).map(option=><option className="bg-slate-900" key={option}>{option}</option>)}</select>}</label>

          <div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-x-3 gap-y-2">
            {keypad.map(key=><button key={key} type="button" onClick={()=>appendAmount(key)} className="grid min-h-11 place-items-center rounded-lg border border-slate-800 bg-[#0c111a] text-lg font-medium text-slate-200 hover:border-slate-700 hover:bg-[#111827] active:scale-[0.98]">{key}</button>)}
            <button type="button" aria-label="Borrar último número" onClick={()=>setMonto(current=>current.slice(0,-1))} className="grid min-h-11 place-items-center rounded-lg border border-slate-800 bg-transparent text-slate-500 hover:border-blue-800 hover:text-blue-400 active:scale-[0.98]"><Delete className="h-5 w-5"/></button>
          </div>

          <div className="mt-5 space-y-3">
            <input value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Detalle opcional" maxLength={100} className="w-full rounded-lg border border-slate-800 bg-[#0c111a] px-3 py-3 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500"/>
            {error&&<p role="alert" className="border-l-2 border-rose-500 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">{error}</p>}
            <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.18)] hover:bg-blue-500 active:scale-[0.99] disabled:opacity-60">
              <span>{loading?'Guardando…':'Registrar movimiento'}</span><ArrowRight className="h-4 w-4"/>
            </button>
          </div>
        </div>
      </form>

      <div className="hidden sm:block">
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
          <label className="text-[11px] font-bold text-slate-500 uppercase">{categoria === 'Inversion' ? 'Plataforma de inversión' : 'Categoría de detalle'}</label><select value={categoriaDetalle} onChange={e => setCategoriaDetalle(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">{(categoria === 'Inversion' && investmentPlatforms.length ? investmentPlatforms : categories).map(c => <option key={c}>{c}</option>)}</select>
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
    </div>
  );
}
export { TransactionForm };
