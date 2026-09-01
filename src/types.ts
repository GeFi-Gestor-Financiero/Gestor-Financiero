export type TransactionType = 'Ingreso' | 'Gasto' | 'Inversion' | 'Desinversion' | 'Ahorro' | 'Efectivo' | 'Gasto efectivo' | 'Transferencia' | 'Prestamo' | 'Ef+' | 'Ef-';

export interface Transaction {
  id: string;
  fecha: string;
  categoria: TransactionType;
  monto: number;
  moneda?: string;
  cotizacion?: number;
  motivo: string;
  categoriaDetalle?: string;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  createdAt: number;
  uid: string;
  deletedAt?: number;
  accountDelta?: number;
  balanceOrigin?: 'baseline' | 'new';
}

export interface Account { id: string; nombre: string; tipo: 'Banco' | 'Billetera' | 'Efectivo'; moneda: string; saldoInicial: number; activa: boolean; }
export interface FixedExpense { id: string; nombre: string; monto: number; moneda: string; categoria: string; cuentaId: string; frecuencia: 'Mensual' | 'Semanal' | 'Anual'; proximoVencimiento: string; estado: 'Pendiente' | 'Pagado'; }
export interface LoanPayment { fecha: string; monto: number; nota?: string; }
export interface Loan { id: string; persona: string; monto: number; moneda: string; motivo: string; fecha: string; estado: 'Pendiente' | 'Pagado'; cuentaId?: string; fechaEstimada?: string; pagos: LoanPayment[]; }
export interface QuickLink { id: string; nombre: string; url: string; }
export interface SavingsGoal { id: string; nombre: string; objetivo: number; }
export interface PaymentReminder { id: string; nombre: string; monto?: number; moneda: string; fecha: string; estado: 'Pendiente' | 'Pagado'; avisoDias: number; }
export interface UserSettings { darkMode: boolean; hideBalances: boolean; monedaBase: string; monedas: string[]; categorias: string[]; widgets: string[]; quickLinks: QuickLink[]; showSavings?: boolean; onboardingCompleted?: boolean; currencySetupCompleted?: boolean; language?: 'es' | 'en'; budgets?: Record<string, number>; savingsGoals?: SavingsGoal[]; fontScale?: 'normal' | 'large' | 'extraLarge'; investmentPlatforms?: string[]; paymentReminders?: PaymentReminder[]; monthlyEmailSummary?: boolean; paymentEmailReminders?: boolean; }

export interface MonthSummary {
  plataInicial: number;
  ingresos: number;
  gastos: number;
  inversiones: number;
  dineroEnCuenta: number; // plataInicial + ingresos - gastos - inversiones (only bank / non-cash entries)
  efectivo: number; // sum of Ef+ minus Ef- up to the selected month
  totalActual: number; // dineroEnCuenta + efectivo
  patrimonioTotal?: number;
  mayorGasto?: number;
}
