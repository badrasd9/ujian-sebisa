import React, { useState } from 'react';
import { api } from './api';
import { ShieldCheck, GraduationCap, Copy, HelpCircle, Lock } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (data: any, credentials: {nis: string, token: string}) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [nis, setNis] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis || !token) {
      setError("Harap isi NIS dan Token");
      return;
    }
    setLoading(true);
    setError('');
    
    const res = await api.login(nis, token);
    setLoading(false);
    
    if (res.success && res.data) {
      onLoginSuccess(res.data, { nis, token });
    } else {
      setError(res.message || "Gagal masuk. Periksa kembali NIS dan Token.");
    }
  };

  const handleFullscreenRequest = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      // Then trigger submit after a short delay to allow fullscreen
      setTimeout(() => {
        handleSubmit(e as any);
      }, 100);
    } catch (err) {
      console.warn("Fullscreen error", err);
      handleSubmit(e as any); // Fallback if fullscreen is denied
    }
  };


  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans text-on-surface">
      <div className="absolute top-4 left-4 flex items-center space-x-2">
         <ShieldCheck className="w-6 h-6 text-primary" />
         <div>
            <h1 className="font-display font-bold text-primary text-lg leading-tight">UjianSebisa</h1>
            <p className="text-xs text-outline font-medium">Portal Asesmen Digital Terstandar</p>
         </div>
      </div>
      
      <div className="absolute top-4 right-4 flex items-center space-x-4 text-sm font-medium">
         <div className="flex items-center space-x-2 bg-surface-container-low px-3 py-1.5 rounded-full text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>TA 2024/2025</span>
         </div>
         <div className="flex items-center space-x-2 bg-surface-container-low px-3 py-1.5 rounded-full text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>GAS Engine Ready</span>
         </div>
      </div>

      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center mb-4 text-primary relative">
            <GraduationCap className="w-8 h-8" />
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-secondary rounded-full border-2 border-white flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold text-primary text-center">Portal Masuk Ujian Online</h2>
          <p className="text-center text-on-surface-variant text-sm mt-2">
            Masukkan NIS dan Token resmi yang diberikan oleh proktor atau pengawas ruangan Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm font-medium flex items-start">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-on-surface">Nomor Induk Siswa (NIS)</label>
              <span className="text-xs text-outline font-medium">4 Digit Angka</span>
            </div>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Lock className="h-5 w-5 text-outline-variant" />
               </div>
              <input 
                type="text" 
                value={nis}
                onChange={e => setNis(e.target.value)}
                placeholder="Contoh: 1234"
                className="w-full bg-surface-bright border border-outline-variant/60 text-on-surface rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
              />
            </div>
            <p className="text-xs text-outline mt-1.5">Pastikan NIS sesuai dengan kartu peserta asesmen terdaftar.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-semibold text-on-surface">Token Ujian</label>
                <span className="bg-surface-container-high text-primary text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Wajib</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <svg className="h-5 w-5 text-outline-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </div>
              <input 
                type="text" 
                value={token}
                onChange={e => setToken(e.target.value.toUpperCase())}
                placeholder="X9K2-QRPZ"
                className="w-full bg-surface-bright border border-outline-variant/60 text-on-surface rounded-lg pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all uppercase tracking-[0.2em] font-mono font-bold"
              />
            </div>
            <p className="text-xs text-outline mt-1.5">Token dibagikan pengawas 5 menit sebelum sesi dimulai.</p>
          </div>

          <button 
            type="button"
            onClick={handleFullscreenRequest}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-container text-white font-semibold py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                <span>Mulai Ujian Sekarang (Masuk Fullscreen)</span>
              </>
            )}
          </button>
          
          <div className="flex items-start space-x-2 text-xs text-outline-variant">
            <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Menekan tombol ini akan mengaktifkan mode layar penuh secara otomatis untuk keamanan sesi ujian.</p>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/30 flex justify-between text-sm">
          <button className="text-secondary hover:underline font-medium flex items-center space-x-1">
            <HelpCircle className="w-4 h-4" />
            <span>Lupa / Belum terima token?</span>
          </button>
          <button className="text-on-surface-variant hover:underline font-medium">
            Pusat Bantuan Ujian
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-outline-variant flex flex-col items-center space-y-2">
         <div className="flex items-center space-x-2">
           <ShieldCheck className="w-4 h-4 text-secondary" />
           <span className="font-medium">Sesi Terkunci & Terenkripsi</span>
           <span className="w-1 h-1 bg-outline-variant rounded-full mx-1"></span>
           <span className="font-medium">Deteksi Tab & Aplikasi Aktif</span>
         </div>
         <p>© 2024 UjianSebisa — Asesmen Berbasis Web & Apps Script</p>
      </div>
    </div>
  );
}
