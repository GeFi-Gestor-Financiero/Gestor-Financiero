// Firebase Functions v2: instalar firebase-admin, firebase-functions y nodemailer en functions/.
// SMTP_USER y SMTP_PASS deben cargarse como secretos de Firebase, nunca en el frontend.
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
admin.initializeApp();
const smtpUser = defineSecret('SMTP_USER');
const smtpPass = defineSecret('SMTP_PASS');

exports.monthlyFinanceReport = onSchedule({ schedule: '0 9 1 * *', timeZone: 'America/Argentina/Buenos_Aires', secrets: [smtpUser, smtpPass] }, async () => {
  const db = admin.firestore(); const users = await db.collection('users').get();
  const previous = new Date(); previous.setMonth(previous.getMonth() - 1);
  const prefix = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: false, auth: { user: smtpUser.value(), pass: smtpPass.value() } });
  await Promise.all(users.docs.map(async (user) => {
    const recipient = user.data().email; if (!recipient) return;
    const movements = await user.ref.collection('transactions').where('fecha', '>=', `${prefix}-01`).where('fecha', '<=', `${prefix}-31`).get();
    const expenses = movements.docs.map(d => d.data()).filter(x => x.categoria === 'Gasto' || x.categoria === 'Gasto efectivo');
    const max = expenses.reduce((n,x) => Math.max(n, Number(x.monto || 0) * Number(x.cotizacion || 1)), 0);
    const accounts = await user.ref.collection('accounts').get();
    const cash = accounts.docs.filter(d=>d.data().tipo === 'Efectivo').reduce((n,d)=>n+Number(d.data().saldoInicial||0),0);
    const bank = accounts.docs.filter(d=>d.data().tipo !== 'Efectivo').reduce((n,d)=>n+Number(d.data().saldoInicial||0),0);
    await transporter.sendMail({ from: process.env.SMTP_FROM || smtpUser.value(), to: recipient, subject: `GeFi · Resumen de ${prefix}`, text: `Mayor gasto del mes anterior: ARS ${max.toLocaleString('es-AR')}\nSaldo inicial: efectivo ARS ${cash.toLocaleString('es-AR')}, cuentas ARS ${bank.toLocaleString('es-AR')}, total ARS ${(cash+bank).toLocaleString('es-AR')}.` });
  }));
});
