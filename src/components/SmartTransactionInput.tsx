import { useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { Account, Transaction, TransactionType } from '../types';
import { interpretTransaction } from '../services/aiTransaction';

type Draft = Omit<Transaction, 'id' | 'createdAt' | 'uid'>;
type Props = { accounts: Account[]; categories: string[]; investmentPlatforms?: string[]; currency?: string; language?: 'es'|'en'; onAddTransaction: (data: Draft) => Promise<void> };

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

const spellingVocabulary = ['peso','pesos','unos','unas','caramelo','caramelos','budín','budines','chocolate','chocolates','comida','bebida','coca','cola','cocacola','supermercado','restaurante','helado','sandwich','sanguche','milanesa','transporte','colectivo','sube','farmacia','medicamento','internet','alquiler','inversión','bitcoin','ethereum','efectivo','mercado','pago','rendimiento','préstamo','ingreso','gasto','compré','pagué','gasté','recibí','invertí','ahorré'];
const editDistance = (left: string, right: string) => {
  const rows = Array.from({length:left.length+1},(_,index)=>index);
  for(let column=1;column<=right.length;column++){let previous=rows[0];rows[0]=column;for(let row=1;row<=left.length;row++){const saved=rows[row];rows[row]=Math.min(rows[row]+1,rows[row-1]+1,previous+(left[row-1]===right[column-1]?0:1));previous=saved;}}
  return rows[left.length];
};
function correctSpelling(text: string) {
  return text.replace(/[a-záéíóúñ]+/gi, raw => {
    const clean=normalize(raw);let best=raw,bestDistance=99;
    for(const candidate of spellingVocabulary){const distance=editDistance(clean,normalize(candidate));if(distance<bestDistance){best=candidate;bestDistance=distance;}}
    const limit=clean.length>=8?2:clean.length>=4?1:0;
    if(bestDistance>limit)return raw;
    return /^[A-ZÁÉÍÓÚÑ]/.test(raw)?best.charAt(0).toUpperCase()+best.slice(1):best;
  });
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
  const cleaned = correctSpelling(text)
    .replace(/\b(?:hoy|ayer)\b/gi, '')
    .replace(/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g, '')
    .replace(/\b\d{1,2}\s+de\s+[a-záéíóú]+(?:\s+de\s+\d{4})?/gi, '')
    .replace(/(?:\$\s*)?\d[\d.,]*\s*(?:millones?|millón|mil)?/gi, '')
    .replace(/\b(?:(?:cero|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|diecis[eé]is|diecisiete|dieciocho|diecinueve|veinte|veinti\w+|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento|\w+cientos|medio|media|mil|millones?|mill[oó]n|lucas?|palos?|y)\s*)+(?:pesos?|ars)?\b/gi, '')
    .replace(/\b(?:gast|pag|compr|ingres|cobr|recib|deposit|invert|ahorr|prest)[a-záéíóúñ]*(?=\s|$)/gi, '')
    .replace(/^\s*(?:(?:pesos?|ars|usd|d[oó]lares?)\s*)?(?:(?:en|por|para|con|de|a)\s+)*(?:(?:el|la|los|las|un|uno|una|unos|unas)\s+)*/i, '')
    .replace(/\s+/g, ' ').trim().replace(/^[,.;:\-]+|[,.;:\-]+$/g, '').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function inferCategory(text: string, categories: string[]) {
  const value = normalize(text);
  const rules: Array<[RegExp, string]> = [
    [/sube|colectivo|tren|taxi|uber|nafta|transporte/, 'Transporte'],
    [/comida|super|sandwich|sanguche|helado|mostaza|mcdonald|open25|restaurante|cafe|caramelo|chocolate|budin/, 'Alimentos'],
    [/steam|juego|cine|ocio/, 'Ocio'], [/medic|farmacia|salud/, 'Salud'],
    [/alquiler|luz|gas|internet|hogar/, 'Hogar'], [/sueldo|trabajo/, 'Trabajo'],
  ];
  const wanted = rules.find(([rule]) => rule.test(value))?.[1];
  return categories.find(item => normalize(item) === normalize(wanted || '')) || categories.find(item => normalize(item) === 'general') || categories[0] || 'General';
}

export default function SmartTransactionInput({ accounts, categories, investmentPlatforms = [], currency = 'ARS', language = 'es', onAddTransaction }: Props) {
  const [text, setText] = useState(''), [error, setError] = useState(''), [saving, setSaving] = useState(false),[listening,setListening]=useState(false);
  const currencyName=new Intl.NumberFormat(language==='en'?'en-US':'es-AR',{style:'currency',currency,currencyDisplay:'name'}).formatToParts(100).find(part=>part.type==='currency')?.value||currency;
  const example=language==='en'?`E.g.: today I spent 100 ${currencyName} at Walmart`:`Ej: hoy gasté 100 ${currencyName} en el supermercado`;
  const analyzeAndSave = async (spokenText=text) => {
    if (saving) return;
    if (!spokenText.trim()) { setError('Escribí o dictá el movimiento que querés registrar.'); return; }
    setSaving(true); setError('');
    try {
      let movement:Draft|undefined;
      // Sin Internet no esperamos la IA: el análisis local es inmediato y el
      // movimiento queda guardado para sincronizarse después.
      if (navigator.onLine) try {
        const parsed=await interpretTransaction(spokenText,categories,localDate());
        const mentionedAccount=accounts.find(account=>normalize(spokenText).includes(normalize(account.nombre)));
        const defaultAccount=parsed.efectivo?accounts.find(account=>account.tipo==='Efectivo'):accounts.find(account=>account.tipo!=='Efectivo');
        const platform=parsed.categoria==='Inversion'?investmentPlatforms.find(item=>normalize(spokenText).includes(normalize(item))):undefined;
        movement={fecha:parsed.fecha,categoria:parsed.categoria,monto:parsed.monto,motivo:parsed.motivo,moneda:currency,cotizacion:1,categoriaDetalle:platform||parsed.categoriaDetalle,cuentaOrigen:mentionedAccount?.id||defaultAccount?.id||''};
      } catch { /* Cuando la IA no responde, se usa el análisis local. */ }
      if (!movement) {
        const monto=inferAmount(spokenText);if(!Number.isFinite(monto)||monto<=0)throw new Error('No pude reconocer el monto. Probá, por ejemplo: “hoy gasté 10 mil en Open25”.');
        const categoria=inferType(spokenText),cash=categoria==='Ef+'||categoria==='Ef-',mentionedAccount=accounts.find(account=>normalize(spokenText).includes(normalize(account.nombre))),defaultAccount=cash?accounts.find(account=>account.tipo==='Efectivo'):accounts.find(account=>account.tipo!=='Efectivo');
        const platform=categoria==='Inversion'?investmentPlatforms.find(item=>normalize(spokenText).includes(normalize(item))):undefined;
        movement={fecha:inferDate(spokenText),categoria,monto,motivo:inferDetail(spokenText),moneda:currency,cotizacion:1,categoriaDetalle:platform||inferCategory(spokenText,categories),cuentaOrigen:mentionedAccount?.id||defaultAccount?.id||''};
      }
      await onAddTransaction(movement); setText('');
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el movimiento.'); }
    finally { setSaving(false); }
  };
  const startVoice=()=>{if(saving||listening)return;const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!Recognition){setError('El dictado por voz no está disponible en este navegador. Probá con Chrome.');return}const recognition=new Recognition();recognition.lang='es-AR';recognition.interimResults=false;recognition.maxAlternatives=1;recognition.onstart=()=>{setListening(true);setError('')};recognition.onresult=(event:any)=>{const transcript=String(event.results?.[0]?.[0]?.transcript||'').trim();setText(transcript);setListening(false);if(transcript)void analyzeAndSave(transcript);else setError('No pude escuchar el movimiento. Intentá nuevamente.')};recognition.onerror=()=>{setListening(false);setError('No pude usar el micrófono. Revisá el permiso e intentá nuevamente.')};recognition.onend=()=>setListening(false);recognition.start()};
  return <section className="gefi-panel gefi-smart-entry rounded-2xl border border-blue-200 bg-white p-4 shadow-sm dark:border-blue-900/70 dark:bg-slate-900 sm:p-5">
    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-600"/><div><h3 className="text-sm font-bold">Registro inteligente</h3><p className="text-[11px] text-slate-400">Describí el movimiento con tus palabras.</p></div></div>
    <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={text} disabled={saving||listening} onChange={event=>{setText(event.target.value);setError('')}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();void analyzeAndSave()}}} placeholder={listening?(language==='en'?'Listening…':'Escuchando…'):example} className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"/><button type="button" disabled={saving||listening} onClick={()=>void analyzeAndSave()} className="min-h-11 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-60">{saving?'Registrando…':'Interpretar y registrar'}</button><button type="button" disabled={saving} onClick={startVoice} aria-label="Registrar movimiento por voz" className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition-all disabled:opacity-60 ${listening?'animate-pulse bg-rose-600 shadow-lg shadow-rose-500/30':'bg-gradient-to-r from-violet-600 to-blue-600 hover:shadow-lg hover:shadow-blue-500/20'}`}><Mic className="h-4 w-4"/>{listening?'Escuchando…':'Hablar'}</button></div>
    {error&&<p className="mt-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 dark:bg-rose-950/30">{error}</p>}
  </section>;
}
