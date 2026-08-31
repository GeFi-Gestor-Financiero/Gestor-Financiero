type Language = 'es' | 'en';

const phrases: Record<string, string> = {
  'Gestor Financiero': 'Financial Manager', 'Mi Gestor Financiero': 'My Financial Manager', 'Nuevo Movimiento': 'New transaction', 'Registro inteligente': 'Smart entry',
  'Interpretar y registrar': 'Interpret and save', 'AGREGAR REGISTRO': 'ADD TRANSACTION', 'Hablar': 'Speak', 'Escuchando…': 'Listening…', 'Registrando…': 'Saving…',
  'Patrimonio total': 'Total net worth', 'En cuentas': 'In accounts', 'Efectivo': 'Cash', 'Ingresos': 'Income', 'Gastos': 'Expenses', 'Mayor gasto': 'Highest expense', 'Inversiones': 'Investments',
  'Tocá para transferir': 'Tap to transfer', 'Tocá para ver detalle': 'Tap for details', 'Detalle de inversiones': 'Investment details',
  'Perfil y configuración': 'Profile and settings', 'Guardar configuración': 'Save settings', 'Cancelar': 'Cancel', 'Guardar cambios': 'Save changes',
  'Moneda base': 'Base currency', 'Monedas configuradas': 'Configured currencies', 'Categorías de gasto': 'Expense categories', 'Nueva categoría': 'New category', 'Agregar': 'Add',
  'Corrección de cuenta': 'Balance correction', 'Saldo a corregir': 'Balance to correct', 'Nuevo importe': 'New amount', 'Aplicar corrección': 'Apply correction',
  'Cuentas y efectivo': 'Accounts and cash', 'Agregar cuenta': 'Add account', 'Nombre de la cuenta': 'Account name', 'Guardar cuenta': 'Save account', 'Eliminar cuenta': 'Delete account',
  'Préstamos': 'Loans', 'Prestar dinero': 'Lend money', 'Guardar préstamo': 'Save loan', 'Persona': 'Person', 'Importe': 'Amount', 'Motivo (opcional)': 'Reason (optional)',
  'Préstamos realizados': 'Loans made', 'Total que te deben': 'Total owed to you', 'Total pendiente:': 'Total pending:', 'Marcar pagado': 'Mark as paid',
  'Accesos directos': 'Shortcuts', 'Agregar acceso': 'Add shortcut', 'Nombre (opcional)': 'Name (optional)', 'Eliminar': 'Delete', 'Modificar acceso': 'Edit shortcut',
  'Papelera de movimientos': 'Transaction bin', 'Restaurar': 'Restore', 'Eliminar definitivamente': 'Delete permanently', 'Eliminar para siempre': 'Delete forever',
  'Descargar JSON': 'Download JSON', 'Respaldo de datos': 'Data backup', 'Elegir respaldo': 'Choose backup', 'Importar': 'Import',
  'Política de privacidad': 'Privacy policy', 'Términos de uso': 'Terms of use', 'Soporte': 'Support', '¿Necesitás ayuda?': 'Need help?',
  'Bienvenido a GeFi': 'Welcome to GeFi', 'GUÍA INICIAL': 'GETTING STARTED', 'Omitir': 'Skip', 'Siguiente': 'Next', 'Atrás': 'Back', 'Empezar': 'Get started', 'Entendido': 'Got it',
  'Fecha': 'Date', 'Categoría': 'Category', 'Monto': 'Amount', 'Cuenta origen': 'Source account', 'Cuenta destino': 'Destination account', 'Sale de': 'From', 'Entra a': 'To',
  'Ingreso': 'Income', 'Gasto': 'Expense', 'Inversión': 'Investment', 'Ahorro': 'Savings', 'Transferencia entre cuenta y efectivo': 'Transfer between account and cash', 'Préstamo': 'Loan',
  'Motivo / Detalle': 'Reason / Details', 'Ver más': 'See more', 'Ver menos': 'See less', 'Sin cuenta': 'No account', 'Seleccionar': 'Select',
  'Pasar efectivo a cuenta': 'Deposit cash to account', 'Retirar efectivo de cuenta': 'Withdraw cash from account', 'Transferir dinero': 'Transfer money',
  'Estás sin conexión. Podés seguir usando GeFi: los cambios se sincronizarán cuando vuelva Internet.': 'You are offline. You can keep using GeFi: changes will sync when Internet returns.',
  'Buenos días': 'Good morning', 'Buenas tardes': 'Good afternoon', 'Buenas noches': 'Good evening', 'General': 'General', 'Alimentos': 'Food', 'Transporte': 'Transport', 'Salud': 'Health', 'Educación': 'Education', 'Hogar': 'Home', 'Ocio': 'Leisure', 'Trabajo': 'Work'
};

const reverse = Object.fromEntries(Object.entries(phrases).map(([es, en]) => [en, es]));

function translateText(value: string, language: Language) {
  const dictionary = language === 'en' ? phrases : reverse;
  const leading = value.match(/^\s*/)?.[0] || '', trailing = value.match(/\s*$/)?.[0] || '';
  const middle = value.slice(leading.length, value.length - trailing.length);
  return `${leading}${dictionary[middle] || middle}${trailing}`;
}

export function applyLanguage(language: Language) {
  document.documentElement.lang = language;
  document.documentElement.dataset.language = language;
  const root = document.getElementById('root');
  if (!root) return () => undefined;
  const translate = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { const next = translateText(node.nodeValue || '', language); if (next !== node.nodeValue) node.nodeValue = next; }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      ['placeholder', 'title', 'aria-label'].forEach(attribute => {
        const value = element.getAttribute(attribute);
        if (value) { const next = translateText(value, language); if (next !== value) element.setAttribute(attribute, next); }
      });
      element.childNodes.forEach(translate);
    }
  };
  translate(root);
  const observer = new MutationObserver(records => records.forEach(record => { if (record.type === 'characterData') translate(record.target); record.addedNodes.forEach(translate); }));
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  return () => observer.disconnect();
}
