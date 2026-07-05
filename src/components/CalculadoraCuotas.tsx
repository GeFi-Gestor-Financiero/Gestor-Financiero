import { useState } from 'react';
import { Calculator } from 'lucide-react';

function formatARS(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n).replace('ARS', '$');
}

export default function CalculadoraCuotas() {
  const [precio, setPrecio] = useState<string>('100000');
  const [cuotas, setCuotas] = useState<string>('3');
  const [interesMensual, setInteresMensual] = useState<string>('0');

  const precioNum = parseFloat(precio.replace(',', '.')) || 0;
  const cuotasNum = Math.max(1, parseInt(cuotas) || 1);
  const interesNum = (parseFloat(interesMensual.replace(',', '.')) || 0) / 100;

  let montoPorCuota: number;
  let totalAPagar: number;

  if (interesNum === 0) {
    // Sin interés: se divide el precio en partes iguales
    montoPorCuota = precioNum / cuotasNum;
    totalAPagar = precioNum;
  } else {
    // Con interés: fórmula de cuota fija (sistema francés)
    const i = interesNum;
    const n = cuotasNum;
    montoPorCuota = (precioNum * i) / (1 - Math.pow(1 + i, -n));
    totalAPagar = montoPorCuota * n;
  }

  const totalIntereses = totalAPagar - precioNum;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Calculator className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
          Calculadora de Cuotas
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 block">
            Precio total
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-mono">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={precio}
              onChange={(e) => setPrecio(e.target.value.replace(/[^0-9.,]/g, ''))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-6 pr-2 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 block">
            Cantidad de cuotas
          </label>
          <input
            type="number"
            min="1"
            value={cuotas}
            onChange={(e) => setCuotas(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 block">
          Interés mensual % (dejalo en 0 si es "sin interés")
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={interesMensual}
            onChange={(e) => setInteresMensual(e.target.value.replace(/[^0-9.,]/g, ''))}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-3 pr-7 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-mono">%</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-2">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Cada cuota</span>
          <span className="text-sm font-bold font-mono text-blue-700 dark:text-blue-300">
            {formatARS(montoPorCuota)}
          </span>
        </div>
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-lg px-3 py-2">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total a pagar</span>
          <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
            {formatARS(totalAPagar)}
          </span>
        </div>
        {totalIntereses > 0.01 && (
          <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/20 rounded-lg px-3 py-2">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Intereses totales</span>
            <span className="text-sm font-bold font-mono text-rose-700 dark:text-rose-300">
              {formatARS(totalIntereses)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
