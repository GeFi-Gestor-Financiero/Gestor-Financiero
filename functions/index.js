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
const money = value => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(value);
const isoDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dayDifference = (from,to) => Math.round((new Date(`${to}T12:00:00Z`).getTime()-new Date(`${from}T12:00:00Z`).getTime())/86400000);

exports.monthlyFinanceReport = onSchedule({ schedule: '0 9 1 * *', timeZone, secrets: [smtpUser, smtpPass] }, async () => {
  const db=admin.firestore(), users=await db.collection('users').get(), now=new Date(), previous=new Date(now.getFullYear(),now.getMonth()-1,1), prefix=`${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,'0')}`, mailer=transport();
  await Promise.all(users.docs.map(async user=>{
    const recipient=user.data().email;if(!recipient)return;const settingsRef=user.ref.collection('settings').doc('finance'),settingsDoc=await settingsRef.get(),settings=settingsDoc.data()||{};if(settings.monthlyEmailSummary===false)return;
    const transactionDocs=await user.ref.collection('transactions').get(),all=transactionDocs.docs.map(doc=>doc.data()).filter(item=>!item.deletedAt),monthly=all.filter(item=>String(item.fecha||'').startsWith(prefix));
    let income=0,expense=0,invested=0,maxExpense=0,cumulativeInvestment=0;
    monthly.forEach(item=>{const value=valueOf(item);if(!correction(item)&&(item.categoria==='Ingreso'||item.categoria==='Ef+'))income+=value;if(!correction(item)&&(item.categoria==='Gasto'||item.categoria==='Gasto efectivo'||item.categoria==='Ef-')){expense+=value;maxExpense=Math.max(maxExpense,value)}if(item.categoria==='Inversion')invested+=value});
    all.filter(item=>String(item.fecha||'')<=`${prefix}-31`).forEach(item=>{if(item.categoria==='Inversion')cumulativeInvestment+=valueOf(item);if(item.categoria==='Desinversion')cumulativeInvestment-=valueOf(item)});
    const accounts=await user.ref.collection('accounts').get(),initialCash=accounts.docs.filter(doc=>doc.data().tipo==='Efectivo').reduce((sum,doc)=>sum+Number(doc.data().saldoInicial||0),0),initialBank=accounts.docs.filter(doc=>doc.data().tipo!=='Efectivo').reduce((sum,doc)=>sum+Number(doc.data().saldoInicial||0),0),accountDelta=all.filter(item=>String(item.fecha||'')<=`${prefix}-31`).reduce((sum,item)=>sum+Number(item.accountDelta||0),0),startTotal=initialBank+initialCash+accountDelta+cumulativeInvestment,tip=tips[(previous.getMonth()+previous.getFullYear())%tips.length];
    const subject=`GeFi · Así cerró ${prefix} y así comienza tu nuevo mes`,html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172033"><h1 style="color:#185fd3">Tu resumen de ${prefix}</h1><p>Un mes termina y otro comienza. Este es tu panorama registrado en GeFi.</p><table style="width:100%;border-collapse:collapse"><tr><td style="padding:12px;background:#ecfdf5">Ingresos<br><b>${money(income)}</b></td><td style="padding:12px;background:#fff1f2">Gastos<br><b>${money(expense)}</b></td></tr><tr><td style="padding:12px;background:#fff7ed">Invertido en el mes<br><b>${money(invested)}</b></td><td style="padding:12px;background:#eff6ff">Mayor gasto<br><b>${money(maxExpense)}</b></td></tr></table><h2 style="margin-top:28px">El nuevo mes comienza con</h2><p style="font-size:24px;font-weight:bold">${money(startTotal)}</p><p>Incluye cuentas, efectivo e inversiones acumuladas según tus registros.</p><div style="margin-top:24px;padding:16px;border-left:4px solid #185fd3;background:#f8fafc"><b>Tip financiero del mes</b><p>${tip}</p></div><p style="margin-top:28px;color:#64748b;font-size:12px">Podés corregir cualquier movimiento desde el historial de GeFi.</p></div>`;
    await mailer.sendMail({from:process.env.SMTP_FROM||smtpUser.value(),to:recipient,subject,html});
  }));
});

exports.paymentReminderEmails = onSchedule({ schedule: '0 9 * * *', timeZone, secrets: [smtpUser, smtpPass] }, async () => {
  const db=admin.firestore(),users=await db.collection('users').get(),today=isoDate(new Date()),mailer=transport();
  await Promise.all(users.docs.map(async user=>{const recipient=user.data().email;if(!recipient)return;const settingsRef=user.ref.collection('settings').doc('finance'),snapshot=await settingsRef.get(),settings=snapshot.data()||{};if(settings.paymentEmailReminders===false)return;const reminders=Array.isArray(settings.paymentReminders)?settings.paymentReminders:[],sent={...(settings.emailReminderSent||{})};let changed=false;
    for(const reminder of reminders){if(reminder.estado!=='Pendiente'||!reminder.fecha)continue;const days=dayDifference(today,reminder.fecha),notice=Math.max(0,Number(reminder.avisoDias||0));if(days>notice)continue;const phase=days<0?'vencido':days===0?'hoy':'proximo',key=`${reminder.id}_${today}_${phase}`;if(sent[key])continue;const label=days<0?`venció hace ${Math.abs(days)} día${Math.abs(days)===1?'':'s'}`:days===0?'vence hoy':`vence en ${days} día${days===1?'':'s'}`,amount=reminder.monto?` · ${new Intl.NumberFormat('es-AR',{style:'currency',currency:reminder.moneda||settings.monedaBase||'ARS'}).format(reminder.monto)}`:'';await mailer.sendMail({from:process.env.SMTP_FROM||smtpUser.value(),to:recipient,subject:`GeFi · ${reminder.nombre} ${label}`,html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h1 style="color:#185fd3">Recordatorio de pago</h1><p><b>${reminder.nombre}</b>${amount} ${label}.</p><p>Fecha registrada: ${reminder.fecha}</p><p style="color:#64748b;font-size:12px">Cuando lo pagues, marcá el recordatorio como completado en GeFi.</p></div>`});sent[key]=Date.now();changed=true}
    if(changed){const entries=Object.entries(sent).sort((left,right)=>Number(right[1])-Number(left[1])).slice(0,120);await settingsRef.set({emailReminderSent:Object.fromEntries(entries)},{merge:true})}
  }));
});
