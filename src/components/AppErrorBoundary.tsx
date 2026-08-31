import React from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

type State = { failed: boolean };
type Props = { children: React.ReactNode };

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('GeFi UI error:', error); }
  render() {
    const children = (this as unknown as { props: Props }).props.children;
    if (!this.state.failed) return children;
    return <main className="grid min-h-screen place-items-center bg-slate-100 p-4 text-slate-800 dark:bg-slate-950 dark:text-slate-100"><section role="alert" className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-xl dark:border-amber-900/60 dark:bg-slate-900"><ShieldAlert className="mx-auto h-8 w-8 text-amber-500"/><h1 className="mt-4 text-lg font-bold">GeFi necesita recargarse</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Tus datos no se borraron. Actualizá la página para volver a abrir la aplicación.</p><button type="button" onClick={() => window.location.reload()} className="mx-auto mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"><RefreshCw className="h-4 w-4"/>Recargar GeFi</button></section></main>;
  }
}
