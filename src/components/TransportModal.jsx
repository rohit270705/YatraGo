import React from 'react';
import { X, Plane, TrainFront } from 'lucide-react';
import { useTransportModalStore, useToastStore } from '../store';

export default function TransportModal() {
  const { activeModal, closeModal } = useTransportModalStore();
  const { addToast } = useToastStore();

  if (!activeModal) return null;

  const isFlight = activeModal === 'flights';

  const handleNotify = () => {
    addToast(
      isFlight
        ? "We'll notify you when flight bookings go live! 🛫"
        : "We'll notify you when IRCTC train bookings go live! 🚂",
      "success"
    );
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="glass-card relative w-full max-w-[480px] rounded-2xl border border-white/15 p-6 shadow-2xl overflow-hidden bg-[#0b1329]/95 text-left transition-all"
        style={{
          background: 'rgba(11, 19, 41, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3.5 mb-4 pr-8">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md border ${
              isFlight
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
            }`}
          >
            {isFlight ? <Plane size={26} /> : <TrainFront size={26} />}
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{isFlight ? '✈️ Flight Booking' : '🚂 Train Booking'}</span>
            </h3>
            <div className="mt-1 flex items-center">
              <div
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                  isFlight
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    isFlight ? 'bg-amber-400' : 'bg-indigo-400'
                  }`}
                ></span>
                <span>Coming Soon</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/80 font-medium mb-5 leading-relaxed">
          {isFlight
            ? "Domestic flight booking across India is coming soon! We're working on integrating top airlines."
            : "Book train tickets across India via IRCTC — coming soon!"}
        </p>

        <div className="mb-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2.5">
            Popular Routes Preview
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {isFlight ? (
              ['Mumbai ✈ Delhi', 'Bangalore ✈ Kolkata', 'Chennai ✈ Hyderabad', 'Pune ✈ Jaipur'].map((route, i) => (
                <div
                  key={i}
                  className="bg-[#0f1936]/80 border border-white/5 rounded-xl p-3 flex items-center justify-between opacity-75 cursor-not-allowed"
                >
                  <span className="font-bold text-xs sm:text-sm text-white/90">{route}</span>
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Domestic
                  </span>
                </div>
              ))
            ) : (
              [
                { route: 'Mumbai → Delhi', train: 'Rajdhani Express' },
                { route: 'Pune → Bangalore', train: 'Udyan Express' },
                { route: 'Chennai → Hyderabad', train: 'Charminar Express' },
                { route: 'Kolkata → Jaipur', train: 'Express' }
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-[#0f1936]/80 border border-white/5 rounded-xl p-3 flex items-center justify-between opacity-75 cursor-not-allowed"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs sm:text-sm text-white/90 truncate">{item.route}</div>
                    <div className="text-[10px] text-white/50 font-medium truncate">{item.train}</div>
                  </div>
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                    IRCTC
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={handleNotify}
          className={`btn w-full py-3.5 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all text-black ${
            isFlight ? 'bg-[#14b8a6] hover:bg-[#0d9488]' : 'bg-[#818cf8] hover:bg-[#6366f1]'
          }`}
          style={{ backgroundColor: isFlight ? '#14b8a6' : '#818cf8', color: '#000000' }}
        >
          <span>Got it, notify me!</span>
        </button>
      </div>
    </div>
  );
}
