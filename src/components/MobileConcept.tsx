import { useState } from 'react';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, CalendarDays,
  ChevronRight, CircleDollarSign, Home, Landmark, LineChart,
  Plus, Search, Settings, ShieldCheck, SlidersHorizontal, Target,
  UserRound, WalletCards, Trash2, Pencil, Check, X,
} from 'lucide-react';
import { Account, Transaction, UserSettings } from '../types';

type Screen = 'home' | 'activity' | 'add' | 'plan' | 'profile';

const money = (value: number, currency: string) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency, maximumFractionDigits: 2,
}).format(value);

type MobileConceptProps = {
  userName: string;
  summary: { patrimonio: number; accounts: number; investment: number; income: number; expense: number };
  transactions: Transaction[];
  accounts: Account[];
  settings: UserSettings;
  onAddTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'uid'>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onEditTransaction: (transaction: Transaction) => Promise<void>;
  onOpenFullApp: () => void;
  onSaveSettings: (settings: UserSettings) => Promise<void>;
  onExport: () => void;
};

function Topbar({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <header className="mc-topbar">
    <div><p>{eyebrow}</p><h1>{title}</h1></div>
    <button aria-label="Notificaciones"><Bell size={19}/><i/></button>
  </header>;
}

function Movements({ transactions, accounts, currency, hidden, limit }: { transactions: Transaction[]; accounts: Account[]; currency: string; hidden: boolean; limit?: number }) {
  const visibleMovements = transactions.slice(0, limit);
  if (!visibleMovements.length) return <div className="mc-empty-state">Todavía no hay movimientos en este mes.</div>;
  return <div className="mc-movement-list">
    {visibleMovements.map(transaction => { const isPositive=['Ingreso','Ef+','Desinversion'].includes(transaction.categoria); const account=accounts.find(item=>item.id===transaction.cuentaOrigen)?.nombre||accounts.find(item=>item.id===transaction.cuentaDestino)?.nombre; const Icon=isPositive?ArrowDownLeft:transaction.categoria==='Inversion'?LineChart:transaction.categoria==='Transferencia'?ArrowRight:WalletCards; return <article key={transaction.id}>
      <span className="mc-movement-icon"><Icon size={18}/></span>
      <div><strong>{transaction.motivo||transaction.categoria}</strong><small>{transaction.categoriaDetalle||transaction.categoria} · {account||transaction.fecha}</small></div>
      <b className={isPositive ? 'positive' : ''}>{hidden?'••••':`${isPositive?'+':'-'}${money(transaction.monto,currency)}`}</b>
    </article>})}
  </div>;
}

function HomeScreen({ navigate, userName, summary, transactions, accounts, settings }: { navigate: (screen: Screen) => void } & MobileConceptProps) {
  const nextPayment=[...(settings.paymentReminders||[])].filter(item=>item.estado==='Pendiente').sort((a,b)=>a.fecha.localeCompare(b.fecha))[0];
  return <main className="mc-screen">
    <Topbar eyebrow="RESUMEN FINANCIERO" title={`Hola, ${userName.split(' ')[0]}`}/>
    <section className="mc-balance">
      <p>Patrimonio total</p><h2>{settings.hideBalances?'••••••':money(summary.patrimonio,settings.monedaBase)}</h2>
      <span>Datos sincronizados</span>
    </section>

    <div className="mc-accounts">
      <article className="primary"><Landmark size={19}/><p>Dinero disponible</p><strong>{settings.hideBalances?'••••':money(summary.accounts,settings.monedaBase)}</strong><small>{accounts.find(account=>account.tipo!=='Efectivo')?.nombre||'Sin cuenta'}</small></article>
      <article><LineChart size={19}/><p>Inversiones</p><strong>{settings.hideBalances?'••••':money(summary.investment,settings.monedaBase)}</strong><small>Saldo acumulado</small></article>
    </div>

    <section className="mc-section">
      <div className="mc-section-title"><h3>Acciones rápidas</h3></div>
      <div className="mc-actions">
        <button onClick={() => navigate('add')}><Plus size={20}/><span>Registrar</span></button>
        <button onClick={() => navigate('add')}><ArrowRight size={20}/><span>Transferir</span></button>
        <button onClick={() => navigate('plan')}><LineChart size={20}/><span>Analizar</span></button>
      </div>
    </section>

    <section className="mc-section">
      <div className="mc-section-title"><h3>Última actividad</h3><button onClick={() => navigate('activity')}>Ver todo</button></div>
      <Movements transactions={transactions} accounts={accounts} currency={settings.monedaBase} hidden={settings.hideBalances} limit={4}/>
    </section>

    {nextPayment&&<button className="mc-reminder" onClick={() => navigate('plan')}><span><CalendarDays size={20}/></span><div><small>PRÓXIMO PAGO</small><strong>{nextPayment.nombre} · {nextPayment.fecha}</strong></div><ChevronRight size={18}/></button>}
    {settings.quickLinks.length>0&&<section className="mc-section"><div className="mc-section-title"><h3>Accesos directos</h3></div><div className="mc-links">{settings.quickLinks.map(link=><a key={link.id} href={link.url} target="_blank" rel="noreferrer"><img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.url)}&sz=64`} alt=""/><span>{link.nombre||new URL(link.url).hostname.replace('www.','')}</span></a>)}</div></section>}
  </main>;
}

function ActivityScreen({ summary, transactions, accounts, settings, onDeleteTransaction, onEditTransaction }: Pick<MobileConceptProps,'summary'|'transactions'|'accounts'|'settings'|'onDeleteTransaction'|'onEditTransaction'>) {
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState<string[]>([]);
  const [editing,setEditing]=useState<Transaction|null>(null);
  const [confirmDelete,setConfirmDelete]=useState(false);
  const filtered=transactions.filter(item=>`${item.motivo} ${item.categoria} ${item.categoriaDetalle}`.toLowerCase().includes(query.toLowerCase()));
  const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  const removeSelected=async()=>{for(const id of selected)await onDeleteTransaction(id);setSelected([]);setConfirmDelete(false)};
  return <main className="mc-screen">
    <Topbar eyebrow="MOVIMIENTOS REALES" title="Actividad"/>
    <label className="mc-search"><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar movimientos"/><SlidersHorizontal size={18}/></label>
    <div className="mc-stats">
      <article><small>Ingresos</small><strong className="positive">{settings.hideBalances?'••••':money(summary.income,settings.monedaBase)}</strong></article>
      <article><small>Gastos</small><strong>{settings.hideBalances?'••••':money(summary.expense,settings.monedaBase)}</strong></article>
    </div>
    <section className="mc-section">
      <div className="mc-section-title"><h3>{selected.length?`${selected.length} seleccionados`:'Todos los movimientos'}</h3><div className="mc-inline-actions"><button onClick={()=>setSelected(selected.length===filtered.length?[]:filtered.map(item=>item.id))}>{selected.length===filtered.length?'Cancelar':'Seleccionar todo'}</button>{selected.length>0&&<button className="danger" onClick={()=>setConfirmDelete(true)}><Trash2 size={15}/></button>}</div></div>
      {filtered.length?<div className="mc-movement-list">{filtered.map(transaction=>{const positive=['Ingreso','Ef+','Desinversion'].includes(transaction.categoria);const checked=selected.includes(transaction.id);return <article key={transaction.id} className={checked?'selected':''}><button className="mc-check" onClick={()=>toggle(transaction.id)} aria-label={`Seleccionar ${transaction.motivo||transaction.categoria}`}>{checked?<Check size={15}/>:null}</button><button className="mc-movement-main" onClick={()=>setEditing(transaction)}><span><strong>{transaction.motivo||transaction.categoria}</strong><small>{transaction.categoriaDetalle||transaction.categoria} · {transaction.fecha}</small></span><b className={positive?'positive':''}>{settings.hideBalances?'••••':`${positive?'+':'-'}${money(transaction.monto,transaction.moneda||settings.monedaBase)}`}</b></button></article>})}</div>:<div className="mc-empty-state">No encontramos movimientos con esa búsqueda.</div>}
    </section>
    {editing&&<div className="mc-sheet-backdrop" onClick={()=>setEditing(null)}><form className="mc-sheet" onClick={event=>event.stopPropagation()} onSubmit={async event=>{event.preventDefault();await onEditTransaction(editing);setEditing(null)}}><div className="mc-sheet-head"><h3>Editar movimiento</h3><button type="button" onClick={()=>setEditing(null)}><X size={19}/></button></div><label>Fecha<input type="date" value={editing.fecha} onChange={event=>setEditing({...editing,fecha:event.target.value})}/></label><label>Importe<input type="number" min="0.01" step="any" value={editing.monto} onChange={event=>setEditing({...editing,monto:Number(event.target.value)})}/></label><label>Detalle<input value={editing.motivo||''} onChange={event=>setEditing({...editing,motivo:event.target.value})}/></label><button className="mc-submit">Guardar cambios</button></form></div>}
    {confirmDelete&&<div className="mc-sheet-backdrop"><div className="mc-confirm"><span><Trash2 size={20}/></span><h3>Eliminar movimientos</h3><p>Los movimientos seleccionados irán a la papelera y podrán recuperarse durante 30 días.</p><button className="mc-submit" onClick={removeSelected}>Eliminar {selected.length}</button><button className="mc-detail" onClick={()=>setConfirmDelete(false)}>Cancelar</button></div></div>}
  </main>;
}

function AddScreen({ accounts, settings, onAddTransaction }: Pick<MobileConceptProps,'accounts'|'settings'|'onAddTransaction'>) {
  const [type, setType] = useState('Gasto');
  const [amount, setAmount] = useState('0');
  const [accountId,setAccountId]=useState(accounts[0]?.id||'');
  const [destinationId,setDestinationId]=useState(accounts[1]?.id||'');
  const [detail,setDetail]=useState('');
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [category,setCategory]=useState(settings.categorias[0]||'General');
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [saved,setSaved]=useState(false);
  const addDigit = (digit: string) => setAmount(current => digit===','?(current.includes(',')?current:`${current},`):(current === '0' ? digit : `${current}${digit}`));
  const save=async()=>{const monto=Number(amount.replace(',','.'));if(!Number.isFinite(monto)||monto<=0){setError('Ingresá un importe mayor a cero.');return}if(type==='Transferencia'&&(!accountId||!destinationId||accountId===destinationId)){setError('Elegí cuentas distintas para transferir.');return}setSaving(true);setError('');try{await onAddTransaction({fecha:date,categoria:type==='Inversión'?'Inversion':type as Transaction['categoria'],monto,moneda:settings.monedaBase,cotizacion:1,motivo:detail.trim()||(type==='Transferencia'?'Transferencia interna':''),categoriaDetalle:type==='Transferencia'?'Transferencia interna':type==='Inversión'?'Inversión':category,cuentaOrigen:accountId,...(type==='Transferencia'?{cuentaDestino:destinationId}:{})});setAmount('0');setDetail('');setSaved(true);window.setTimeout(()=>setSaved(false),2500)}catch(reason){setError(reason instanceof Error?reason.message:'No se pudo guardar el movimiento.')}finally{setSaving(false)}};
  return <main className="mc-screen mc-add-screen">
    <Topbar eyebrow="NUEVO MOVIMIENTO" title="Registrar"/>
    <div className="mc-segmented">{['Gasto', 'Ingreso', 'Inversión', 'Transferencia'].map(item => <button key={item} onClick={() => setType(item)} className={type === item ? 'active' : ''}>{item}</button>)}</div>
    <section className="mc-amount"><small>IMPORTE</small><div><span>{settings.monedaBase}</span><strong>{amount}</strong></div><p>Se sincronizará con tu cuenta</p></section>
    <div className="mc-fields"><label><small>{type==='Transferencia'?'SALE DE':'CUENTA'}</small><select value={accountId} onChange={event=>setAccountId(event.target.value)}><option value="">Sin cuenta</option>{accounts.map(account=><option key={account.id} value={account.id}>{account.nombre}</option>)}</select></label>{type==='Transferencia'?<label><small>ENTRA A</small><select value={destinationId} onChange={event=>setDestinationId(event.target.value)}><option value="">Elegir</option>{accounts.filter(account=>account.id!==accountId).map(account=><option key={account.id} value={account.id}>{account.nombre}</option>)}</select></label>:<label><small>CATEGORÍA</small><select value={category} onChange={event=>setCategory(event.target.value)}>{settings.categorias.map(item=><option key={item}>{item}</option>)}</select></label>}</div>
    <label className="mc-date-field"><small>FECHA</small><input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label>
    <div className="mc-keypad">
      {['1','2','3','4','5','6','7','8','9',',','0','⌫'].map(key => <button key={key} onClick={() => key === '⌫' ? setAmount(value => value.length > 1 ? value.slice(0,-1) : '0') : addDigit(key)}>{key}</button>)}
    </div>
    <input className="mc-detail" value={detail} onChange={event=>setDetail(event.target.value)} placeholder="Detalle opcional" maxLength={100}/>
    {error&&<p className="mc-form-error">{error}</p>}{saved&&<p className="mc-form-success"><Check size={15}/> Movimiento registrado</p>}<button className="mc-submit" disabled={saving} onClick={save}>{saving?'Guardando…':`Registrar ${type.toLowerCase()}`}</button>
  </main>;
}

function PlanScreen({ settings, summary, onOpenFullApp }: Pick<MobileConceptProps,'settings'|'summary'|'onOpenFullApp'>) {
  const budget=Object.values(settings.budgets||{}).reduce((sum,value)=>sum+value,0);
  const progress=budget?Math.min(100,(summary.expense/budget)*100):0;
  return <main className="mc-screen">
    <Topbar eyebrow="TU MES" title="Planificación"/>
    <section className="mc-budget">
      <small>PRESUPUESTO</small><h2>{budget ? money(summary.expense,settings.monedaBase) : 'Sin presupuesto'} <span>{budget?`de ${money(budget,settings.monedaBase)}`:'del mes actual'}</span></h2>
      <div><i style={{width:`${progress}%`}}/></div><p><span>{budget?`${progress.toFixed(0)}% utilizado`:'Configurá un límite mensual'}</span><b>{budget?`${money(Math.max(0,budget-summary.expense),settings.monedaBase)} disponible`:''}</b></p>
    </section>
    <section className="mc-section">
      <div className="mc-section-title"><h3>Objetivos</h3><button>Editar</button></div>
      {(settings.savingsGoals||[]).length?(settings.savingsGoals||[]).map(goal=><article key={goal.id} className="mc-goal"><span><Target size={20}/></span><div><strong>{goal.nombre}</strong><small>{money(goal.objetivo,settings.monedaBase)} objetivo</small></div></article>):<p className="mc-empty-state">No hay objetivos configurados.</p>}
    </section>
    <section className="mc-section">
      <div className="mc-section-title"><h3>Próximos pagos</h3><button>Calendario</button></div>
      {(settings.paymentReminders||[]).length?(settings.paymentReminders||[]).slice(0,3).map(item=><div key={item.id} className="mc-due"><time><b>{item.fecha.slice(-2)}</b><small>{item.fecha.slice(5,7)}</small></time><div><strong>{item.nombre}</strong><small>{item.estado}</small></div><b>{item.monto?money(item.monto,item.moneda):''}</b></div>):<p className="mc-empty-state">No hay pagos próximos.</p>}
      <button className="mc-detail" onClick={onOpenFullApp}>Gestionar presupuestos, metas y pagos</button>
    </section>
  </main>;
}

function ProfileScreen({ userName, settings, accounts, onSaveSettings, onExport, onOpenFullApp }:Pick<MobileConceptProps,'userName'|'settings'|'accounts'|'onSaveSettings'|'onExport'|'onOpenFullApp'>) {
  const [section,setSection]=useState<string|null>(null);
  const rows = [
    [UserRound, 'Perfil y seguridad', 'Datos personales y acceso'],
    [WalletCards, 'Cuentas y efectivo', 'Organizá dónde está tu dinero'],
    [SlidersHorizontal, 'Preferencias', 'Moneda, idioma y categorías'],
    [ShieldCheck, 'Datos y respaldo', 'Exportación y privacidad'],
    [Settings, 'Apariencia', 'Tema y accesibilidad'],
  ] as const;
  if(section)return <main className="mc-screen"><Topbar eyebrow="CONFIGURACIÓN" title={section}/><button className="mc-detail" onClick={()=>setSection(null)}>← Volver a Perfil</button><section className="mc-settings-list">{section==='Cuentas y efectivo'?accounts.map(account=><div key={account.id} className="mc-setting-read"><strong>{account.nombre}</strong><small>{account.tipo} · {account.moneda}</small></div>):section==='Preferencias'?<div className="mc-setting-read"><label>Moneda<select value={settings.monedaBase} onChange={event=>void onSaveSettings({...settings,monedaBase:event.target.value,monedas:[event.target.value,...settings.monedas.filter(item=>item!==event.target.value)]})}>{settings.monedas.map(item=><option key={item}>{item}</option>)}</select></label><label>Idioma<select value={settings.language||'es'} onChange={event=>void onSaveSettings({...settings,language:event.target.value as 'es'|'en'})}><option value="es">Español</option><option value="en">English</option></select></label></div>:section==='Apariencia'?<div className="mc-setting-read"><button className="mc-submit" onClick={()=>void onSaveSettings({...settings,darkMode:!settings.darkMode})}>{settings.darkMode?'Usar modo claro':'Usar modo oscuro'}</button><button className="mc-detail" onClick={()=>void onSaveSettings({...settings,hideBalances:!settings.hideBalances})}>{settings.hideBalances?'Mostrar montos':'Ocultar montos'}</button></div>:section==='Datos y respaldo'?<div className="mc-setting-read"><button className="mc-submit" onClick={onExport}>Descargar JSON</button><small>El respaldo contiene tus datos sincronizados actuales.</small></div>:<div className="mc-setting-read"><strong>{section}</strong><small>Tu sesión y datos permanecen protegidos por Firebase.</small></div>}</section></main>;
  return <main className="mc-screen">
    <Topbar eyebrow="TU ESPACIO" title="Perfil"/>
    <section className="mc-profile-card"><div>{userName.trim().charAt(0).toUpperCase()}</div><span><strong>{userName}</strong><small>Cuenta de GEFI</small></span><ChevronRight size={18}/></section>
    <section className="mc-settings-list">{rows.map(([Icon,title,subtitle]) => <button key={title} onClick={()=>setSection(title)}><span><Icon size={19}/></span><div><strong>{title}</strong><small>{subtitle}</small></div><ChevronRight size={18}/></button>)}</section>
    <button className="mc-full-settings" onClick={onOpenFullApp}>Abrir todas las opciones avanzadas</button>
  </main>;
}

export default function MobileConcept(props: MobileConceptProps) {
  const [screen, setScreen] = useState<Screen>('home');
  const navigate = (next: Screen) => { setScreen(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const tabs = [
    ['home', Home, 'Inicio'], ['activity', CircleDollarSign, 'Actividad'],
    ['add', Plus, 'Agregar'], ['plan', CalendarDays, 'Plan'], ['profile', UserRound, 'Perfil'],
  ] as const;
  return <div className="mobile-concept">
    {screen === 'home' && <HomeScreen navigate={navigate} {...props}/>}
    {screen === 'activity' && <ActivityScreen {...props}/>}
    {screen === 'add' && <AddScreen {...props}/>}
    {screen === 'plan' && <PlanScreen {...props}/>}
    {screen === 'profile' && <ProfileScreen {...props}/>}
    <nav className="mc-nav" aria-label="Navegación principal">{tabs.map(([id, Icon, label]) => <button key={id} onClick={() => navigate(id)} className={`${screen === id ? 'active' : ''} ${id === 'add' ? 'add' : ''}`}><Icon size={20}/><span>{label}</span></button>)}</nav>
  </div>;
}
