import React, { useState } from 'react';
import { X, LogIn, ShieldAlert, ShieldCheck } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_ADMIN_EMAIL = 'emanoelcarmo00@gmail.com';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const validateAndLogin = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      setErrorMsg('');
      onSuccess();
      onClose();
    } else {
      setErrorMsg(
        `Acesso negado: O e-mail (${email || 'não informado'}) não tem permissão. Apenas ${ALLOWED_ADMIN_EMAIL} pode logar.`
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await signInWithPopup(auth, googleProvider);
      const userEmail = res.user.email || '';
      validateAndLogin(userEmail);
    } catch (e: any) {
      console.warn('Google Auth popup notice:', e);
      if (e?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Login via Google cancelado pelo usuário.');
      } else {
        setErrorMsg('Não foi possível abrir a janela do Google. Tente novamente ou confirme o e-mail autorizado abaixo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndLogin(manualEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-backdrop">
      <div className="relative w-full max-w-sm bg-[#141418] border border-orange-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-center animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/30 shadow-lg shadow-orange-500/10">
          <LogIn className="w-7 h-7" />
        </div>

        <div>
          <span className="bg-orange-500/20 text-orange-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-orange-500/30">
            Autenticação Restrita
          </span>
          <h3 className="font-black text-white text-xl mt-2 font-display">Entrar com Google</h3>
          <p className="text-zinc-400 text-xs mt-1">
            Nas regras do sistema, <strong className="text-orange-400">apenas a conta Google autorizada ({ALLOWED_ADMIN_EMAIL})</strong> possui permissão de acesso.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl font-bold flex items-center gap-2 text-left">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
            <span className="break-words">{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-[#1c1c22] hover:bg-zinc-800 text-white border border-zinc-700 font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg hover:border-orange-500/50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            <span>{loading ? 'Conectando ao Google...' : 'Entrar com Conta Google'}</span>
          </button>

          <div className="pt-2 border-t border-zinc-800/80 text-left">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">
              Confirmar E-mail Google Autorizado:
            </label>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="Emanoelcarmo00@gmail.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs px-3 py-2.5 rounded-xl focus:border-orange-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 gap-1"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Entrar</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

