import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';

type TipoCompra = 'general' | 'videojuegos';

export default function CalculadoraImpuestos() {
  const [monto, setMonto] = useState<string>('10');
  const [tipo, setTipo] = useState<TipoCompra>('general');
  const [dolarOficial, setDolarOficial] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function cargar() {
      try {
        const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (active) {
          setDolarOficial(data.venta);
          setLoading(false);
        }
      } catch {
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    }

    cargar();
    const interval = setInterval(cargar, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const montoNum = parseFloat(monto.replace(',', '.')) || 0;
  const porcentajeRecargo = tipo === 'general' ? 0.30 : 0;

  const subtotalSinRecargo = dolarOficial ? montoNum * dolarOficial : 0;
  const recargo = subtotalSinRecargo * porcentajeRecargo;
  const total = subtotalSinRecargo + recargo;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
          <Receipt className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
          Precio Final con Impuestos
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 block">
            Monto en dólares
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-mono">US$</span>
            <input
              type="text"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ''))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-11 pr-2 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 block">
            Tipo de compra
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCompra)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="general">Streaming / Compras</option>
            <option value="videojuegos">Videojuegos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-2">Cargando cotización...</p>
      ) : error ? (
        <p className="text-[11px] text-rose-500 text-center py-2">No se pudo cargar el dólar. Probá más tarde.</p>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-lg px-3 py-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Dólar Oficial</span>
            <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
              ${dolarOficial?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-lg px-3 py-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Percepción ({(porcentajeRecargo * 100).toFixed(0)}%)
            </span>
            <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
              ${recargo.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between bg-violet-50 dark:bg-violet-950/20 rounded-lg px-3 py-2">
            <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">Total en pesos</span>
            <span className="text-sm font-bold font-mono text-violet-700 dark:text-violet-300">
              ${total.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
