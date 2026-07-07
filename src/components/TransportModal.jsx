import React, { useState, useEffect } from 'react';
import { X, Plane, TrainFront, Bell, CheckCircle2, Sparkles } from 'lucide-react';
import { useTransportModalStore, useToastStore, useAuthStore } from '../store';
import { supabase } from '../supabaseClient';

export default function TransportModal() {
  const { activeModal, closeModal } = useTransportModalStore();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFlight = activeModal === 'flights';

  useEffect(() => {
    setNotified(false);
    if (!activeModal || !user?.id) return;
    const featureName = activeModal === 'flights' ? 'flights' : 'trains';
    supabase
      .from('feature_interest')
      .select('id')
      .eq('user_id', String(user.id))
      .eq('feature_name', featureName)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setNotified(true);
      });
  }, [activeModal, user?.id]);

  if (!activeModal) return null;

  const handleNotify = async () => {
    if (notified || loading) return;
    setLoading(true);
    const userId = user?.id || 'guest';
    const featureName = isFlight ? 'flights' : 'trains';
    
    await supabase.from('feature_interest').insert({
      user_id: String(userId),
      feature_name: featureName,
      subscribed_at: new Date().toISOString()
    }).catch(e => console.warn('Could not log feature interest:', e));

    addToast(
      isFlight
        ? "We'll let you know as soon as flight booking opens!"
        : "We'll let you know as soon as train booking opens!",
      "success"
    );
    setNotified(true);
    setLoading(false);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        onClick={closeModal}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 450,
        }}
        className="animate-fade-in"
      />

      {/* Centered Modal Box */}
      <div
        className="glass-card animate-fade-in text-left transition-all"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 451,
          width: '90%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '32px 28px',
          background: 'linear-gradient(145deg, rgba(15, 25, 54, 0.98), rgba(9, 15, 33, 0.99))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 40px rgba(20, 184, 166, 0.15)'
        }}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center my-4">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl border relative ${
              isFlight
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-400'
                : 'bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border-indigo-500/40 text-indigo-400'
            }`}
          >
            {isFlight ? <Plane size={40} className="animate-bounce" /> : <TrainFront size={40} className="animate-bounce" />}
            <div className="absolute -top-2 -right-2 bg-white/10 border border-white/20 p-1.5 rounded-full shadow-md">
              <Sparkles size={14} className={isFlight ? 'text-amber-300' : 'text-indigo-300'} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border mb-3 bg-white/5 border-white/10 text-white/80">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isFlight ? 'bg-amber-400' : 'bg-indigo-400'}`}></span>
            <span>Coming Soon</span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight leading-snug mb-3">
            {isFlight
              ? "Flight bookings are landing soon on YatraGo!"
              : "Train ticket booking is on track to arrive soon!"}
          </h3>

          <p className="text-sm text-white/70 font-medium leading-relaxed max-w-[340px] mb-8">
            {isFlight
              ? "We are building a seamless flight reservation experience across top domestic and international airlines. Stay tuned for exclusive launch offers!"
              : "We are integrating with IRCTC to bring effortless train ticket bookings, instant seat layouts, and live PNR status right to your dashboard."}
          </p>

          <button
            onClick={handleNotify}
            disabled={notified || loading}
            className={`w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl transition-all duration-300 ${
              notified
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                : isFlight
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black hover:scale-[1.02] shadow-amber-500/20'
                  : 'bg-gradient-to-r from-indigo-400 to-indigo-500 hover:from-indigo-300 hover:to-indigo-400 text-black hover:scale-[1.02] shadow-indigo-500/20'
            }`}
          >
            {notified ? (
              <>
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span>You're on the list! ✓</span>
              </>
            ) : (
              <>
                <Bell size={18} />
                <span>{loading ? 'Saving...' : 'Notify Me When Live'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
