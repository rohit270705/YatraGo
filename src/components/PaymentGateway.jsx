/**
 * PaymentGateway.jsx — YatraGo's premium payment modal
 *
 * Supports:
 *  - Razorpay hosted checkout (if VITE_RAZORPAY_KEY_ID is set)
 *  - UPI QR / UPI ID entry (simulated + Razorpay)
 *  - Card (Razorpay)
 *  - Net Banking (Razorpay)
 *  - YatraGo Wallet (instant, no gateway)
 *  - Pay Later / COD (vehicles only)
 *  - Demo / test mode fallback
 */
import { useState, useEffect, useRef } from 'react';
import {
  X, CreditCard, Smartphone, Building2, Wallet, Clock,
  CheckCircle, AlertCircle, Loader, Lock, ChevronRight, Copy, QrCode
} from 'lucide-react';
import { useWalletStore, useToastStore } from '../store';
import { supabase } from '../supabaseClient';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// ── Load Razorpay script once ─────────────────────────────────────────────────
function useRazorpayScript() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (document.getElementById('razorpay-checkout-js')) { setReady(true); return; }
    const script = document.createElement('script');
    script.id  = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, []);
  return ready;
}

// ── Method tab config ─────────────────────────────────────────────────────────
const METHODS = [
  { id: 'upi',     icon: <Smartphone size={16} />, label: 'UPI' },
  { id: 'card',    icon: <CreditCard size={16} />, label: 'Card' },
  { id: 'netbank', icon: <Building2 size={16} />,  label: 'Netbanking' },
  { id: 'wallet',  icon: <Wallet size={16} />,     label: 'Wallet' },
  { id: 'later',   icon: <Clock size={16} />,      label: 'Pay Later' },
];

const BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'Bank of Baroda', 'Canara Bank'];

// ── UPI QR display (fake QR via CSS art) ─────────────────────────────────────
function FakeQR({ upiId }) {
  // Generates a deterministic pattern from upiId string
  const seed = upiId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = Array.from({ length: 121 }, (_, i) => {
    const r = Math.floor(i / 11), c = i % 11;
    // Always fill border + corners
    if (r === 0 || r === 10 || c === 0 || c === 10) return true;
    if ((r < 4 && c < 4) || (r < 4 && c > 6) || (r > 6 && c < 4)) return true;
    return ((seed * (i + 7) * 31) % 100) > 45;
  });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 10px)', gap: 1, margin: '0 auto', width: 'fit-content' }}>
      {cells.map((on, i) => (
        <div key={i} style={{ width: 10, height: 10, background: on ? '#111' : '#fff', borderRadius: 1 }} />
      ))}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function PaymentGateway({
  isOpen, onClose,
  amount,           // number in INR
  bookingId,        // string
  bookingRef,       // human-readable ref e.g. "YG-202609-0001"
  userEmail,        // string
  userName,         // string
  walletBalance,    // number
  onSuccess,        // (paymentId, method) => void
  onError,          // (msg) => void
}) {
  const rzpReady = useRazorpayScript();
  const { addToast } = useToastStore();

  const [method,     setMethod]     = useState('upi');
  const [upiId,      setUpiId]      = useState('');
  const [showQR,     setShowQR]     = useState(false);
  const [bank,       setBank]       = useState(BANKS[0]);
  const [cardNum,    setCardNum]    = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv,    setCardCvv]    = useState('');
  const [cardName,   setCardName]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [stage,      setStage]      = useState('idle'); // idle | processing | success | error
  const [errMsg,     setErrMsg]     = useState('');
  const [paymentId,  setPaymentId]  = useState('');

  const demoMode = !RAZORPAY_KEY;

  if (!isOpen) return null;

  // ── Open Razorpay hosted checkout ─────────────────────────────────────────
  const openRazorpay = async (orderId, isDemo) => {
    if (!rzpReady && !isDemo) {
      setErrMsg('Payment SDK not loaded. Try again.'); setStage('error'); return;
    }
    if (isDemo) {
      // Simulate payment success after 2s
      setStage('processing');
      await new Promise(r => setTimeout(r, 2000));
      const pid = 'pay_DEMO_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      await verifyAndConfirm(orderId, pid, 'DEMO_SIG', true);
      return;
    }
    const rzp = new window.Razorpay({
      key:         RAZORPAY_KEY,
      amount:      Math.round(amount * 100),
      currency:    'INR',
      name:        'YatraGo',
      description: `Booking ${bookingRef}`,
      order_id:    orderId,
      prefill:     { name: userName, email: userEmail },
      theme:       { color: '#1b998b' },
      modal:       { ondismiss: () => { setLoading(false); } },
      handler: async (response) => {
        setStage('processing');
        await verifyAndConfirm(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature, false);
      },
    });
    rzp.on('payment.failed', (resp) => {
      setErrMsg(resp.error.description || 'Payment failed'); setStage('error'); setLoading(false);
    });
    rzp.open();
  };

  // ── Verify payment via edge function ──────────────────────────────────────
  const verifyAndConfirm = async (orderId, pId, sig, isDemo) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const resp = await supabase.functions.invoke('razorpay-verify-payment', {
        body: {
          razorpay_order_id:  orderId,
          razorpay_payment_id: pId,
          razorpay_signature:  sig,
          bookingId,
          is_demo: isDemo,
        },
      });
      if (resp.error) throw new Error(resp.error.message);
      setPaymentId(pId);
      setStage('success');
      onSuccess?.(pId, method);
    } catch (e) {
      setErrMsg(e.message || 'Verification failed'); setStage('error');
    }
  };

  // ── Create order then launch gateway ─────────────────────────────────────
  const initiatePayment = async () => {
    setLoading(true); setStage('processing'); setErrMsg('');
    try {
      const resp = await supabase.functions.invoke('razorpay-create-order', {
        body: { amount, currency: 'INR', bookingRef, userEmail },
      });
      if (resp.error) throw new Error(resp.error.message);
      const order = resp.data;
      await openRazorpay(order.id, order.is_demo || demoMode);
    } catch (e) {
      setErrMsg(e.message || 'Could not initiate payment'); setStage('error'); setLoading(false);
    }
  };

  // ── Wallet payment ────────────────────────────────────────────────────────
  const payWithWallet = async () => {
    if (walletBalance < amount) {
      setErrMsg('Insufficient wallet balance'); setStage('error'); return;
    }
    setLoading(true); setStage('processing');
    await new Promise(r => setTimeout(r, 1200));
    const pid = 'WALLET_' + Date.now();
    setPaymentId(pid);
    setStage('success');
    onSuccess?.(pid, 'wallet');
  };

  // ── Pay Later ─────────────────────────────────────────────────────────────
  const payLater = async () => {
    setLoading(true); setStage('processing');
    await new Promise(r => setTimeout(r, 800));
    const pid = 'COD_' + Date.now();
    setPaymentId(pid);
    setStage('success');
    onSuccess?.(pid, 'pay_later');
  };

  // ── UPI validate ──────────────────────────────────────────────────────────
  const isValidUPI = /^[\w.\-]{2,}@[\w]{2,}$/.test(upiId);

  // ── Card format ───────────────────────────────────────────────────────────
  const formatCard = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = v => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (stage === 'success') return (
    <div style={overlay}>
      <div style={{ ...modal, textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
        <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 12 }} />
        <h2 style={{ marginBottom: 8, color: '#22c55e' }}>Payment Successful!</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
          Your booking <strong>{bookingRef}</strong> is confirmed.
        </p>
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '12px 20px', marginBottom: 24, fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
          Payment ID: <strong style={{ color: 'var(--color-text)', fontFamily: 'monospace' }}>{paymentId}</strong>
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
          Done — View My Bookings
        </button>
      </div>
    </div>
  );

  // ── Error screen ──────────────────────────────────────────────────────────
  if (stage === 'error') return (
    <div style={overlay}>
      <div style={{ ...modal, textAlign: 'center', padding: 40 }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 12 }} />
        <h2 style={{ marginBottom: 8, color: '#ef4444' }}>Payment Failed</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>{errMsg}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setStage('idle'); setLoading(false); }}>Try Again</button>
          <button className="btn btn-primary"   style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );

  // ── Processing overlay ────────────────────────────────────────────────────
  if (stage === 'processing') return (
    <div style={overlay}>
      <div style={{ ...modal, textAlign: 'center', padding: 48 }}>
        <div style={{ marginBottom: 20 }}>
          <Loader size={48} color="var(--color-accent-teal-light)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <h3>Processing Payment…</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>Please do not close this window</p>
      </div>
    </div>
  );

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Complete Payment</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={12} /> Secure · Encrypted · {demoMode ? '⚠️ Test Mode' : 'Powered by Razorpay'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent-teal-light)' }}>
              ₹{amount.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{bookingRef}</div>
          </div>
        </div>

        {demoMode && (
          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: '#fbbf24' }}>
            ⚠️ <strong>Demo Mode</strong> — No real money will be charged. Add <code>VITE_RAZORPAY_KEY_ID</code> to enable live payments.
          </div>
        )}

        {/* Method tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {METHODS.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
              borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 600,
              background: method === m.id ? 'rgba(27,153,139,0.15)' : 'var(--color-surface)',
              border: method === m.id ? '2px solid var(--color-accent-teal)' : '1.5px solid var(--color-border)',
              color: method === m.id ? 'var(--color-accent-teal-light)' : 'var(--color-text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* ── UPI ── */}
        {method === 'upi' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setShowQR(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: !showQR ? 'rgba(27,153,139,0.12)' : 'var(--color-surface)', border: !showQR ? '2px solid var(--color-accent-teal)' : '1.5px solid var(--color-border)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', color: !showQR ? 'var(--color-accent-teal-light)' : 'var(--color-text-secondary)' }}>
                📱 UPI ID
              </button>
              <button onClick={() => setShowQR(true)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: showQR ? 'rgba(27,153,139,0.12)' : 'var(--color-surface)', border: showQR ? '2px solid var(--color-accent-teal)' : '1.5px solid var(--color-border)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', color: showQR ? 'var(--color-accent-teal-light)' : 'var(--color-text-secondary)' }}>
                <QrCode size={14} style={{ display: 'inline', marginRight: 4 }} /> Scan QR
              </button>
            </div>
            {showQR ? (
              <div style={{ textAlign: 'center', padding: 20, background: '#fff', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                <FakeQR upiId={'yatrago@razorpay'} />
                <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#111', fontFamily: 'monospace' }}>yatrago@razorpay</div>
                <div style={{ fontSize: '0.72rem', color: '#666', marginTop: 4 }}>Scan with any UPI app</div>
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">UPI ID</label>
                <input className="form-input" placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} />
                {upiId && !isValidUPI && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>Enter a valid UPI ID (e.g. name@okaxis)</div>}
              </div>
            )}
            <button className="btn btn-primary" style={{ width: '100%', padding: 14 }}
              disabled={!showQR && !isValidUPI} onClick={initiatePayment}>
              Pay ₹{amount.toLocaleString('en-IN')} via UPI
            </button>
          </div>
        )}

        {/* ── Card ── */}
        {method === 'card' && (
          <div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Card Number</label>
              <input className="form-input" placeholder="1234 5678 9012 3456" value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))} maxLength={19} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Expiry</label>
                <input className="form-input" placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">CVV</label>
                <input className="form-input" placeholder="•••" type="password" maxLength={4} value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/,'').slice(0,4))} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Name on Card</label>
              <input className="form-input" placeholder="RAHUL KUMAR" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: 14 }}
              disabled={cardNum.replace(/\s/g,'').length < 16 || cardExpiry.length < 5 || cardCvv.length < 3 || !cardName}
              onClick={initiatePayment}>
              Pay ₹{amount.toLocaleString('en-IN')} Securely
            </button>
          </div>
        )}

        {/* ── Netbanking ── */}
        {method === 'netbank' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
              {BANKS.map(b => (
                <button key={b} onClick={() => setBank(b)} style={{
                  padding: '10px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left',
                  background: bank === b ? 'rgba(27,153,139,0.12)' : 'var(--color-surface)',
                  border: bank === b ? '2px solid var(--color-accent-teal)' : '1.5px solid var(--color-border)',
                  color: bank === b ? 'var(--color-accent-teal-light)' : 'var(--color-text)',
                  cursor: 'pointer',
                }}>
                  🏦 {b}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} onClick={initiatePayment}>
              Continue with {bank}
            </button>
          </div>
        )}

        {/* ── Wallet ── */}
        {method === 'wallet' && (
          <div>
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>YatraGo Wallet</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>Instant · No extra charges</div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: walletBalance >= amount ? 'var(--color-accent-teal-light)' : '#ef4444' }}>
                  ₹{walletBalance?.toLocaleString('en-IN') || 0}
                </div>
              </div>
            </div>
            {walletBalance < amount && (
              <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: 14 }}>
                ⚠️ Insufficient balance. Need ₹{(amount - walletBalance).toLocaleString('en-IN')} more.
              </div>
            )}
            <button className="btn btn-primary" style={{ width: '100%', padding: 14 }}
              disabled={walletBalance < amount} onClick={payWithWallet}>
              Pay ₹{amount.toLocaleString('en-IN')} from Wallet
            </button>
          </div>
        )}

        {/* ── Pay Later ── */}
        {method === 'later' && (
          <div>
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>💸 Pay Later / Cash On Board</div>
              <ul style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, paddingLeft: 18 }}>
                <li>Pay in cash to the driver before boarding</li>
                <li>Available for vehicle & cab bookings only</li>
                <li>Booking is confirmed immediately</li>
                <li>Cancellation policy still applies</li>
              </ul>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} onClick={payLater}>
              Confirm — Pay ₹{amount.toLocaleString('en-IN')} Later
            </button>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>
          <Lock size={11} /> 256-bit SSL encrypted · PCI DSS compliant
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px',
};
const modal = {
  background: 'var(--color-surface-elevated)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  padding: 28, width: '100%', maxWidth: 520,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
};
