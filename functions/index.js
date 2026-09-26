const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
admin.initializeApp();
const smtpUser = defineSecret('SMTP_USER');
const smtpPass = defineSecret('SMTP_PASS');
const timeZone = 'America/Argentina/Buenos_Aires';
const tips = [
  'Revisá primero los gastos pequeños que se repiten: suelen ser los más fáciles de ajustar.',
  'Separá el ahorro apenas recibís un ingreso para no depender de lo que quede al final del mes.',
  'Antes de una compra no planificada, esperá 24 horas y volvé a evaluar si todavía la necesitás.',
  'Compará tus gastos por categoría con el mes anterior para detectar cambios antes de que se acumulen.',
  'Mantené un fondo de emergencia separado de tus inversiones de largo plazo.',
];
const transport = () => nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_PORT) === '465', auth: { user: smtpUser.value(), pass: smtpPass.value() } });
const valueOf = item => Number(item.monto || 0) * ((!item.moneda || item.moneda === 'ARS') ? 1 : Number(item.cotizacion || 1));
const correction = item => item.categoriaDetalle === 'Corrección de saldo' || /^Corrección de\s/i.test(item.motivo || '');
const money = (value,currency='ARS') => new Intl.NumberFormat('es-AR',{style:'currency',currency,maximumFractionDigits:0}).format(value);
const isoDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dayDifference = (from,to) => Math.round((new Date(`${to}T12:00:00Z`).getTime()-new Date(`${from}T12:00:00Z`).getTime())/86400000);
const bankImpact = (item,accountById) => {
  const value=valueOf(item),origin=accountById.get(item.cuentaOrigen),destination=accountById.get(item.cuentaDestino);
  if(item.categoria==='Transferencia')return(origin&&origin.tipo!=='Efectivo'?-value:0)+(destination&&destination.tipo!=='Efectivo'?value:0);
  if(item.categoria==='Prestamo'){if(destination)return destination.tipo==='Efectivo'?0:value;return item.cuentaOrigen?-value:0}
  if(item.categoria==='Ingreso')return value;
  if(['Gasto','Inversion','Ahorro'].includes(item.categoria))return -value;
  if(item.categoria==='Desinversion')return value;
  return 0;
};
const cashImpact = (item,accountById) => {
  const value=valueOf(item),origin=accountById.get(item.cuentaOrigen),destination=accountById.get(item.cuentaDestino);
  if(item.categoria==='Ef+')return value;
  if(item.categoria==='Ef-')return -value;
  if(item.categoria==='Prestamo')return destination?.tipo==='Efectivo'?value:0;
  if(item.categoria!=='Transferencia')return 0;
  return(origin?.tipo==='Efectivo'?-value:0)+(destination?.tipo==='Efectivo'?value:0);
};

exports.monthlyFinanceReport = onSchedule({ schedule: '0 9 1 * *', timeZone, retryCount: 3, secrets: [smtpUser, smtpPass] }, async () => {
  const db=admin.firestore(),users=await db.collection('users').get(),now=new Date(),previous=new Date(now.getFullYear(),now.getMonth()-1,1),prefix=`${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,'0')}`,periodEnd=isoDate(new Date(previous.getFullYear(),previous.getMonth()+1,0)),mailer=transport();
  await Promise.all(users.docs.map(async user=>{
    const recipient=user.data().email,settingsRef=user.ref.collection('settings').doc('finance'),settingsDoc=await settingsRef.get(),settings=settingsDoc.data()||{},currency='ARS';
    const [transactionDocs,accountDocs]=await Promise.all([user.ref.collection('transactions').get(),user.ref.collection('accounts').get()]);
    const all=transactionDocs.docs.map(doc=>doc.data()).filter(item=>!item.deletedAt&&String(item.fecha||'')<=periodEnd),monthly=all.filter(item=>String(item.fecha||'').startsWith(prefix)),accountItems=accountDocs.docs.map(doc=>({id:doc.id,...doc.data()})),accountById=new Map(accountItems.map(item=>[item.id,item]));
    let income=0,expense=0,invested=0,maxExpense=0,closingInvestments=0,closingSavings=0;
    monthly.forEach(item=>{const value=valueOf(item);if(!correction(item)&&(item.categoria==='Ingreso'||item.categoria==='Ef+'))income+=value;if(!correction(item)&&(item.categoria==='Gasto'||item.categoria==='Gasto efectivo'||item.categoria==='Ef-')){expense+=value;maxExpense=Math.max(maxExpense,value)}if(!correction(item)&&item.categoria==='Inversion')invested+=value;if(!correction(item)&&item.categoria==='Desinversion')invested-=value});
    all.forEach(item=>{if(item.categoria==='Inversion')closingInvestments+=valueOf(item);if(item.categoria==='Desinversion')closingInvestments-=valueOf(item);if(item.categoria==='Ahorro')closingSavings+=valueOf(item)});
    const initialCash=accountItems.filter(item=>item.tipo==='Efectivo').reduce((sum,item)=>sum+Number(item.saldoInicial||0),0),initialBank=accountItems.filter(item=>item.tipo!=='Efectivo').reduce((sum,item)=>sum+Number(item.saldoInicial||0),0),closingCash=initialCash+all.reduce((sum,item)=>sum+cashImpact(item,accountById),0),closingBank=initialBank+all.reduce((sum,item)=>sum+(Number.isFinite(Number(item.accountDelta))?Number(item.accountDelta):bankImpact(item,accountById)),0),closingPatrimony=closingBank+closingCash+closingInvestments+closingSavings,tip=tips[(previous.getMonth()+previous.getFullYear())%tips.length],closureRef=user.ref.collection('monthlyClosures').doc(prefix),existing=(await closureRef.get()).data()||{};
    const closure={period:prefix,closedAt:existing.closedAt||Date.now(),currency,income,expense,invested,maxExpense,closingBank,closingCash,closingInvestments:Math.max(0,closingInvestments),closingSavings:Math.max(0,closingSavings),closingPatrimony,emailStatus:existing.emailStatus||'pending'};
    await closureRef.set(closure,{merge:true});
    if(!recipient||settings.monthlyEmailSummary===false){await closureRef.set({emailStatus:'skipped'},{merge:true});return}
    if(existing.emailStatus==='sent')return;
    const subject=`GeFi · Cierre mensual de ${prefix}`,html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172033"><h1 style="color:#185fd3">Tu cierre de ${prefix}</h1><p>Guardamos una foto de cómo terminó tu mes en GeFi.</p><table style="width:100%;border-collapse:collapse"><tr><td style="padding:12px;background:#ecfdf5">Ingresos<br><b>${money(income,currency)}</b></td><td style="padding:12px;background:#fff1f2">Gastos<br><b>${money(expense,currency)}</b></td></tr><tr><td style="padding:12px;background:#fff7ed">Invertido en el mes<br><b>${money(invested,currency)}</b></td><td style="padding:12px;background:#eff6ff">Mayor gasto<br><b>${money(maxExpense,currency)}</b></td></tr></table><h2 style="margin-top:28px">Patrimonio al cierre</h2><p style="font-size:24px;font-weight:bold">${money(closingPatrimony,currency)}</p><p>Cuenta: ${money(closingBank,currency)} · Efectivo: ${money(closingCash,currency)} · Inversiones: ${money(closingInvestments,currency)} · Ahorros: ${money(closingSavings,currency)}</p><div style="margin-top:24px;padding:16px;border-left:4px solid #185fd3;background:#f8fafc"><b>Tip financiero del mes</b><p>${tip}</p></div><p style="margin-top:28px;color:#64748b;font-size:12px">Este cierre queda guardado en Presupuestos y reportes. Los movimientos siguen siendo editables, pero el cierre conserva la foto original del período.</p></div>`;
    try{await mailer.sendMail({from:process.env.SMTP_FROM||smtpUser.value(),to:recipient,subject,html});await closureRef.set({emailStatus:'sent',emailSentAt:Date.now(),emailError:admin.firestore.FieldValue.delete()},{merge:true})}catch(error){await closureRef.set({emailStatus:'failed',emailError:String(error?.message||error).slice(0,500)},{merge:true});throw error}
  }));
});

exports.paymentReminderEmails = onSchedule({ schedule: '0 9 * * *', timeZone, secrets: [smtpUser, smtpPass] }, async () => {
  const db=admin.firestore(),users=await db.collection('users').get(),today=isoDate(new Date()),mailer=transport();
  await Promise.all(users.docs.map(async user=>{const recipient=user.data().email;if(!recipient)return;const settingsRef=user.ref.collection('settings').doc('finance'),snapshot=await settingsRef.get(),settings=snapshot.data()||{};if(settings.paymentEmailReminders===false)return;const reminders=Array.isArray(settings.paymentReminders)?settings.paymentReminders:[],sent={...(settings.emailReminderSent||{})};let changed=false;
    for(const reminder of reminders){if(reminder.estado!=='Pendiente'||!reminder.fecha)continue;const days=dayDifference(today,reminder.fecha),notice=Math.max(0,Number(reminder.avisoDias||0));if(days>notice)continue;const phase=days<0?'vencido':days===0?'hoy':'proximo',key=`${reminder.id}_${today}_${phase}`;if(sent[key])continue;const label=days<0?`venció hace ${Math.abs(days)} día${Math.abs(days)===1?'':'s'}`:days===0?'vence hoy':`vence en ${days} día${days===1?'':'s'}`,amount=reminder.monto?` · ${new Intl.NumberFormat('es-AR',{style:'currency',currency:reminder.moneda||settings.monedaBase||'ARS'}).format(reminder.monto)}`:'';await mailer.sendMail({from:process.env.SMTP_FROM||smtpUser.value(),to:recipient,subject:`GeFi · ${reminder.nombre} ${label}`,html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h1 style="color:#185fd3">Recordatorio de pago</h1><p><b>${reminder.nombre}</b>${amount} ${label}.</p><p>Fecha registrada: ${reminder.fecha}</p><p style="color:#64748b;font-size:12px">Cuando lo pagues, marcá el recordatorio como completado en GeFi.</p></div>`});sent[key]=Date.now();changed=true}
    if(changed){const entries=Object.entries(sent).sort((left,right)=>Number(right[1])-Number(left[1])).slice(0,120);await settingsRef.set({emailReminderSent:Object.fromEntries(entries)},{merge:true})}
  }));
});
