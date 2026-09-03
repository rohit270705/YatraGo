import { useState, useEffect } from 'react';
import {
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle,
  CreditCard, Smartphone, Building2, TrendingUp, Filter, Banknote
} from 'lucide-react';
import { useWalletStore, useToastStore, useAuthStore } from '../store';
import SkeletonLoader from '../components/SkeletonLoader';

export default function WalletPage() {
  const { balance, transactions, isLoading, addMoney, initializeWallet, requestWithdrawal } = useWalletStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [wBankAccount, setWBankAccount] = useState('');
  const [wIfscCode, setWIfscCode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('Debit/Credit Card');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  useEffect(() => {
    if (user) {
      initializeWallet(user.id);
    }
  }, [user, initializeWallet]);

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleAddMoney = async () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0) {
      addToast('Enter a valid amount', 'warning');
      return;
    }
    if (selectedPayment === 'Net Banking') {
      if (!bankAccount || !ifscCode) {
        addToast('Please enter Bank Account Number and IFSC Code', 'warning');
        return;
      }
    }
    setIsAdding(true);
    
    const success = await addMoney(amt);
    
    if (success) {
      addToast(`₹${amt.toLocaleString()} added to wallet!`, 'success');
      setShowAddMoney(false);
      setAmount('');
    } else {
      addToast('Failed to add money. Please try again.', 'error');
    }
    setIsAdding(false);
  };

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmount);
    if (!amt || amt <= 0) {
      addToast('Enter a valid withdrawal amount', 'warning');
      return;
    }
    if (amt > balance) {
      addToast('Insufficient wallet balance', 'warning');
      return;
    }
    if (!wBankAccount || !wIfscCode) {
      addToast('Please enter Bank Account Number/UPI and IFSC Code', 'warning');
      return;
    }
    setIsWithdrawing(true);
    const result = await requestWithdrawal(amt, wBankAccount, wIfscCode);
    if (result.success) {
      addToast(`Withdrawal request of ₹${amt.toLocaleString()} submitted successfully!`, 'success');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWBankAccount('');
      setWIfscCode('');
    } else {
      addToast(result.error || 'Withdrawal failed. Please try again.', 'error');
    }
    setIsWithdrawing(false);
  };

  const txnsList = Array.isArray(transactions) ? transactions : [];
  const safeBalance = Number(balance) || 0;

  const filteredTxns = filterType === 'all'
    ? txnsList
    : txnsList.filter(t => t && t.type === filterType);

  const getTxnIcon = (type) => {
    switch (type) {
      case 'WALLET_TOPUP': return <ArrowDownLeft size={18} color="var(--color-accent-green)" />;
      case 'TICKET_PAYMENT': return <ArrowUpRight size={18} color="var(--color-accent-red)" />;
      case 'TICKET_REFUND': return <ArrowDownLeft size={18} color="var(--color-accent-blue)" />;
      case 'AGENT_COMMISSION': return <ArrowDownLeft size={18} color="var(--color-accent-amber)" />;
      case 'WITHDRAWAL_REQUEST':
      case 'WITHDRAWAL': return <ArrowUpRight size={18} color="var(--color-accent-purple)" />;
      default: return <Clock size={18} />;
    }
  };

  const getTxnLabel = (type) => {
    switch (type) {
      case 'WALLET_TOPUP': return 'Money Added';
      case 'TICKET_PAYMENT': return 'Ticket Payment';
      case 'TICKET_REFUND': return 'Refund Received';
      case 'AGENT_COMMISSION': return 'Agent Commission';
      case 'WITHDRAWAL_REQUEST': return 'Withdrawal Request';
      case 'WITHDRAWAL': return 'Withdrawal Processed';
      default: return type || 'Transaction';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Wallet</h1>
        <p>Manage your funds and view transactions</p>
      </div>

      {/* Wallet Balance Card */}
      <div className="wallet-card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="wallet-balance-label">Available Balance</div>
        <div className="wallet-balance-amount">₹{safeBalance.toLocaleString('en-IN')}</div>
        <div className="wallet-actions">
          <button className="wallet-action-btn" onClick={() => setShowAddMoney(true)}>
            <Plus size={16} /> Add Money
          </button>
          <button className="wallet-action-btn" onClick={() => setShowWithdrawModal(true)}>
            <ArrowUpRight size={16} /> Withdraw
          </button>
          <button className="wallet-action-btn" onClick={() => {
            document.getElementById('transaction-history-section')?.scrollIntoView({ behavior: 'smooth' });
            setFilterType('all');
          }}>
            <TrendingUp size={16} /> Statement
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-card-icon green"><ArrowDownLeft size={20} /></div>
          <div className="stat-card-label">Total Added</div>
          <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>
            ₹{txnsList.filter(t => Number(t?.amount) > 0).reduce((s, t) => s + Number(t?.amount || 0), 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon red"><ArrowUpRight size={20} /></div>
          <div className="stat-card-label">Total Spent</div>
          <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>
            ₹{Math.abs(txnsList.filter(t => Number(t?.amount) < 0).reduce((s, t) => s + Number(t?.amount || 0), 0)).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><Clock size={20} /></div>
          <div className="stat-card-label">Transactions</div>
          <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{txnsList.length}</div>
        </div>
      </div>

      {/* Transaction History */}
      <div id="transaction-history-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700 }}>Transaction History</h3>
        <select className="form-select" style={{ width: 'auto', padding: '8px 36px 8px 12px' }}
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="WALLET_TOPUP">Top-ups</option>
          <option value="TICKET_PAYMENT">Payments</option>
          <option value="TICKET_REFUND">Refunds</option>
          <option value="AGENT_COMMISSION">Commission</option>
          <option value="WITHDRAWAL_REQUEST">Withdrawals</option>
        </select>
      </div>

      {isLoading ? (
        <SkeletonLoader type="list" count={4} />
      ) : filteredTxns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Wallet size={36} /></div>
          <h3>No transactions</h3>
          <p>Your wallet transaction history will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredTxns.map(txn => {
            const amt = Number(txn?.amount || 0);
            const balAfter = Number(txn?.balance_after ?? txn?.balanceAfter ?? safeBalance);
            return (
              <div key={txn.id || Math.random()} className="glass-card" style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {getTxnIcon(txn.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{getTxnLabel(txn.type)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      {txn.description}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 700, fontSize: '1rem',
                      color: amt > 0 ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
                    }}>
                      {amt > 0 ? '+' : ''}₹{Math.abs(amt).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                      Bal: ₹{balAfter.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textAlign: 'right' }}>
                  {new Date(txn.created_at || txn.timestamp || Date.now()).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="modal-backdrop" onClick={() => setShowAddMoney(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Money to Wallet</h3>
              <button className="modal-close" onClick={() => setShowAddMoney(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Enter Amount (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={1}
                style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {quickAmounts.map(amt => (
                <button key={amt} className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                  onClick={() => setAmount(amt.toString())}>
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: CreditCard, label: 'Debit/Credit Card', desc: '•••• 4242' },
                  { icon: Smartphone, label: 'UPI', desc: 'user@upi' },
                  { icon: Building2, label: 'Net Banking', desc: 'All banks supported' },
                ].map((method, i) => {
                  const isSelected = selectedPayment === method.label;
                  return (
                    <div key={i}>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        background: isSelected ? 'rgba(27, 153, 139, 0.08)' : 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        border: isSelected ? '1px solid rgba(27, 153, 139, 0.3)' : 'var(--border-subtle)',
                      }}>
                        <input type="radio" name="payment" checked={isSelected} onChange={() => setSelectedPayment(method.label)} />
                        <method.icon size={20} color="var(--color-text-secondary)" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{method.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{method.desc}</div>
                        </div>
                      </label>
                      {isSelected && method.label === 'Net Banking' && (
                        <div className="animate-slide-up" style={{ marginTop: 12, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                          <div className="form-group" style={{ marginBottom: 12 }}>
                            <label className="form-label">Bank Account Number</label>
                            <input type="text" className="form-input" placeholder="e.g. 1234567890" value={bankAccount} onChange={e => setBankAccount(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">IFSC Code</label>
                            <input type="text" className="form-input" placeholder="e.g. HDFC0001234" value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddMoney(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddMoney} disabled={isAdding}>
                {isAdding
                  ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : `Add ₹${amount || '0'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-backdrop" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Withdraw from Wallet</h3>
              <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Available Balance: ₹{balance.toLocaleString()}</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter amount to withdraw"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                min={1}
                max={balance}
                style={{ fontSize: '1.3rem', fontWeight: 700, textAlign: 'center' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Account / UPI ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 9876543210@upi or 1234567890"
                value={wBankAccount}
                onChange={e => setWBankAccount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">IFSC Code / Bank Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SBIN0001234 or HDFC Bank"
                value={wIfscCode}
                onChange={e => setWIfscCode(e.target.value.toUpperCase())}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleWithdraw} disabled={isWithdrawing}>
                {isWithdrawing
                  ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : `Withdraw ₹${withdrawAmount || '0'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
