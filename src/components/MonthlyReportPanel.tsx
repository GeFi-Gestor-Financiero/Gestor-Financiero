import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { Transaction } from '../types';

type Props = { income: number; expense: number; investment: number; categories: Record<string, number>; transactions: Transaction[]; month: number; year: number; currency: string; language?: 'es' | 'en'; hidden?: boolean };
const transactionValue = (transaction: Transaction) => transaction.monto * (transaction.moneda === 'ARS' || !transaction.moneda ? 1 : Number(transaction.cotizacion || 1));
const isCorrection = (transaction: Transaction) => transaction.categoriaDetalle === 'Corrección de saldo' || /^Corrección de\s/i.test(transaction.motivo || '');

export default function MonthlyReportPanel({ income, expense, investment, categories, transactions, month, year, currency, language = 'es', hidden = false }: Props) {
  const locale = language === 'en' ? 'en-US' : 'es-AR';
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daily = Array.from({ length: daysInMonth }, (_, index) => ({ day: index + 1, value: 0 }));
  transactions.forEach(transaction => {
    if (isCorrection(transaction)) return;
    const day = Math.max(1, Math.min(daysInMonth, Number(transaction.fecha.slice(8, 10)) || 1));
    const value = transactionValue(transaction);
    if (transaction.categoria === 'Ingreso' || transaction.categoria === 'Ef+') daily[day - 1].value += value;
    if (transaction.categoria === 'Gasto' || transaction.categoria === 'Gasto efectivo' || transaction.categoria === 'Ef-' || transaction.categoria === 'Inversion') daily[day - 1].value -= value;
    if (transaction.categoria === 'Desinversion') daily[day - 1].value += value;
  });
  let accumulated = 0;
  const cumulative = daily.map(point => ({ day: point.day, value: accumulated += point.value }));
  const chartValues = cumulative.map(point => point.value);
  const minValue = Math.min(0, ...chartValues), maxValue = Math.max(0, ...chartValues), range = Math.max(1, maxValue - minValue);
  const width = 640, height = 220, padX = 18, padY = 20;
  const points = cumulative.map((point, index) => ({ ...point, x: padX + index / Math.max(1, cumulative.length - 1) * (width - padX * 2), y: padY + (maxValue - point.value) / range * (height - padY * 2) }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const zeroY = padY + maxValue / range * (height - padY * 2);
  const area = points.length ? `${line} L ${points[points.length - 1].x.toFixed(1)} ${zeroY.toFixed(1)} L ${points[0].x.toFixed(1)} ${zeroY.toFixed(1)} Z` : '';
  const top = Object.entries(categories).sort((left, right) => right[1] - left[1]).slice(0, 5);
  const categoryTotal = Math.max(1, top.reduce((sum, [, value]) => sum + value, 0));
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month, 1));
  const hasMovements = transactions.some(transaction => !isCorrection(transaction));

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="border-b border-slate-100 p-4 dark:border-slate-800">
      <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><BarChart3 className="h-4 w-4"/></span><div><h3 className="text-sm font-bold">Reporte del mes</h3><p className="mt-0.5 text-[11px] capitalize text-slate-400">{monthName} {year}</p></div></div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20"><div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300"><span className="text-[10px] font-bold uppercase tracking-wide">Ingresos</span><TrendingUp className="h-4 w-4"/></div><strong className="mt-1 block truncate font-mono text-base">{hidden ? '••••' : money(income)}</strong></div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 dark:border-rose-900/50 dark:bg-rose-950/20"><div className="flex items-center justify-between text-rose-700 dark:text-rose-300"><span className="text-[10px] font-bold uppercase tracking-wide">Gastos</span><TrendingDown className="h-4 w-4"/></div><strong className="mt-1 block truncate font-mono text-base">{hidden ? '••••' : money(expense)}</strong></div>
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold">Flujo acumulado</p><p className="mt-0.5 text-[10px] text-slate-400">Ingresos menos gastos e inversiones</p></div><strong className={`font-mono text-xs ${accumulated >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{hidden ? '••••' : money(accumulated)}</strong></div>
      {hasMovements ? <div className="mt-3 overflow-hidden rounded-xl bg-slate-950 p-2.5">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Evolución diaria del flujo acumulado del mes">
          <defs><linearGradient id="monthly-flow-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b82f6" stopOpacity=".42"/><stop offset="1" stopColor="#3b82f6" stopOpacity=".03"/></linearGradient></defs>
          {[0.25, 0.5, 0.75].map(mark => <line key={mark} x1={padX} x2={width-padX} y1={height*mark} y2={height*mark} stroke="#263750" strokeWidth="1"/>)}
          <line x1={padX} x2={width-padX} y1={zeroY} y2={zeroY} stroke="#53657e" strokeDasharray="5 5"/><path d={area} fill="url(#monthly-flow-area)"/><path d={line} fill="none" stroke="#4f8cff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          {points.filter((_, index) => index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2)).map(point => <circle key={point.day} cx={point.x} cy={point.y} r="5" fill="#93c5fd" stroke="#17233a" strokeWidth="3"/>)}
        </svg>
        <div className="flex justify-between px-2 text-[9px] font-medium text-slate-500"><span>1 {monthName.slice(0,3)}</span><span>{Math.ceil(daysInMonth/2)} {monthName.slice(0,3)}</span><span>{daysInMonth} {monthName.slice(0,3)}</span></div>
      </div> : <p className="mt-3 rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">Todavía no hay movimientos para mostrar este mes.</p>}
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Gastos por categoría</p><span className="text-[10px] text-slate-400">{hidden ? '••••' : money(expense)}</span></div>{top.length ? <div className="space-y-3">{top.map(([name, value], index) => { const percentage = Math.round(value / categoryTotal * 100); const colors = ['bg-rose-700','bg-rose-600','bg-rose-500','bg-rose-400','bg-rose-300']; return <div key={name}><div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate font-medium">{name}</span><span className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400"><b className="font-sans text-[10px] font-medium">{percentage}%</b>{hidden ? '••••' : money(value)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${colors[index]}`} style={{width:`${percentage}%`}}/></div></div>})}</div> : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">Todavía no hay gastos para mostrar este mes.</p>}</div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 text-xs dark:bg-amber-950/20"><span className="font-medium text-amber-800 dark:text-amber-300">Inversiones del mes</span><strong className="font-mono text-amber-700 dark:text-amber-400">{hidden ? '••••' : money(investment)}</strong></div>
    </div>
  </section>;
}
