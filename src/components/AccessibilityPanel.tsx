import { Accessibility } from 'lucide-react';

type Scale = 'normal' | 'large' | 'extraLarge';
type Props = { value: Scale; onChange: (value: Scale) => void };

export default function AccessibilityPanel({ value, onChange }: Props) {
  const choices: Array<[Scale, string, string]> = [['normal', 'Normal', '100%'], ['large', 'Grande', '112%'], ['extraLarge', 'Muy grande', '125%']];
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex gap-2"><Accessibility className="mt-0.5 h-4 w-4 text-blue-600"/><div><h3 className="text-sm font-bold">Accesibilidad</h3><p className="mt-1 text-[11px] text-slate-400">Elegí el tamaño de texto más cómodo para vos.</p></div></div><div className="mt-4 grid grid-cols-3 gap-2">{choices.map(([scale, label, sample]) => <button type="button" key={scale} onClick={() => onChange(scale)} aria-pressed={value === scale} className={`rounded-xl border p-3 text-center transition ${value === scale ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300' : 'border-slate-200 hover:border-blue-300 dark:border-slate-700'}`}><span className={`block font-bold ${scale === 'large' ? 'text-sm' : scale === 'extraLarge' ? 'text-base' : 'text-xs'}`}>{label}</span><span className="mt-1 block text-[10px] text-slate-400">{sample}</span></button>)}</div></section>;
}
