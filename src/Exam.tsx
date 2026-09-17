import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { Soal } from './types';
import { Clock, ShieldAlert, AlertTriangle, LayoutGrid, CheckCircle2, Flag, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from './lib/utils';

interface ExamProps {
  studentData: any;
  credentials: { nis: string; token: string };
  onLogout: () => void;
}

export default function Exam({ studentData, credentials, onLogout }: ExamProps) {
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(studentData.durasiMenit * 60);
  const [loading, setLoading] = useState(true);
  
  // Anti-cheat states
  const [warningCount, setWarningCount] = useState(studentData.jumlahPelanggaran || 0);
  const [isBlocked, setIsBlocked] = useState(studentData.status === 'Terkunci');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const res = await api.getSoal(credentials.nis, credentials.token);
    if (res.success && res.data) {
      setQuestions(res.data.soal);
    } else if (res.error?.code === 'BLOCKED') {
      setIsBlocked(true);
    }
    setLoading(false);
  };

  // Timer
  useEffect(() => {
    if (isBlocked || loading || studentData.status === 'Selesai') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isBlocked, loading, studentData.status]);

  // Anti-cheat: Visibility & Fullscreen
  useEffect(() => {
    if (isBlocked || loading) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation("Pindah Tab/Aplikasi");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setShowWarningModal(true);
        logViolation("Keluar Fullscreen");
      }
    };

    const handleContextMenu = (e: Event) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && ['c', 'v', 'u'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBlocked, loading]);

  const logViolation = async (jenis: string) => {
    const res = await api.logPelanggaran(credentials.nis, credentials.token, jenis, "Terdeteksi oleh sistem");
    if (res.success && res.data) {
      setWarningCount(res.data.jumlahPelanggaran);
      if (res.data.blocked) {
        setIsBlocked(true);
      }
    }
  };

  const resumeFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setShowWarningModal(false);
    } catch (err) {
      alert("Harap izinkan mode layar penuh untuk melanjutkan ujian.");
    }
  };

  const submitExam = async () => {
    const payload = Object.keys(answers).map(idSoal => ({
      idSoal,
      jawabanSiswa: answers[idSoal]
    }));
    const res = await api.submitJawaban(credentials.nis, credentials.token, payload);
    if (res.success) {
      alert(`Ujian selesai. Skor Anda: ${res.data?.skor}`);
      onLogout();
    } else {
      alert(res.message);
    }
  };

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const toggleMarked = (qId: string) => {
    setMarked(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat soal...</div>;
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-error">
          <ShieldAlert className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-on-surface mb-2">Akses Terkunci</h2>
          <p className="text-on-surface-variant mb-6">
            Sesi ujian Anda telah dikunci karena sistem mendeteksi {warningCount} pelanggaran keamanan (batas maksimal: 3).
          </p>
          <button onClick={onLogout} className="bg-surface-container text-on-surface px-6 py-2 rounded-lg font-medium w-full">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center border-t-4 border-error">
            <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
            <h3 className="text-xl font-bold text-on-surface mb-2">Pelanggaran Terdeteksi</h3>
            <p className="text-on-surface-variant text-sm mb-6">
              Anda keluar dari mode layar penuh atau berpindah tab. Tindakan ini dicatat sebagai pelanggaran ({warningCount}/3).
            </p>
            <button onClick={resumeFullscreen} className="bg-primary text-white w-full py-3 rounded-lg font-semibold">
              Lanjutkan Ujian (Fullscreen)
            </button>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-on-surface mb-4">Konfirmasi Pengumpulan</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-surface-container-low p-4 rounded-lg text-center">
                  <div className="text-3xl font-display font-bold text-primary">{answeredCount}</div>
                  <div className="text-xs text-on-surface-variant mt-1">Terjawab</div>
               </div>
               <div className="bg-surface-container-low p-4 rounded-lg text-center">
                  <div className="text-3xl font-display font-bold text-error">{questions.length - answeredCount}</div>
                  <div className="text-xs text-on-surface-variant mt-1">Belum Terjawab</div>
               </div>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 text-center">
              Pastikan Anda telah memeriksa semua jawaban. Setelah dikumpulkan, Anda tidak dapat mengubah jawaban lagi.
            </p>
            <div className="flex space-x-3">
               <button onClick={() => setShowSubmitModal(false)} className="flex-1 bg-surface-container text-on-surface py-3 rounded-lg font-semibold">Batal</button>
               <button onClick={submitExam} className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Kumpulkan</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-outline-variant/30 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center space-x-4">
            <ShieldCheck className="w-6 h-6 text-primary hidden md:block" />
            <div>
              <h1 className="font-bold text-primary text-sm md:text-base">{studentData.namaUjian}</h1>
              <div className="text-xs text-on-surface-variant font-medium flex items-center space-x-2">
                 <span>{studentData.nama}</span>
                 <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                 <span>NIS: {credentials.nis}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <div className="hidden md:flex items-center space-x-2 bg-surface-container-low px-3 py-1.5 rounded-full text-xs font-medium text-primary">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span>GAS Tersinkron</span>
             </div>
             <div className="flex items-center space-x-2 bg-surface-container-high px-3 py-1.5 rounded-lg text-primary font-display font-bold tabular-nums">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
             </div>
             <button onClick={() => setShowSubmitModal(true)} className="hidden md:flex items-center space-x-2 bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
               <CheckCircle2 className="w-4 h-4" />
               <span>Selesai & Kumpulkan</span>
             </button>
          </div>
        </header>

        {/* Question Viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-bright">
           <div className="max-w-3xl mx-auto">
              
              {/* Question Metadata */}
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-3 text-xs font-semibold text-on-surface-variant">
                    <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md">Soal {currentIndex + 1} / {questions.length}</span>
                    <span className="flex items-center"><span className="w-1.5 h-1.5 bg-outline rounded-full mr-1.5"></span> Bobot: {currentQ.bobot} Poin</span>
                    <span className="flex items-center"><span className="w-1.5 h-1.5 bg-outline rounded-full mr-1.5"></span> Tipe: {currentQ.jenis === 'PG' ? 'Pilihan Ganda' : currentQ.jenis === 'PJ' ? 'Pilihan Jamak' : 'Benar/Salah'}</span>
                 </div>
                 
                 <button 
                    onClick={() => toggleMarked(currentQ.idSoal)}
                    className={cn(
                       "flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-md border transition-colors",
                       marked[currentQ.idSoal] 
                         ? "bg-tertiary-container/10 border-tertiary text-tertiary-container" 
                         : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                    )}
                 >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Ragu-ragu</span>
                 </button>
              </div>

              {/* Question Text */}
              <div className="bg-white border border-outline-variant/40 rounded-xl p-6 md:p-8 shadow-sm mb-6">
                 <p className="text-lg md:text-xl font-medium text-on-surface leading-relaxed whitespace-pre-wrap font-sans">
                    {currentQ.pertanyaan}
                 </p>
                 
                 {/* Options Area */}
                 <div className="mt-8 space-y-3">
                    {currentQ.jenis === 'PG' && currentQ.opsi?.map((opt, i) => {
                       const isSelected = answers[currentQ.idSoal] === opt;
                       return (
                          <div 
                             key={i}
                             onClick={() => handleAnswerChange(currentQ.idSoal, opt)}
                             className={cn(
                                "flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all",
                                isSelected 
                                  ? "border-secondary bg-secondary/5" 
                                  : "border-outline-variant/30 hover:border-outline-variant/60 bg-white"
                             )}
                          >
                             <div className={cn(
                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 transition-colors",
                                isSelected ? "bg-secondary text-white" : "bg-surface-container text-on-surface-variant"
                             )}>
                                {String.fromCharCode(65 + i)}
                             </div>
                             <div className={cn(
                                "pt-1 text-base leading-relaxed",
                                isSelected ? "text-primary font-medium" : "text-on-surface"
                             )}>
                                {opt}
                             </div>
                          </div>
                       );
                    })}

                    {currentQ.jenis === 'BS' && ['Benar', 'Salah'].map((opt, i) => {
                       const isSelected = answers[currentQ.idSoal] === opt;
                       return (
                          <div 
                             key={i}
                             onClick={() => handleAnswerChange(currentQ.idSoal, opt)}
                             className={cn(
                                "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                                isSelected 
                                  ? "border-secondary bg-secondary/5" 
                                  : "border-outline-variant/30 hover:border-outline-variant/60 bg-white"
                             )}
                          >
                             <div className={cn(
                                "w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center",
                                isSelected ? "border-secondary" : "border-outline-variant"
                             )}>
                                {isSelected && <div className="w-2.5 h-2.5 bg-secondary rounded-full" />}
                             </div>
                             <span className={cn("text-base", isSelected ? "text-primary font-semibold" : "text-on-surface")}>{opt}</span>
                          </div>
                       );
                    })}

                    {currentQ.jenis === 'PJ' && currentQ.opsi?.map((opt, i) => {
                       // Simple comma-separated storage for PJ
                       const currentAns = answers[currentQ.idSoal] ? answers[currentQ.idSoal].split(',') : [];
                       const isSelected = currentAns.includes(opt);
                       
                       const togglePj = () => {
                          let newAns = [...currentAns];
                          if (isSelected) newAns = newAns.filter(a => a !== opt);
                          else newAns.push(opt);
                          handleAnswerChange(currentQ.idSoal, newAns.join(','));
                       };

                       return (
                          <div 
                             key={i}
                             onClick={togglePj}
                             className={cn(
                                "flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all",
                                isSelected 
                                  ? "border-secondary bg-secondary/5" 
                                  : "border-outline-variant/30 hover:border-outline-variant/60 bg-white"
                             )}
                          >
                             <div className={cn(
                                "flex-shrink-0 w-6 h-6 rounded mr-4 mt-0.5 border-2 flex items-center justify-center transition-colors",
                                isSelected ? "bg-secondary border-secondary" : "border-outline-variant bg-white"
                             )}>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                             </div>
                             <div className={cn(
                                "text-base leading-relaxed",
                                isSelected ? "text-primary font-medium" : "text-on-surface"
                             )}>
                                {opt}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </div>

              {/* Bottom Nav */}
              <div className="flex items-center justify-between">
                 <button 
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="flex items-center space-x-2 px-5 py-3 rounded-lg font-semibold border border-outline-variant/50 text-on-surface bg-white hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                 </button>
                 <button 
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentIndex === questions.length - 1}
                    className="flex items-center space-x-2 px-5 py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <span>Berikutnya</span>
                    <ArrowRight className="w-4 h-4" />
                 </button>
              </div>

           </div>
        </div>
      </div>

      {/* Auxiliary Rail (Sidebar) */}
      <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-outline-variant/30 flex flex-col shrink-0 h-64 md:h-screen">
         <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
            <div className="flex items-center space-x-2">
               <LayoutGrid className="w-5 h-5 text-on-surface" />
               <h3 className="font-bold text-on-surface">Navigasi Soal</h3>
            </div>
            <span className="text-xs bg-surface-container px-2 py-1 rounded font-semibold text-primary">{questions.length} Butir</span>
         </div>
         
         <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2">
               {questions.map((q, i) => {
                  const isCurrent = i === currentIndex;
                  const isAnswered = !!answers[q.idSoal] && answers[q.idSoal] !== "";
                  const isMarked = marked[q.idSoal];

                  return (
                     <button
                        key={q.idSoal}
                        onClick={() => setCurrentIndex(i)}
                        className={cn(
                           "relative h-10 rounded-md text-sm font-bold tabular-nums transition-all border",
                           isCurrent ? "ring-2 ring-primary ring-offset-1 border-transparent" : "border-outline-variant/40 hover:border-outline-variant",
                           isAnswered ? "bg-secondary text-white border-transparent" : "bg-white text-on-surface",
                           isMarked && !isAnswered && "bg-tertiary-container/10 border-tertiary/50 text-tertiary-container",
                           isMarked && isAnswered && "bg-tertiary text-white border-transparent"
                        )}
                     >
                        {i + 1}
                        {isMarked && (
                           <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-tertiary rounded-full border border-white" />
                        )}
                     </button>
                  );
               })}
            </div>
         </div>
         
         {/* Mobile submit button */}
         <div className="p-4 md:hidden border-t border-outline-variant/30">
            <button onClick={() => setShowSubmitModal(true)} className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-3 rounded-lg font-semibold">
               <CheckCircle2 className="w-5 h-5" />
               <span>Selesai & Kumpulkan</span>
            </button>
         </div>
      </div>
    </div>
  );
}
