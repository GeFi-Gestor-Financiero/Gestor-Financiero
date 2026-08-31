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
  'Idioma': 'Language', 'Español': 'Spanish', 'Idioma / Language': 'Language / Idioma',
  'Preferencias generales': 'General preferences', 'Organización': 'Organization', 'Datos': 'Data', 'Secciones de configuración': 'Settings sections', 'Cerrar sin guardar': 'Close without saving',
  'Control personal de ingresos, gastos y efectivo': 'Personal income, expenses and cash control', 'Mes Anterior': 'Previous month', 'Mes Siguiente': 'Next month', 'Usuario': 'User', 'Modo Invitado': 'Guest mode', 'Mostrar montos': 'Show balances', 'Ocultar montos': 'Hide balances', 'Cambiar a Modo Claro': 'Switch to light mode', 'Cambiar a Modo Oscuro': 'Switch to dark mode', 'Cerrar Sesión': 'Sign out',
  'Enero': 'January', 'Febrero': 'February', 'Marzo': 'March', 'Abril': 'April', 'Mayo': 'May', 'Junio': 'June', 'Julio': 'July', 'Agosto': 'August', 'Septiembre': 'September', 'Octubre': 'October', 'Noviembre': 'November', 'Diciembre': 'December',
  'Administra tus finanzas personales mes a mes de forma segura': 'Manage your personal finances securely, month by month', 'Selecciona un método de acceso': 'Choose a sign-in method', 'Iniciar con Google': 'Sign in with Google', 'Correo electrónico': 'Email address', 'Contraseña (mín. 6 caracteres)': 'Password (min. 6 characters)', 'INGRESAR CON CONTRASEÑA': 'SIGN IN WITH PASSWORD', 'CREAR CUENTA': 'CREATE ACCOUNT', 'Crear cuenta con correo y contraseña': 'Create account with email and password', 'Ya tengo una cuenta': 'I already have an account', 'O TAMBIÉN': 'OR', 'Entrar como Invitado': 'Continue as guest', 'Tus datos se sincronizan de forma segura entre tus dispositivos.': 'Your data syncs securely across your devices.', 'Privacidad': 'Privacy',
  'Describí el movimiento con tus palabras.': 'Describe the transaction in your own words.', 'Ej: hoy gasté 10 mil en Open25': 'Example: today I spent 10 thousand at Open25', 'Registrar movimiento por voz': 'Record transaction by voice', 'Escribí o dictá el movimiento que querés registrar.': 'Write or dictate the transaction you want to record.', 'No pude reconocer el monto. Probá, por ejemplo: “hoy gasté 10 mil en Open25”.': 'I could not recognize the amount. Try, for example: “today I spent 10 thousand at Open25”.', 'No se pudo guardar el movimiento.': 'The transaction could not be saved.',
  'Ef+ (Efectivo)': 'Cash in', 'Ef- (Efectivo)': 'Cash out', 'Moneda': 'Currency', 'Cotización a ARS': 'ARS exchange rate', 'Categoría de detalle': 'Detail category', 'No modifica gastos, ingresos ni patrimonio.': 'It does not affect expenses, income, or net worth.',
  'Historial de movimientos': 'Transaction history', 'Buscar movimientos': 'Search transactions', 'Todos los tipos': 'All types', 'Monedas': 'Currencies', 'Todas las cuentas': 'All accounts', 'Tipo': 'Type', 'Detalle': 'Details', 'Cuenta': 'Account', 'Cargando movimientos…': 'Loading transactions…', 'No hay movimientos con esos filtros.': 'No transactions match these filters.', 'Modificar movimiento': 'Edit transaction', 'Editá los datos y presioná Guardar cambios.': 'Edit the details and press Save changes.', 'Motivo / descripción': 'Reason / description', 'Categoría / detalle': 'Category / detail', 'Enviar a la papelera': 'Move to bin', 'Eliminar movimientos seleccionados': 'Delete selected transactions', 'movimientos a la papelera?': 'transactions to the bin?', 'Enviar': 'Move', 'Guardando…': 'Saving…', 'Moviendo…': 'Moving…', 'Seleccionar todo': 'Select all', 'Quitar selección': 'Clear selection',
  'Gastos fijos': 'Recurring expenses', 'Agregar gasto fijo': 'Add recurring expense', 'Guardar gasto fijo': 'Save recurring expense', 'Pagar': 'Pay', 'Los préstamos de una misma persona se agrupan. Abrí cada grupo para consultar el detalle.': 'Loans to the same person are grouped. Open each group to view the details.', 'Suma de todos los préstamos pendientes': 'Sum of all outstanding loans', 'Todavía no registraste préstamos.': 'You have not recorded any loans yet.', 'Ahorros': 'Savings', 'Ahorros del mes seleccionado. Podés ocultar esta sección desde Configuración.': 'Savings for the selected month. You can hide this section in Settings.', 'No hay ahorros registrados este mes.': 'No savings recorded this month.', 'Accesos directos · clic derecho para editar': 'Shortcuts · right-click to edit', 'Soporte: gefisupport@gmail.com': 'Support: gefisupport@gmail.com',
  'Modificar acceso directo': 'Edit shortcut', 'El nombre es opcional; la URL es obligatoria.': 'The name is optional; the URL is required.', 'Nombre': 'Name', 'URL': 'URL', 'Eliminar acceso': 'Delete shortcut', 'Eliminar acceso directo': 'Delete shortcut', 'Sí, eliminar': 'Yes, delete', 'Completá los datos y guardá el gasto desde la página.': 'Complete the details and save the expense on this page.',
  'Sección de ahorros': 'Savings section', 'Mostrar los ahorros en la pantalla principal.': 'Show savings on the home screen.', 'Ajustá un total de la pantalla principal. La diferencia quedará registrada como un movimiento.': 'Adjust a total on the home screen. The difference will be recorded as a transaction.', 'Dinero en cuenta': 'Money in accounts', 'Patrimonio total': 'Total net worth', 'Inversiones del mes': 'Monthly investments', 'Actual:': 'Current:', 'Banco': 'Bank', 'Billetera': 'Wallet', 'No hay cuentas configuradas.': 'No accounts configured.', 'La URL es obligatoria; el nombre es opcional.': 'The URL is required; the name is optional.', 'Los movimientos se eliminan definitivamente después de 30 días.': 'Transactions are permanently deleted after 30 days.', 'La papelera está vacía.': 'The bin is empty.',
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

export function applyLanguage(language: Language, observe = language === 'en') {
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
  if (!observe) return () => undefined;
  const observer = new MutationObserver(records => records.forEach(record => { if (record.type === 'characterData') translate(record.target); record.addedNodes.forEach(translate); }));
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  return () => observer.disconnect();
}
