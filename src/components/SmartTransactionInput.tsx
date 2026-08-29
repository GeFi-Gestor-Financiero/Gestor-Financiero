import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Account, Transaction, TransactionType } from '../types';

type Draft = Omit<Transaction, 'id' | 'createdAt' | 'uid'>;
type Props = { accounts: Account[]; categories: string[]; onAddTransaction: (data: Draft) => Promise<void> };

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function parseNumber(raw: string, scale = 1) {
  let value = raw.replace(/\s/g, '');
  if (value.includes(',') && value.includes('.')) value = value.replace(/\./g, '').replace(',', '.');
  else if (value.includes(',')) value = value.replace(',', '.');
  else if (/\.\d{3}$/.test(value)) value = value.replace('.', '');
  return Number(value) * scale;
}

const writtenUnits: Record<string, number> = {
  cero:0, un:1, uno:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9,
  diez:10, once:11, doce:12, trece:13, catorce:14, quince:15, dieciseis:16, diecisiete:17, dieciocho:18, diecinueve:19,
  veinte:20, veintiuno:21, veintiun:21, veintidos:22, veintitres:23, veinticuatro:24, veinticinco:25, veintiseis:26, veintisiete:27, veintiocho:28, veintinueve:29,
  treinta:30, cuarenta:40, cincuenta:50, sesenta:60, setenta:70, ochenta:80, noventa:90,
  cien:100, ciento:100, doscientos:200, trescientos:300, cuatrocientos:400, quinientos:500, seiscientos:600, setecientos:700, ochocientos:800, novecientos:900,
};

function writtenAmount(text: string) {
  const tokens = normalize(text).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  let best = 0;
  for (let start = 0; start < tokens.length; start++) {
    let total = 0, group = 0, recognized = 0;
    for (let index = start; index < Math.min(tokens.length, start + 10); index++) {
      const word = tokens[index];
      if (word === 'y') continue;
      if (word === 'medio' || word === 'media') { group += 0.5; recognized++; continue; }
      if (word in writtenUnits) { group += writtenUnits[word]; recognized++; continue; }
      if (word === 'mil') { total += (group || 1) * 1000; group = 0; recognized++; continue; }
      if (word === 'millon' || word === 'millones' || word === 'palo' || word === 'palos') { total += (group || 1) * 1_000_000; group = 0; recognized++; best = Math.max(best, total); break; }
      if (word === 'luca' || word === 'lucas') { total += (group || 1) * 1000; group = 0; recognized++; best = Math.max(best, total); break; }
      if (word === 'peso' || word === 'pesos' || word === 'ars') { if (recognized) best = Math.max(best, total + group); break; }
      break;
    }
    if (recognized) best = Math.max(best, total + group);
  }
  return best;
}

function inferDate(text: string) {
  const clean = normalize(text), date = new Date();
  if (/\bayer\b/.test(clean)) date.setDate(date.getDate() - 1);
  const numeric = clean.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  if (numeric) {
    const year = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : date.getFullYear();
    return `${year}-${numeric[2].padStart(2, '0')}-${numeric[1].padStart(2, '0')}`;
  }
  const named = clean.match(/\b(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(\d{4}))?/);
  if (named && months.includes(named[2])) return `${named[3] || date.getFullYear()}-${String(months.indexOf(named[2]) + 1).padStart(2, '0')}-${named[1].padStart(2, '0')}`;
  return localDate(date);
}

function inferType(text: string): TransactionType {
  const value = normalize(text), cash = /\b(en )?efectivo\b/.test(value);
  if (/\b(desinvert|retir[eé]? de (?:la )?inversion)/.test(value)) return 'Desinversion';
  if (/\b(invert|compre (?:bitcoin|ethereum|ether|xrp|cripto))/.test(value)) return 'Inversion';
  if (/\b(ahorr|guarde como ahorro)/.test(value)) return 'Ahorro';
  if (/\b(prest[eé]|prestamo a)/.test(value)) return 'Prestamo';
  if (/\b(ingres|cobr|recib|deposit|rendimiento|me pagaron|me transfirieron)/.test(value)) return cash ? 'Ef+' : 'Ingreso';
  return cash ? 'Ef-' : 'Gasto';
}

function inferAmount(text: string) {
  const withoutDates = normalize(text).replace(/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g, '').replace(/\b\d{1,2}\s+de\s+[a-z]+(?:\s+de\s+\d{4})?/g, '');
  const match = withoutDates.match(/(?:\$\s*)?(\d[\d.,]*)(?:\s*)(millones?|millon|mil)\b/) || withoutDates.match(/(?:\$\s*)?(\d[\d.,]*)/);
  if (!match) return writtenAmount(withoutDates);
  const suffix = match[2] || '';
  return parseNumber(match[1], suffix.startsWith('millon') ? 1_000_000 : suffix === 'mil' ? 1_000 : 1);
}

function inferDetail(text: string) {
  const cleaned = text
    .replace(/\b(?:hoy|ayer)\b/gi, '')
    .replace(/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g, '')
    .replace(/\b\d{1,2}\s+de\s+[a-záéíóú]+(?:\s+de\s+\d{4})?/gi, '')
    .replace(/(?:\$\s*)?\d[\d.,]*\s*(?:millones?|millón|mil)?/gi, '')
    .replace(/\b(?:gast[eé]|pagu[eé]|compr[eé]|ingres[eéó]?|cobr[eé]|recib[ií]|deposit[eéó]?|invert[ií]|ahorr[eé]|prest[eé])\b/gi, '')
    .replace(/^\s*(?:pesos?|ars|usd|d[oó]lares?)?\s*(?:en|por|de|a)\s+/i, '')
    .replace(/\s+/g, ' ').trim().replace(/^[,.;:\-]+|[,.;:\-]+$/g, '').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function inferCategory(text: string, categories: string[]) {
  const value = normalize(text);
  const rules: Array<[RegExp, string]> = [
    [/sube|colectivo|tren|taxi|uber|nafta|transporte/, 'Transporte'],
    [/comida|super|sandwich|sanguche|helado|mostaza|mcdonald|open25|restaurante|cafe/, 'Alimentos'],
    [/steam|juego|cine|ocio/, 'Ocio'], [/medic|farmacia|salud/, 'Salud'],
    [/alquiler|luz|gas|internet|hogar/, 'Hogar'], [/sueldo|trabajo/, 'Trabajo'],
  ];
  const wanted = rules.find(([rule]) => rule.test(value))?.[1];
  return categories.find(item => normalize(item) === normalize(wanted || '')) || categories.find(item => normalize(item) === 'general') || categories[0] || 'General';
}

export default function SmartTransactionInput({ accounts, categories, onAddTransaction }: Props) {
  const [text, setText] = useState(''), [error, setError] = useState(''), [saving, setSaving] = useState(false);
  const analyzeAndSave = async () => {
    if (saving) return;
    if (!text.trim()) { setError('Escribí el movimiento que querés registrar.'); return; }
    const monto = inferAmount(text);
    if (!Number.isFinite(monto) || monto <= 0) { setError('No pude reconocer el monto. Probá, por ejemplo: “hoy gasté 10 mil en Open25”.'); return; }
    const categoria = inferType(text), cash = categoria === 'Ef+' || categoria === 'Ef-';
    const mentionedAccount = accounts.find(account => normalize(text).includes(normalize(account.nombre)));
    const defaultAccount = cash ? accounts.find(account => account.tipo === 'Efectivo') : accounts.find(account => account.tipo !== 'Efectivo');
    const movement: Draft = { fecha: inferDate(text), categoria, monto, motivo: inferDetail(text), moneda: 'ARS', cotizacion: 1, categoriaDetalle: inferCategory(text, categories), cuentaOrigen: mentionedAccount?.id || defaultAccount?.id || '' };
    setSaving(true); setError('');
    try { await onAddTransaction(movement); setText(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el movimiento.'); }
    finally { setSaving(false); }
  };
  return <section className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm dark:border-blue-900/70 dark:bg-slate-900 sm:p-5">
    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-600"/><div><h3 className="text-sm font-bold">Registro inteligente</h3><p className="text-[11px] text-slate-400">Describí el movimiento con tus palabras.</p></div></div>
    <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={text} disabled={saving} onChange={event=>{setText(event.target.value);setError('')}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();void analyzeAndSave()}}} placeholder="Ej: hoy gasté 10 mil en Open25" className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"/><button type="button" disabled={saving} onClick={()=>void analyzeAndSave()} className="min-h-11 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-60">{saving?'Registrando…':'Interpretar y registrar'}</button></div>
    {error&&<p className="mt-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 dark:bg-rose-950/30">{error}</p>}
  </section>;
}
