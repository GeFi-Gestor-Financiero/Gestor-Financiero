import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, CalendarDays,
  ChevronRight, CircleDollarSign, Home, Landmark, LineChart,
  Plus, Search, ShieldCheck, SlidersHorizontal, Target,
  UserRound, WalletCards, Trash2, Check, X, Eye, EyeOff, Moon, Sun,
  LogOut, Download, Globe2, CircleHelp, Mail, Sparkles, KeyRound, FileText, Pencil,
} from 'lucide-react';
import { Account, Transaction, UserSettings } from '../types';
import SmartTransactionInput from './SmartTransactionInput';

type Screen = 'home' | 'activity' | 'add' | 'transfer' | 'plan' | 'profile';

const money = (value: number, currency: string) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency, maximumFractionDigits: 2,
}).format(value);

type MobileConceptProps = {
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  summary: { patrimonio: number; accounts: number; cash: number; investment: number; income: number; expense: number };
  transactions: Transaction[];
  historyTransactions: Transaction[];
  accounts: Account[];
  settings: UserSettings;
  onAddTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'uid'>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onEditTransaction: (transaction: Transaction) => Promise<void>;
  onAddAccount: (data: { nombre: string; tipo: Account['tipo']; saldoInicial: number }) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onSaveSettings: (settings: UserSettings) => Promise<void>;
  onExport: () => void;
  onResetPassword: () => Promise<void>;
  onResetData: () => Promise<void>;
  onDeleteUserAccount: () => Promise<void>;
  onLogout: () => void;
};

function Topbar({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <header className="mc-topbar">
    <div><p>{eyebrow}</p><h1>{title}</h1></div>
    <button aria-label="Notificaciones"><Bell size={19}/><i/></button>
  </header>;
}

function Movements({ transactions, accounts, currency, hidden, limit, onHold }: { transactions: Transaction[]; accounts: Account[]; currency: string; hidden: boolean; limit?: number; onHold?: (transaction:Transaction)=>void }) {
  const holdTimer=useRef<number|undefined>(undefined);
  const visibleMovements = transactions.slice(0, limit);
  if (!visibleMovements.length) return <div className="mc-empty-state">Todavía no hay movimientos en este mes.</div>;
  return <div className="mc-movement-list">
    {visibleMovements.map(transaction => { const isPositive=['Ingreso','Ef+','Desinversion'].includes(transaction.categoria); const account=accounts.find(item=>item.id===transaction.cuentaOrigen)?.nombre||accounts.find(item=>item.id===transaction.cuentaDestino)?.nombre; const Icon=isPositive?ArrowDownLeft:transaction.categoria==='Inversion'?LineChart:transaction.categoria==='Transferencia'?ArrowRight:WalletCards; return <article key={transaction.id} className={onHold?'holdable':''} onPointerDown={()=>{if(onHold)holdTimer.current=window.setTimeout(()=>onHold(transaction),520)}} onPointerUp={()=>window.clearTimeout(holdTimer.current)} onPointerCancel={()=>window.clearTimeout(holdTimer.current)} onPointerLeave={()=>window.clearTimeout(holdTimer.current)}>
      <span className="mc-movement-icon"><Icon size={18}/></span>
      <div><strong>{transaction.motivo||transaction.categoria}</strong><small>{transaction.categoriaDetalle||transaction.categoria} · {account||transaction.fecha}</small></div>
      <b className={isPositive ? 'positive' : ''}>{hidden?'••••':`${isPositive?'+':'-'}${money(transaction.monto,currency)}`}</b>
    </article>})}
  </div>;
}

function HomeScreen({ navigate, userName, summary, transactions, accounts, settings, onSaveSettings, onAddTransaction, onDeleteTransaction, onEditTransaction }: { navigate: (screen: Screen) => void } & MobileConceptProps) {
  const nextPayment=[...(settings.paymentReminders||[])].filter(item=>item.estado==='Pendiente').sort((a,b)=>a.fecha.localeCompare(b.fecha))[0];
  const hour=new Date().getHours();
  const greeting=hour>=5&&hour<12?'Buenos días':hour>=12&&hour<20?'Buenas tardes':'Buenas noches';
  const [smartOpen,setSmartOpen]=useState(false);
  const [actionTransaction,setActionTransaction]=useState<Transaction|null>(null);
  const [editing,setEditing]=useState<Transaction|null>(null);
  return <main className="mc-screen">
    <Topbar eyebrow="RESUMEN FINANCIERO" title={`${greeting}, ${userName.split(' ')[0]}`}/>
    <section className="mc-balance">
      <div className="mc-balance-label"><p>Patrimonio total</p><button type="button" onClick={()=>void onSaveSettings({...settings,hideBalances:!settings.hideBalances})} aria-label={settings.hideBalances?'Mostrar importes':'Ocultar importes'}>{settings.hideBalances?<Eye size={19}/>:<EyeOff size={19}/>}</button></div><h2>{settings.hideBalances?'••••••':money(summary.patrimonio,settings.monedaBase)}</h2>
      <span>Datos sincronizados</span>
    </section>

    <div className="mc-overview-grid">
      <article className="primary"><Landmark size={18}/><p>Disponible en cuenta</p><strong>{settings.hideBalances?'••••':money(summary.accounts,settings.monedaBase)}</strong></article>
      <article><WalletCards size={18}/><p>Disponible en efectivo</p><strong>{settings.hideBalances?'••••':money(summary.cash,settings.monedaBase)}</strong></article>
      <article><ArrowUpRight size={18}/><p>Gasto total</p><strong className="expense">{settings.hideBalances?'••••':money(summary.expense,settings.monedaBase)}</strong></article>
      <article><LineChart size={18}/><p>Inversiones</p><strong>{settings.hideBalances?'••••':money(summary.investment,settings.monedaBase)}</strong></article>
    </div>

    <section className="mc-section">
      <div className="mc-section-title"><h3>Acciones rápidas</h3></div>
      <div className="mc-actions">
        <button onClick={() => navigate('add')}><Plus size={20}/><span>Registrar</span></button>
        <button onClick={() => setSmartOpen(true)}><Sparkles size={20}/><span>Registro inteligente</span></button>
        <button onClick={() => navigate('transfer')}><ArrowRight size={20}/><span>Transferir</span></button>
      </div>
    </section>

    <section className="mc-section">
      <div className="mc-section-title"><h3>Última actividad</h3><button onClick={() => navigate('activity')}>Ver todo</button></div>
      <Movements transactions={transactions} accounts={accounts} currency={settings.monedaBase} hidden={settings.hideBalances} limit={4} onHold={setActionTransaction}/>
      {transactions.length>0&&<small className="mc-hold-hint">Mantené presionado un movimiento para editarlo o eliminarlo.</small>}
    </section>

    {nextPayment&&<button className="mc-reminder" onClick={() => navigate('plan')}><span><CalendarDays size={20}/></span><div><small>PRÓXIMO PAGO</small><strong>{nextPayment.nombre} · {nextPayment.fecha}</strong></div><ChevronRight size={18}/></button>}
    {settings.quickLinks.length>0&&<section className="mc-section"><div className="mc-section-title"><h3>Accesos directos</h3></div><div className="mc-links">{settings.quickLinks.map(link=><a key={link.id} href={link.url} target="_blank" rel="noreferrer"><img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.url)}&sz=64`} alt=""/><span>{link.nombre||new URL(link.url).hostname.replace('www.','')}</span></a>)}</div></section>}
    {smartOpen&&<div className="mc-sheet-backdrop" onClick={()=>setSmartOpen(false)}><div className="mc-smart-sheet" onClick={event=>event.stopPropagation()}><div className="mc-sheet-head"><div><small>REGISTRO INTELIGENTE</small><h3>Contame qué pasó</h3></div><button onClick={()=>setSmartOpen(false)} aria-label="Cerrar"><X size={19}/></button></div><SmartTransactionInput accounts={accounts} categories={settings.categorias} investmentPlatforms={settings.investmentPlatforms||[]} currency={settings.monedaBase} language={settings.language||'es'} onAddTransaction={async data=>{await onAddTransaction(data);setSmartOpen(false)}}/></div></div>}
    {actionTransaction&&<div className="mc-sheet-backdrop" onClick={()=>setActionTransaction(null)}><div className="mc-action-sheet" onClick={event=>event.stopPropagation()}><div><strong>{actionTransaction.motivo||actionTransaction.categoria}</strong><small>{money(actionTransaction.monto,actionTransaction.moneda||settings.monedaBase)}</small></div><button onClick={()=>{setEditing(actionTransaction);setActionTransaction(null)}}><Pencil size={18}/>Editar movimiento</button><button className="danger" onClick={async()=>{await onDeleteTransaction(actionTransaction.id);setActionTransaction(null)}}><Trash2 size={18}/>Eliminar movimiento</button><button onClick={()=>setActionTransaction(null)}>Cancelar</button></div></div>}
    {editing&&<div className="mc-sheet-backdrop" onClick={()=>setEditing(null)}><form className="mc-sheet" onClick={event=>event.stopPropagation()} onSubmit={async event=>{event.preventDefault();await onEditTransaction(editing);setEditing(null)}}><div className="mc-sheet-head"><h3>Editar movimiento</h3><button type="button" onClick={()=>setEditing(null)}><X size={19}/></button></div><label>Fecha<input type="date" value={editing.fecha} onChange={event=>setEditing({...editing,fecha:event.target.value})}/></label><label>Importe<input type="number" min="0.01" step="any" value={editing.monto} onChange={event=>setEditing({...editing,monto:Number(event.target.value)})}/></label><label>Detalle<input value={editing.motivo||''} onChange={event=>setEditing({...editing,motivo:event.target.value})}/></label><button className="mc-submit">Guardar cambios</button></form></div>}
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

function AddScreen({ accounts, settings, onAddTransaction, initialType='Gasto' }: Pick<MobileConceptProps,'accounts'|'settings'|'onAddTransaction'> & {initialType?:string}) {
  const [type, setType] = useState(initialType);
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
  const formattedAmount=(()=>{const [integer,decimal]=amount.split(',');const grouped=(integer||'0').replace(/\B(?=(\d{3})+(?!\d))/g,'.');return decimal===undefined?grouped:`${grouped},${decimal}`})();
  const save=async()=>{const monto=Number(amount.replace(',','.'));if(!Number.isFinite(monto)||monto<=0){setError('Ingresá un importe mayor a cero.');return}if(type==='Transferencia'&&(!accountId||!destinationId||accountId===destinationId)){setError('Elegí cuentas distintas para transferir.');return}setSaving(true);setError('');try{await onAddTransaction({fecha:date,categoria:type==='Inversión'?'Inversion':type as Transaction['categoria'],monto,moneda:settings.monedaBase,cotizacion:1,motivo:detail.trim()||(type==='Transferencia'?'Transferencia interna':''),categoriaDetalle:type==='Transferencia'?'Transferencia interna':type==='Inversión'?'Inversión':category,cuentaOrigen:accountId,...(type==='Transferencia'?{cuentaDestino:destinationId}:{})});setAmount('0');setDetail('');setSaved(true);window.setTimeout(()=>setSaved(false),2500)}catch(reason){setError(reason instanceof Error?reason.message:'No se pudo guardar el movimiento.')}finally{setSaving(false)}};
  return <main className="mc-screen mc-add-screen">
    <Topbar eyebrow="NUEVO MOVIMIENTO" title="Registrar"/>
    <div className="mc-segmented">{['Gasto', 'Ingreso', 'Inversión', 'Transferencia'].map(item => <button key={item} onClick={() => setType(item)} className={type === item ? 'active' : ''}>{item}</button>)}</div>
    <section className="mc-amount"><small>IMPORTE</small><div><span>{settings.monedaBase}</span><strong>{formattedAmount}</strong></div><p>Se sincronizará con tu cuenta</p></section>
    <div className="mc-fields"><label><small>{type==='Transferencia'?'SALE DE':'CUENTA'}</small><select value={accountId} onChange={event=>setAccountId(event.target.value)}><option value="">Sin cuenta</option>{accounts.map(account=><option key={account.id} value={account.id}>{account.nombre}</option>)}</select></label>{type==='Transferencia'?<label><small>ENTRA A</small><select value={destinationId} onChange={event=>setDestinationId(event.target.value)}><option value="">Elegir</option>{accounts.filter(account=>account.id!==accountId).map(account=><option key={account.id} value={account.id}>{account.nombre}</option>)}</select></label>:<label><small>CATEGORÍA</small><select value={category} onChange={event=>setCategory(event.target.value)}>{settings.categorias.map(item=><option key={item}>{item}</option>)}</select></label>}</div>
    <label className="mc-date-field"><small>FECHA</small><input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label>
    <div className="mc-keypad">
      {['1','2','3','4','5','6','7','8','9',',','0','⌫'].map(key => <button key={key} onClick={() => key === '⌫' ? setAmount(value => value.length > 1 ? value.slice(0,-1) : '0') : addDigit(key)}>{key}</button>)}
    </div>
    <input className="mc-detail" value={detail} onChange={event=>setDetail(event.target.value)} placeholder="Detalle opcional" maxLength={100}/>
    {error&&<p className="mc-form-error">{error}</p>}{saved&&<p className="mc-form-success"><Check size={15}/> Movimiento registrado</p>}<button className="mc-submit" disabled={saving} onClick={save}>{saving?'Guardando…':`Registrar ${type.toLowerCase()}`}</button>
  </main>;
}

function PlanScreen({ settings, summary, transactions, historyTransactions, onSaveSettings }: Pick<MobileConceptProps,'settings'|'summary'|'transactions'|'historyTransactions'|'onSaveSettings'>) {
  const budget=Object.values(settings.budgets||{}).reduce((sum,value)=>sum+value,0);
  const progress=budget?Math.min(100,(summary.expense/budget)*100):0;
  const [openForm,setOpenForm]=useState<'plan'|'goal'|'budget'|null>(null);
  const [name,setName]=useState('');
  const [amount,setAmount]=useState('');
  const [date,setDate]=useState('');
  const [category,setCategory]=useState(settings.categorias[0]||'General');
  const [error,setError]=useState('');
  const plans=settings.financialPlans||[];
  const goals=settings.savingsGoals||[];
  const saved=historyTransactions.filter(item=>item.categoria==='Ahorro').reduce((sum,item)=>sum+item.monto*Number(item.cotizacion||1),0);
  const monthKey=(value:Date)=>`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}`;
  const now=new Date();
  const months=Array.from({length:6},(_,index)=>{const value=new Date(now.getFullYear(),now.getMonth()-5+index,1);return {key:monthKey(value),label:new Intl.DateTimeFormat(settings.language==='en'?'en-US':'es-AR',{month:'short'}).format(value).replace('.','')}});
  const deltas=new Map(months.map(item=>[item.key,0]));
  historyTransactions.forEach(item=>{const key=item.fecha.slice(0,7);if(!deltas.has(key))return;const value=item.monto*Number(item.cotizacion||1);const positive=item.categoria==='Ingreso'||item.categoria==='Ef+';const negative=item.categoria==='Gasto'||item.categoria==='Gasto efectivo'||item.categoria==='Ef-';if(positive)deltas.set(key,(deltas.get(key)||0)+value);if(negative)deltas.set(key,(deltas.get(key)||0)-value)});
  const totalDelta=[...deltas.values()].reduce((sum,value)=>sum+value,0);
  let running=summary.patrimonio-totalDelta;
  const trend=months.map(item=>{running+=deltas.get(item.key)||0;return {...item,value:running}});
  const values=trend.map(item=>item.value),min=Math.min(...values),max=Math.max(...values),span=Math.max(1,max-min);
  const points=trend.map((item,index)=>`${12+index*(276/(trend.length-1))},${102-((item.value-min)/span)*74}`).join(' ');
  const resetForm=()=>{setOpenForm(null);setName('');setAmount('');setDate('');setError('')};
  const validAmount=()=>{const value=Number(amount.replace(',','.'));if(!Number.isFinite(value)||value<=0){setError('Ingresá un importe mayor a cero.');return null}return value};
  const savePlan=async()=>{const value=validAmount();if(!name.trim()||value===null||!date){setError('Completá el nombre, el importe y la fecha.');return}await onSaveSettings({...settings,financialPlans:[...plans,{id:crypto.randomUUID(),nombre:name.trim(),objetivo:value,fechaObjetivo:date}]});resetForm()};
  const saveGoal=async()=>{const value=validAmount();if(!name.trim()||value===null){setError('Completá el nombre y el importe objetivo.');return}await onSaveSettings({...settings,savingsGoals:[...goals,{id:crypto.randomUUID(),nombre:name.trim(),objetivo:value}]});resetForm()};
  const saveBudget=async()=>{const value=validAmount();if(value===null)return;await onSaveSettings({...settings,budgets:{...(settings.budgets||{}),[category]:value}});resetForm()};
  return <main className="mc-screen">
    <Topbar eyebrow="TU MES" title="Planificación"/>
    <section className="mc-plan-actions" aria-label="Crear planificación">
      <button onClick={()=>{setOpenForm('plan');setError('')}}><Plus size={18}/><span><strong>Nuevo plan</strong><small>Meta con fecha</small></span></button>
      <button onClick={()=>{setOpenForm('goal');setError('')}}><Target size={18}/><span><strong>Objetivo</strong><small>Ahorro deseado</small></span></button>
      <button onClick={()=>{setOpenForm('budget');setError('')}}><CircleDollarSign size={18}/><span><strong>Presupuesto</strong><small>Límite por categoría</small></span></button>
    </section>
    <section className="mc-money-trend">
      <div className="mc-section-title"><div><small>ÚLTIMOS 6 MESES</small><h3>Evolución de tu dinero</h3></div><LineChart size={19}/></div>
      <strong>{settings.hideBalances?'••••':money(trend.at(-1)?.value||0,settings.monedaBase)}</strong>
      <svg viewBox="0 0 300 120" role="img" aria-label="Gráfico de evolución del patrimonio durante los últimos seis meses"><defs><linearGradient id="mcTrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".28"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><polygon points={`12,110 ${points} 288,110`} fill="url(#mcTrendFill)"/><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{trend.map((item,index)=><circle key={item.key} cx={12+index*(276/(trend.length-1))} cy={102-((item.value-min)/span)*74} r="3.5" fill="currentColor"/>)}</svg>
      <div className="mc-trend-labels">{trend.map(item=><span key={item.key}>{item.label}</span>)}</div>
      <p>Patrimonio estimado a partir de tus ingresos y gastos registrados.</p>
    </section>
    <section className="mc-budget">
      <small>PRESUPUESTO DEL MES</small><h2>{budget ? money(summary.expense,settings.monedaBase) : 'Sin presupuesto'} <span>{budget?`de ${money(budget,settings.monedaBase)}`:'del mes actual'}</span></h2>
      <div><i style={{width:`${progress}%`}}/></div><p><span>{budget?`${progress.toFixed(0)}% utilizado`:'Configurá un límite mensual'}</span><b>{budget?`${money(Math.max(0,budget-summary.expense),settings.monedaBase)} disponible`:''}</b></p>
    </section>
    <section className="mc-section">
      <div className="mc-section-title"><h3>Planes activos</h3><button onClick={()=>setOpenForm('plan')}>Agregar</button></div>
      {plans.length?plans.map(plan=><article key={plan.id} className="mc-plan-row"><span><CalendarDays size={18}/></span><div><strong>{plan.nombre}</strong><small>{money(plan.objetivo,settings.monedaBase)} para {new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${plan.fechaObjetivo}T12:00:00`))}</small></div><button aria-label={`Eliminar plan ${plan.nombre}`} onClick={()=>void onSaveSettings({...settings,financialPlans:plans.filter(item=>item.id!==plan.id)})}><Trash2 size={16}/></button></article>):<p className="mc-empty-state">Todavía no creaste ningún plan financiero.</p>}
    </section>
    <section className="mc-section">
      <div className="mc-section-title"><h3>Objetivos de ahorro</h3><button onClick={()=>setOpenForm('goal')}>Agregar</button></div>
      {goals.length?goals.map(goal=>{const goalProgress=Math.min(100,saved/goal.objetivo*100);return <article key={goal.id} className="mc-goal"><span><Target size={20}/></span><div><strong>{goal.nombre}</strong><small>{settings.hideBalances?'••••':`${money(saved,settings.monedaBase)} de ${money(goal.objetivo,settings.monedaBase)}`}</small><i><em style={{width:`${goalProgress}%`}}/></i></div><b>{goalProgress.toFixed(0)}%</b><button aria-label={`Eliminar objetivo ${goal.nombre}`} onClick={()=>void onSaveSettings({...settings,savingsGoals:goals.filter(item=>item.id!==goal.id)})}><Trash2 size={15}/></button></article>}):<p className="mc-empty-state">No hay objetivos configurados.</p>}
    </section>
    <section className="mc-section"><div className="mc-section-title"><h3>Presupuestos por categoría</h3><button onClick={()=>setOpenForm('budget')}>Configurar</button></div><div className="mc-budget-list">{Object.entries(settings.budgets||{}).filter(([,value])=>value>0).map(([item,value])=>{const spent=transactions.filter(transaction=>(transaction.categoriaDetalle||'General')===item&&(transaction.categoria==='Gasto'||transaction.categoria==='Gasto efectivo'||transaction.categoria==='Ef-')).reduce((sum,transaction)=>sum+transaction.monto*Number(transaction.cotizacion||1),0);const percent=Math.min(100,spent/value*100);return <article key={item}><div><strong>{item}</strong><span>{settings.hideBalances?'••••':`${money(spent,settings.monedaBase)} / ${money(value,settings.monedaBase)}`}</span></div><i><em className={percent>=100?'danger':''} style={{width:`${percent}%`}}/></i><button aria-label={`Eliminar presupuesto ${item}`} onClick={()=>{const next={...(settings.budgets||{})};delete next[item];void onSaveSettings({...settings,budgets:next})}}><Trash2 size={15}/></button></article>})}{budget===0&&<p className="mc-empty-state">Definí un límite para comenzar a controlar tus gastos.</p>}</div></section>
    <section className="mc-section">
      <div className="mc-section-title"><h3>Próximos pagos</h3></div>
      {(settings.paymentReminders||[]).length?(settings.paymentReminders||[]).slice(0,3).map(item=><div key={item.id} className="mc-due"><time><b>{item.fecha.slice(-2)}</b><small>{item.fecha.slice(5,7)}</small></time><div><strong>{item.nombre}</strong><small>{item.estado}</small></div><b>{item.monto?money(item.monto,item.moneda):''}</b></div>):<p className="mc-empty-state">No hay pagos próximos.</p>}
    </section>
    {openForm&&<div className="mc-sheet-backdrop" onClick={resetForm}><form className="mc-sheet mc-plan-sheet" onClick={event=>event.stopPropagation()} onSubmit={event=>{event.preventDefault();void(openForm==='plan'?savePlan():openForm==='goal'?saveGoal():saveBudget())}}><div className="mc-sheet-head"><div><small>PLANIFICACIÓN</small><h3>{openForm==='plan'?'Crear plan':openForm==='goal'?'Nuevo objetivo':'Definir presupuesto'}</h3></div><button type="button" onClick={resetForm} aria-label="Cerrar"><X size={19}/></button></div>{openForm!=='budget'&&<label>Nombre<input autoFocus value={name} onChange={event=>setName(event.target.value)} placeholder={openForm==='plan'?'Ej: Viaje':'Ej: Fondo de emergencia'} maxLength={60}/></label>}{openForm==='budget'&&<label>Categoría<select value={category} onChange={event=>setCategory(event.target.value)}>{settings.categorias.map(item=><option key={item}>{item}</option>)}</select></label>}<label>Importe objetivo<input type="number" min="0.01" step="any" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="0"/></label>{openForm==='plan'&&<label>Fecha objetivo<input type="date" min={new Date().toISOString().slice(0,10)} value={date} onChange={event=>setDate(event.target.value)}/></label>}{error&&<p className="mc-form-error">{error}</p>}<button className="mc-submit">Guardar</button></form></div>}
  </main>;
}

function ProfileScreen({ userName, userEmail, userPhotoURL, settings, accounts, onSaveSettings, onExport, onLogout, onAddAccount, onDeleteAccount, onResetPassword, onResetData, onDeleteUserAccount }:Pick<MobileConceptProps,'userName'|'userEmail'|'userPhotoURL'|'settings'|'accounts'|'onSaveSettings'|'onExport'|'onLogout'|'onAddAccount'|'onDeleteAccount'|'onResetPassword'|'onResetData'|'onDeleteUserAccount'>) {
  const [panel,setPanel]=useState<'account'|'accounts'|'help'|'policies'|null>(null);
  const [showAccountForm,setShowAccountForm]=useState(false);
  const [accountDraft,setAccountDraft]=useState<{nombre:string;tipo:Account['tipo'];saldoInicial:string}>({nombre:'',tipo:'Banco',saldoInicial:'0'});
  const [deleteTarget,setDeleteTarget]=useState<Account|null>(null);
  const [newCategory,setNewCategory]=useState('');
  const [newPlatform,setNewPlatform]=useState('');
  const [riskAction,setRiskAction]=useState<'reset'|'delete'|null>(null);
  const [status,setStatus]=useState('');
  const addCategory=()=>{const value=newCategory.trim();if(!value||settings.categorias.some(item=>item.toLowerCase()===value.toLowerCase()))return;void onSaveSettings({...settings,categorias:[...settings.categorias,value]});setNewCategory('')};
  const addPlatform=()=>{const value=newPlatform.trim();const current=settings.investmentPlatforms||[];if(!value||current.some(item=>item.toLowerCase()===value.toLowerCase()))return;void onSaveSettings({...settings,investmentPlatforms:[...current,value]});setNewPlatform('')};

  if(panel==='accounts')return <main className="mc-screen mc-subpage">
    <header className="mc-subpage-head"><button onClick={()=>setPanel(null)} aria-label="Volver"><ArrowLeft size={20}/></button><div><p>CONFIGURACIÓN</p><h1>Cuentas y organización</h1></div></header>
    <section className="mc-section"><div className="mc-section-title"><h3>Tus cuentas</h3><button onClick={()=>setShowAccountForm(value=>!value)}>{showAccountForm?'Cancelar':'Agregar'}</button></div>
      {showAccountForm&&<form className="mc-inline-form" onSubmit={async event=>{event.preventDefault();if(!accountDraft.nombre.trim())return;await onAddAccount({nombre:accountDraft.nombre.trim(),tipo:accountDraft.tipo,saldoInicial:Number(accountDraft.saldoInicial.replace(',','.'))||0});setAccountDraft({nombre:'',tipo:'Banco',saldoInicial:'0'});setShowAccountForm(false)}}><label>Nombre<input value={accountDraft.nombre} onChange={event=>setAccountDraft({...accountDraft,nombre:event.target.value})} placeholder="Ej. Cuenta principal" required/></label><div><label>Tipo<select value={accountDraft.tipo} onChange={event=>setAccountDraft({...accountDraft,tipo:event.target.value as Account['tipo']})}><option>Banco</option><option>Billetera</option><option>Efectivo</option></select></label><label>Saldo inicial<input inputMode="decimal" value={accountDraft.saldoInicial} onChange={event=>setAccountDraft({...accountDraft,saldoInicial:event.target.value})}/></label></div><button className="mc-submit">Guardar cuenta</button></form>}
      <div className="mc-config-list">{accounts.map(account=><article key={account.id}><span className="mc-setting-icon"><Landmark size={18}/></span><div><strong>{account.nombre}</strong><small>{account.tipo} · {account.moneda}</small></div><button onClick={()=>setDeleteTarget(account)} aria-label={`Eliminar ${account.nombre}`}><Trash2 size={17}/></button></article>)}</div>
    </section>
    <section className="mc-section"><div className="mc-section-title"><h3>Categorías</h3></div><div className="mc-tag-editor"><div>{settings.categorias.map(category=><span key={category}>{category}<button onClick={()=>void onSaveSettings({...settings,categorias:settings.categorias.filter(item=>item!==category)})}><X size={13}/></button></span>)}</div><form onSubmit={event=>{event.preventDefault();addCategory()}}><input value={newCategory} onChange={event=>setNewCategory(event.target.value)} placeholder="Nueva categoría"/><button>Agregar</button></form></div></section>
    <section className="mc-section"><div className="mc-section-title"><h3>Plataformas de inversión</h3></div><div className="mc-tag-editor"><div>{(settings.investmentPlatforms||[]).map(platform=><span key={platform}>{platform}<button onClick={()=>void onSaveSettings({...settings,investmentPlatforms:(settings.investmentPlatforms||[]).filter(item=>item!==platform)})}><X size={13}/></button></span>)}</div><form onSubmit={event=>{event.preventDefault();addPlatform()}}><input value={newPlatform} onChange={event=>setNewPlatform(event.target.value)} placeholder="Ej. Binance"/><button>Agregar</button></form></div></section>
    {deleteTarget&&<div className="mc-sheet-backdrop"><div className="mc-confirm"><span><Trash2 size={20}/></span><h3>Eliminar cuenta</h3><p>Se eliminará {deleteTarget.nombre}. Tus movimientos existentes no se borrarán.</p><button className="mc-submit" onClick={async()=>{await onDeleteAccount(deleteTarget.id);setDeleteTarget(null)}}>Eliminar cuenta</button><button className="mc-detail" onClick={()=>setDeleteTarget(null)}>Cancelar</button></div></div>}
  </main>;

  if(panel==='help')return <main className="mc-screen mc-subpage">
    <header className="mc-subpage-head"><button onClick={()=>setPanel(null)} aria-label="Volver"><ArrowLeft size={20}/></button><div><p>AYUDA</p><h1>Preguntas frecuentes</h1></div></header>
    <section className="mc-faq"><details><summary>¿Cómo registro un movimiento?</summary><p>Abrí Registrar, elegí el tipo, escribí el importe y seleccioná la cuenta. El detalle es opcional.</p></details><details><summary>¿Cómo transfiero dinero entre cuentas?</summary><p>Elegí Transferencia al registrar. El dinero cambia de cuenta sin contarse como gasto ni ingreso.</p></details><details><summary>¿Puedo corregir un movimiento?</summary><p>Sí. Entrá en Actividad, tocá el movimiento y editá su fecha, importe o detalle.</p></details><details><summary>¿Qué pasa con un movimiento eliminado?</summary><p>Permanece en la papelera durante 30 días para que puedas recuperarlo.</p></details><details><summary>¿GEFI funciona sin conexión?</summary><p>La app puede abrirse y registrar datos sin conexión. La sincronización se completa cuando vuelve internet.</p></details></section>
    <a className="mc-support-card" href="mailto:gefisupport@gmail.com"><span className="mc-setting-icon"><Mail size={18}/></span><div><strong>Contactar a soporte</strong><small>gefisupport@gmail.com</small></div><ChevronRight size={18}/></a>
  </main>;

  if(panel==='policies')return <main className="mc-screen mc-subpage"><header className="mc-subpage-head"><button onClick={()=>setPanel(null)} aria-label="Volver"><ArrowLeft size={20}/></button><div><p>LEGAL</p><h1>Política de Privacidad de GeFi</h1><small>Última actualización: 30 de agosto de 2026</small></div></header><section className="mc-policy"><h2>1. Datos que guardamos</h2><p>GeFi guarda los movimientos financieros, cuentas, categorías, preferencias, accesos directos y la información básica de tu cuenta necesaria para identificarte y sincronizar tus datos.</p><h2>2. Para qué usamos los datos</h2><p>Usamos esos datos únicamente para mostrar tu resumen financiero, permitirte registrar movimientos, mantener tus preferencias y sincronizar la información entre los dispositivos donde iniciás sesión.</p><h2>3. Almacenamiento y seguridad</h2><p>La información se almacena mediante Firebase. GeFi no vende tus datos ni los comparte con fines publicitarios. Protegé tu cuenta y no compartas tus credenciales de acceso.</p><h2>4. Uso sin conexión</h2><p>Cuando no hay Internet, GeFi puede conservar cambios en el dispositivo. Al volver la conexión, intenta sincronizarlos con tu cuenta.</p><h2>5. Tus controles</h2><p>Podés editar o borrar movimientos desde la app, descargar un respaldo JSON e importar respaldos anteriores. La eliminación de información en tus dispositivos no siempre elimina automáticamente copias que ya estén en un respaldo que hayas descargado.</p><h2>6. Contacto y eliminación de cuenta</h2><p>Para consultas sobre privacidad, eliminación de datos o soporte, escribinos a <a href="mailto:gefisupport@gmail.com">gefisupport@gmail.com</a>.</p><h2>7. Cambios a esta política</h2><p>Podemos actualizar esta política cuando agreguemos funciones nuevas. La fecha de actualización se mostrará en esta misma sección.</p></section></main>;

  if(panel==='account')return <main className="mc-screen mc-subpage"><header className="mc-subpage-head"><button onClick={()=>setPanel(null)} aria-label="Volver"><ArrowLeft size={20}/></button><div><p>PERFIL</p><h1>Seguridad de la cuenta</h1></div></header><section className="mc-account-identity">{userPhotoURL?<img src={userPhotoURL} alt={`Foto de ${userName}`} referrerPolicy="no-referrer"/>:<div>{userName.trim().charAt(0).toUpperCase()}</div>}<strong>{userName}</strong><small>{userEmail}</small></section><section className="mc-settings-modern"><button onClick={async()=>{await onResetPassword();setStatus('Te enviamos un correo para cambiar tu contraseña.')}}><span className="mc-setting-icon"><KeyRound size={18}/></span><div><strong>Cambiar contraseña</strong><small>Recibí un enlace seguro en tu correo</small></div><ChevronRight size={18}/></button></section><h3 className="mc-settings-heading">Zona de riesgo</h3><section className="mc-danger-zone"><button onClick={()=>setRiskAction('reset')}><strong>Restablecer datos</strong><small>Borra movimientos y configuraciones, pero conserva la cuenta.</small></button><button onClick={()=>setRiskAction('delete')}><strong>Eliminar cuenta</strong><small>Borra permanentemente la cuenta y todos sus datos.</small></button></section>{status&&<p className="mc-status-message">{status}</p>}{riskAction&&<div className="mc-sheet-backdrop"><div className="mc-confirm"><span><Trash2 size={20}/></span><h3>{riskAction==='delete'?'Eliminar cuenta':'Restablecer datos'}</h3><p>{riskAction==='delete'?'No podrás recuperar la cuenta ni su información.':'Todos tus movimientos y ajustes se eliminarán.'}</p><button className="mc-submit" onClick={async()=>{if(riskAction==='delete')await onDeleteUserAccount();else{await onResetData();setRiskAction(null);setStatus('Tus datos fueron restablecidos.')}}}>{riskAction==='delete'?'Eliminar definitivamente':'Restablecer todo'}</button><button className="mc-detail" onClick={()=>setRiskAction(null)}>Cancelar</button></div></div>}</main>;

  return <main className="mc-screen">
    <Topbar eyebrow="CUENTA Y PREFERENCIAS" title="Perfil"/>
    <button className="mc-profile-card" onClick={()=>setPanel('account')}>{userPhotoURL?<img src={userPhotoURL} alt={`Foto de ${userName}`} referrerPolicy="no-referrer"/>:<div>{userName.trim().charAt(0).toUpperCase()}</div>}<span><strong>{userName}</strong><small>{userEmail||'Cuenta sincronizada con GEFI'}</small></span><ChevronRight size={19}/></button>
    <h3 className="mc-settings-heading">Privacidad y apariencia</h3>
    <section className="mc-settings-modern">
      <button onClick={()=>void onSaveSettings({...settings,darkMode:!settings.darkMode})}><span className="mc-setting-icon">{settings.darkMode?<Moon size={18}/>:<Sun size={18}/>}</span><div><strong>Modo oscuro</strong><small>Reduce el brillo de la interfaz</small></div><i className={settings.darkMode?'on':''}><em/></i></button>
    </section>
    <h3 className="mc-settings-heading">Preferencias</h3>
    <section className="mc-settings-modern mc-settings-selects">
      <label><span className="mc-setting-icon"><Globe2 size={18}/></span><div><strong>Idioma</strong><small>Idioma de toda la aplicación</small></div><select value={settings.language||'es'} onChange={event=>void onSaveSettings({...settings,language:event.target.value as 'es'|'en'})}><option value="es">ES</option><option value="en">EN</option></select></label>
      <label><span className="mc-setting-icon"><CircleDollarSign size={18}/></span><div><strong>Moneda principal</strong><small>Usada en resúmenes y movimientos</small></div><select value={settings.monedaBase} onChange={event=>void onSaveSettings({...settings,monedaBase:event.target.value,monedas:[event.target.value,...settings.monedas.filter(item=>item!==event.target.value)]})}>{settings.monedas.map(item=><option key={item}>{item}</option>)}</select></label>
    </section>
    <h3 className="mc-settings-heading">Tus datos</h3>
    <section className="mc-settings-modern">
      <button onClick={()=>setPanel('accounts')}><span className="mc-setting-icon"><WalletCards size={18}/></span><div><strong>Cuentas y configuración avanzada</strong><small>{accounts.length} {accounts.length===1?'cuenta configurada':'cuentas configuradas'}</small></div><ChevronRight size={18}/></button>
      <button onClick={onExport}><span className="mc-setting-icon"><Download size={18}/></span><div><strong>Descargar respaldo</strong><small>Exportá todos tus datos en formato JSON</small></div><ChevronRight size={18}/></button>
    </section>
    <h3 className="mc-settings-heading">Ayuda</h3>
    <section className="mc-settings-modern"><a href="mailto:gefisupport@gmail.com"><span className="mc-setting-icon"><Mail size={18}/></span><div><strong>Contactar a soporte</strong><small>gefisupport@gmail.com</small></div><ChevronRight size={18}/></a><button onClick={()=>setPanel('help')}><span className="mc-setting-icon"><CircleHelp size={18}/></span><div><strong>Ayuda y preguntas frecuentes</strong><small>Consultá las funciones de GEFI</small></div><ChevronRight size={18}/></button><button onClick={()=>setPanel('policies')}><span className="mc-setting-icon"><FileText size={18}/></span><div><strong>Políticas de GEFI</strong><small>Privacidad, datos y seguridad</small></div><ChevronRight size={18}/></button></section>
    <button className="mc-logout" onClick={onLogout}><LogOut size={17}/>Cerrar sesión</button>
  </main>;
}

export default function MobileConcept(props: MobileConceptProps) {
  const [screen, setScreen] = useState<Screen>('home');
  const screenRef=useRef<Screen>('home');
  useEffect(()=>{screenRef.current=screen},[screen]);
  useEffect(()=>{
    const base={...(history.state||{}),gefiMobileBase:true};
    history.replaceState(base,'');
    history.pushState({...base,gefiMobileScreen:'home'},'');
    const onPopState=()=>{if(screenRef.current!=='home'){screenRef.current='home';setScreen('home');window.scrollTo({top:0,behavior:'auto'})}};
    window.addEventListener('popstate',onPopState);
    return()=>window.removeEventListener('popstate',onPopState);
  },[]);
  const navigate = (next: Screen) => { screenRef.current=next;setScreen(next);if(next!=='home')history.replaceState({...history.state,gefiMobileScreen:next},'');window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const tabs = [
    ['home', Home, 'Inicio'], ['activity', CircleDollarSign, 'Actividad'],
    ['add', Plus, 'Agregar'], ['plan', CalendarDays, 'Plan'], ['profile', UserRound, 'Perfil'],
  ] as const;
  return <div className="mobile-concept">
    {screen === 'home' && <HomeScreen navigate={navigate} {...props}/>}
    {screen === 'activity' && <ActivityScreen {...props}/>}
    {screen === 'add' && <AddScreen {...props}/>}
    {screen === 'transfer' && <AddScreen {...props} initialType="Transferencia"/>}
    {screen === 'plan' && <PlanScreen {...props}/>}
    {screen === 'profile' && <ProfileScreen {...props}/>}
    <nav className="mc-nav" aria-label="Navegación principal">{tabs.map(([id, Icon, label]) => <button key={id} onClick={() => navigate(id)} className={`${screen === id ? 'active' : ''} ${id === 'add' ? 'add' : ''}`}><Icon size={20}/><span>{label}</span></button>)}</nav>
  </div>;
}
