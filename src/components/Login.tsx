import React, { useState } from 'react';
import { signInWithPopup, signInAnonymously, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, provider } from '../firebase';
import { LogIn, ShieldAlert, Sparkles, User, Wallet, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (accessToken?: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Login({ onLoginSuccess, darkMode, onToggleDarkMode }: LoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registering, setRegistering] = useState(false);
  const [info, setInfo] = useState<'privacy' | 'terms' | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || undefined;
      onLoginSuccess(token);
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión con Google. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || password.length < 6) { setError('Ingresá un correo válido y una contraseña de al menos 6 caracteres.'); return; }
    setLoading(true); setError(null);
    try {
      if (registering) await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.code === 'auth/email-already-in-use' ? 'Ese correo ya está registrado.' : 'No se pudo iniciar sesión. Revisá tus datos o creá una cuenta.');
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
        setError('El acceso como Invitado no está habilitado. Contactá al administrador.');
      } else {
        setError('Error al iniciar sesión como Invitado.');
      }
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-250">
      <div className="absolute top-4 right-4">
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
          title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
        
        <h2 className="mt-4 text-center text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Mi Gestor Financiero
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400 font-sans">
          Administra tus finanzas personales mes a mes de forma segura
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 py-6 px-4 shadow-sm rounded-2xl sm:px-8 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
          
          <div className="space-y-4">
            <div>
              <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 font-sans">
                Selecciona un método de acceso
              </p>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/45 rounded-xl flex gap-2 items-start text-xs text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center gap-2.5 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-400 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="11" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1"/>
                      <path d="M18.5 12c0-1.38-.46-2.65-1.23-3.68H12v2.78h3.47c-.29.77-.74 1.43-1.3 1.9v1.93h2.11c1.23-1.13 1.94-2.78 1.94-4.63z" fill="#4285F4"/>
                      <path d="M12 18.5c1.27 0 2.42-.42 3.23-1.12l-2.11-1.93c-.61.41-1.38.65-2.12.65-1.62 0-2.99-1.37-2.99-3s1.37-3 2.99-3c.74 0 1.51.24 2.12.65l2.11-1.93C14.42 7.92 13.27 7.5 12 7.5c-3.32 0-6 2.68-6 6s2.68 6 6 6z" fill="#34A853"/>
                      <path d="M12 5.5c.73 0 1.41.23 2 .63V4.18C13.41 3.45 12.76 3 12 3c-3.32 0-6 2.68-6 6v1.45h1.92C7.5 7.87 9.37 5.5 12 5.5z" fill="#FBBC05"/>
                      <path d="M18.5 12c0-.4-.03-.79-.1-1.18H12v2.38h3.47c-.1.28-.23.56-.38.82l2.11 1.63c1.23-1.13 1.94-2.78 1.94-4.63z" fill="#EA4335"/>
                    </svg>
                    <span>Iniciar con Google</span>
                  </>
                )}
              </button>
              <form onSubmit={handlePasswordLogin} className="space-y-2 pt-1">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (mín. 6 caracteres)" className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400" />
                <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-50">{registering ? 'CREAR CUENTA' : 'INGRESAR CON CONTRASEÑA'}</button>
                <button type="button" onClick={() => setRegistering(!registering)} className="w-full text-[10px] text-blue-600 dark:text-blue-400">{registering ? 'Ya tengo una cuenta' : 'Crear cuenta con correo y contraseña'}</button>
              </form>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-bold tracking-wider font-mono">O TAMBIÉN</span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGuestLogin}
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Entrar como Invitado</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Tus datos se sincronizan de forma segura entre tus dispositivos.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]"><button type="button" onClick={() => setInfo('privacy')} className="text-blue-600 dark:text-blue-400 hover:underline">Privacidad</button><button type="button" onClick={() => setInfo('terms')} className="text-blue-600 dark:text-blue-400 hover:underline">Términos de uso</button><a href="mailto:gefisupport@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">Soporte</a></div>
          </div>
        </div>
      </motion.div>
      {info && <PublicInfoDialog type={info} onClose={() => setInfo(null)} />}
    </div>
  );
}

function PublicInfoDialog({ type, onClose }: { type: 'privacy' | 'terms'; onClose: () => void }) {
  const privacy = type === 'privacy';
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"><section role="dialog" aria-modal="true" aria-label={privacy ? 'Política de privacidad' : 'Términos de uso'} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"><h2 className="text-lg font-bold">{privacy ? 'Política de privacidad' : 'Términos de uso'}</h2>{privacy ? <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><p>GeFi guarda tus movimientos, cuentas y preferencias en tu cuenta para sincronizarlos entre tus dispositivos.</p><p>No vendemos tus datos ni los usamos para publicidad. Podés descargar un respaldo desde Configuración y eliminar los movimientos que no quieras conservar.</p><p>El acceso se protege mediante tu inicio de sesión. No compartas tu contraseña con otras personas.</p></div> : <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><p>GeFi es una herramienta de organización personal. Los datos y cálculos son informativos y no constituyen asesoramiento financiero, contable ni legal.</p><p>Verificá siempre la información antes de tomar decisiones económicas. Sos responsable de los movimientos que registres y de mantener segura tu cuenta.</p><p>La disponibilidad de funciones de conexión puede depender de Internet y de los servicios de autenticación.</p></div>}<div className="mt-6 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white">Entendido</button></div></section></div>
}
export { Login };
