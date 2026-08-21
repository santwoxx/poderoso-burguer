import React, { useEffect, useState } from 'react';
import { X, LogIn, ShieldCheck, CreditCard, Phone, User, MapPin } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { ADMIN_EMAILS } from '../data/mockData';
import { saveCustomerProfileDb } from '../services/firebaseService';
import type { CustomerProfile } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: CustomerProfile) => void;
  userProfile: CustomerProfile | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userProfile,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [cpf, setCpf] = useState(userProfile?.cpf || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [street, setStreet] = useState(userProfile?.address?.street || '');
  const [number, setNumber] = useState(userProfile?.address?.number || '');
  const [neighborhood, setNeighborhood] = useState(userProfile?.address?.neighborhood || '');
  const [complement, setComplement] = useState(userProfile?.address?.complement || '');
  const [reference, setReference] = useState(userProfile?.address?.reference || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Mantém os campos sincronizados quando o perfil chega/atualiza (ex: carregado do Firestore)
  useEffect(() => {
    if (!userProfile) return;
    setCpf((prev) => prev || userProfile.cpf || '');
    setPhone((prev) => prev || userProfile.phone || '');
    setStreet((prev) => prev || userProfile.address?.street || '');
    setNumber((prev) => prev || userProfile.address?.number || '');
    setNeighborhood((prev) => prev || userProfile.address?.neighborhood || '');
    setComplement((prev) => prev || userProfile.address?.complement || '');
    setReference((prev) => prev || userProfile.address?.reference || '');
    setLoading(false);

    // Se acabou de logar e já tem cadastro completo salvo, fecha o modal sozinho
    if (justLoggedIn && userProfile.cpf && userProfile.phone && userProfile.address?.street) {
      setJustLoggedIn(false);
      onClose();
    }
  }, [userProfile]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setJustLoggedIn(true);
      const res = await signInWithPopup(auth, googleProvider);
      const email = (res.user.email || '').toLowerCase();

      // Se o e-mail é de um administrador, o App.tsx detecta via onAuthStateChanged
      // e troca a tela para o Painel Administrativo automaticamente.
      if (ADMIN_EMAILS.includes(email)) {
        onClose();
        return;
      }

      // Para clientes comuns, o App.tsx busca (ou cria) o cadastro no Firestore
      // via onAuthStateChanged e repassa como `userProfile` — o efeito acima cuida do resto.
    } catch (e: any) {
      console.warn('Google Auth popup notice:', e);
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        alert('Erro ao fazer login com o Google: ' + (e.message || 'Erro desconhecido'));
      }
      setJustLoggedIn(false);
      setLoading(false);
    }
  };

  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setSaving(true);
    const updatedProfile: CustomerProfile = {
      ...userProfile,
      cpf: cpf.trim(),
      phone: phone.trim(),
      address: {
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        complement: complement.trim(),
        reference: reference.trim(),
      },
      updatedAt: new Date().toISOString(),
    };

    const ok = await saveCustomerProfileDb(updatedProfile);
    setSaving(false);

    if (!ok) {
      alert('Não foi possível salvar seus dados agora. Tente novamente em instantes.');
      return;
    }

    onSuccess(updatedProfile);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm bg-[#141418] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center my-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/30 shadow-lg shadow-orange-500/10">
          <LogIn className="w-7 h-7" />
        </div>

        <div>
          <span className="bg-orange-500/20 text-orange-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-orange-500/30">
            Login Seguro
          </span>
          <h3 className="font-black text-white text-xl mt-2 font-display">
            {userProfile ? 'Meu Perfil' : 'Entrar com Google'}
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            {userProfile
              ? 'Seus dados ficam salvos para o seu próximo pedido já vir pré-preenchido.'
              : (
                <>
                  O login é <strong className="text-orange-400">100% opcional</strong>! Você pode fazer pedidos como visitante sem login.
                </>
              )}
          </p>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl font-bold animate-bounce">
            Dados salvos com sucesso!
          </div>
        )}

        {!userProfile ? (
          <div className="space-y-4 pt-2">
            {/* Google Only Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-[#1c1c22] hover:bg-zinc-800 text-white border border-zinc-700 font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>{loading ? 'Conectando...' : 'Continuar com Conta Google'}</span>
            </button>

            <div className="bg-[#18181d] border border-zinc-800 p-3 rounded-2xl text-[11px] text-zinc-400 space-y-1">
              <p className="flex items-center justify-center gap-1 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Segurança Garantida via Google OAuth
              </p>
              <p>Autenticação rápida sem precisar memorizar senhas.</p>
            </div>
          </div>
        ) : (
          /* Profile details editor once logged in with Google */
          <form onSubmit={handleSaveProfileDetails} className="space-y-3 pt-1 text-left max-h-[60vh] overflow-y-auto pr-1">
            <div className="bg-[#18181d] border border-zinc-800 p-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-white text-xs truncate">{userProfile.name}</h4>
                <p className="text-[10px] text-zinc-400 truncate">{userProfile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  CPF (Opcional)
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white pl-9 pr-3 py-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  Telefone (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="73999998888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white pl-9 pr-3 py-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                Endereço de Entrega (Opcional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Rua / Avenida"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="col-span-2 w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Número"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Bairro"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none mt-2"
              />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Complemento"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Ponto de referência"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-3 rounded-xl shadow-lg shadow-orange-500/20 text-xs uppercase tracking-wider transition-all disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar Informações do Perfil'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
