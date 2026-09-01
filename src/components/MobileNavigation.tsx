import { useEffect, useState } from 'react';
import { ChartNoAxesCombined, List, Plus, Settings } from 'lucide-react';

type SectionId = 'summary' | 'add-transaction-form-card' | 'movements-history';
type Props = { language?: 'es' | 'en'; settingsOpen: boolean; onOpenSettings: () => void };

export default function MobileNavigation({ language = 'es', settingsOpen, onOpenSettings }: Props) {
  const [active, setActive] = useState<SectionId | 'settings'>('summary');
  const english = language === 'en';
  const items = [
    { id: 'summary' as const, label: english ? 'Summary' : 'Resumen', icon: ChartNoAxesCombined },
    { id: 'add-transaction-form-card' as const, label: english ? 'New' : 'Nuevo', icon: Plus },
    { id: 'movements-history' as const, label: english ? 'History' : 'Historial', icon: List },
  ];

  useEffect(() => {
    const sections = items.map(item => item.id === 'summary' ? document.querySelector<HTMLElement>('.gefi-kpi-grid') : document.getElementById(item.id)).filter((item): item is HTMLElement => Boolean(item));
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible && !settingsOpen) setActive(visible.target.classList.contains('gefi-kpi-grid') ? 'summary' : visible.target.id as SectionId);
    }, { rootMargin: '-20% 0px -62% 0px', threshold: [0, 0.1, 0.35] });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [settingsOpen]);

  useEffect(() => { if (settingsOpen) setActive('settings'); }, [settingsOpen]);

  const goTo = (id: SectionId) => {
    setActive(id);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = id === 'summary' ? document.querySelector<HTMLElement>('.gefi-kpi-grid') : document.getElementById(id);
    target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return <nav className="mobile-menu" aria-label={english ? 'Main navigation' : 'Navegación principal'}>
    {items.map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => goTo(item.id)} className={`mobile-menu-item ${active === item.id ? 'active' : ''}`} aria-current={active === item.id ? 'page' : undefined}><Icon aria-hidden="true"/><span>{item.label}</span></button>; })}
    <button type="button" onClick={() => { setActive('settings'); onOpenSettings(); }} className={`mobile-menu-item ${active === 'settings' ? 'active' : ''}`} aria-current={active === 'settings' ? 'page' : undefined}><Settings aria-hidden="true"/><span>{english ? 'Settings' : 'Configuración'}</span></button>
  </nav>;
}
