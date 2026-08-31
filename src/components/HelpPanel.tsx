import { useState } from 'react';
import { ChevronDown, CircleHelp, Mail } from 'lucide-react';

const questions = {
  es: [
    ['¿Cómo se guardan mis cambios?', 'GeFi guarda los cambios en tu dispositivo y los sincroniza automáticamente con tu cuenta cuando hay Internet.'],
    ['¿Puedo usar GeFi sin Internet?', 'Sí. Podés registrar movimientos sin conexión; se enviarán a tu cuenta cuando vuelva Internet.'],
    ['¿Cómo hago un respaldo?', 'Abrí Configuración y usá “Descargar JSON” para guardar una copia de tus datos.'],
    ['¿Cómo cambio el idioma?', 'Tocá el ícono de idioma junto a Configuración y elegí Español o English.'],
  ],
  en: [
    ['How are my changes saved?', 'GeFi saves changes on your device and automatically syncs them with your account when there is an Internet connection.'],
    ['Can I use GeFi without Internet?', 'Yes. You can record transactions offline; they will be sent to your account when Internet returns.'],
    ['How do I create a backup?', 'Open Settings and use “Download JSON” to save a copy of your data.'],
    ['How do I change the language?', 'Tap the language icon next to Settings and choose Spanish or English.'],
  ],
} as const;

export default function HelpPanel({language = 'es'}:{language?:'es'|'en'}) {
  const [open, setOpen] = useState<number | null>(null);
  const english = language === 'en';
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4 text-blue-600"/><div><h3 className="text-sm font-bold">{english?'Quick help':'Ayuda rápida'}</h3><p className="mt-1 text-[11px] text-slate-400">{english?'Answers to the most common questions.':'Respuestas a las dudas más frecuentes.'}</p></div></div><div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{questions[language].map(([question, answer], index) => <div key={question}><button type="button" onClick={() => setOpen(value => value === index ? null : index)} aria-expanded={open === index} className="flex w-full items-center justify-between gap-3 py-3 text-left text-xs font-medium"><span>{question}</span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open === index ? 'rotate-180' : ''}`}/></button>{open === index&&<p className="pb-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{answer}</p>}</div>)}</div><a href="mailto:gefisupport@gmail.com" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400"><Mail className="h-3.5 w-3.5"/>{english?'Contact support':'Contactar soporte'}</a></section>;
}
