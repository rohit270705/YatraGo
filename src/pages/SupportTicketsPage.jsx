import { useState, useEffect } from 'react';
import { useAuthStore, useToastStore, useSupportStore } from '../store';
import { Plus, MessageSquare, Clock, CheckCircle } from 'lucide-react';

export default function SupportTicketsPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { tickets, fetchAllTickets, fetchUserTickets, createTicket, addMessage, isLoading } = useSupportStore();

  const [activeTab, setActiveTab] = useState('open'); // open, resolved
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  
  // New ticket modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('booking');
  const [newPriority, setNewPriority] = useState('medium');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        fetchAllTickets();
      } else {
        fetchUserTickets(user.id);
      }
    }
  }, [user, fetchAllTickets, fetchUserTickets]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      addToast('Subject and message are required', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const { success, error } = await createTicket({
      user_id: user.id,
      subject: newSubject,
      category: newCategory,
      priority: newPriority,
      messages_json: [{ sender_role: 'user', content: newMessage, timestamp: new Date().toISOString() }]
    });
    
    setIsSubmitting(false);
    
    if (success) {
      addToast('Support ticket created successfully', 'success');
      setShowNewModal(false);
      setNewSubject('');
      setNewMessage('');
    } else {
      addToast(error || 'Failed to create ticket', 'error');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicketId) return;
    
    const { success, error } = await addMessage(selectedTicketId, {
      sender_role: 'user',
      content: replyText,
      timestamp: new Date().toISOString()
    });
    
    if (success) {
      setReplyText('');
    } else {
      addToast(error || 'Failed to send message', 'error');
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'open') return ['open', 'in_progress'].includes(t.status);
    return ['resolved', 'closed'].includes(t.status);
  });

  return (
    <div className="app-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Support & Help Desk</h1>
          <p>Get help with your bookings, payments, and account</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
          <Plus size={18} /> New Ticket
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'open' ? 'active' : ''}`} onClick={() => setActiveTab('open')}>
          Open & In Progress
        </button>
        <button className={`tab ${activeTab === 'resolved' ? 'active' : ''}`} onClick={() => setActiveTab('resolved')}>
          Resolved & Closed
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, height: '600px' }}>
        {/* Ticket List */}
        <div className="glass-card" style={{ width: 350, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No tickets found in this category.</div>
            ) : (
              filteredTickets.map(t => (
                <div key={t.id} 
                  onClick={() => setSelectedTicketId(t.id)}
                  style={{ 
                    padding: 16, borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                    background: selectedTicketId === t.id ? 'var(--color-bg-secondary)' : 'transparent',
                    borderLeft: selectedTicketId === t.id ? '3px solid var(--color-primary)' : '3px solid transparent'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.subject}</div>
                    <span className={`badge ${
                      t.status === 'open' ? 'badge-primary' : 
                      t.status === 'in_progress' ? 'badge-warning' : 
                      'badge-success'
                    }`} style={{ fontSize: '0.65rem' }}>{t.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    <span>ID: {t.id.slice(0,8).toUpperCase()}</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details & Chat */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {selectedTicketId ? (
            <>
              {(() => {
                const activeTicket = tickets.find(t => t.id === selectedTicketId);
                return (
                  <>
                    <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
                      <h3 style={{ margin: '0 0 8px 0' }}>{activeTicket.subject}</h3>
                      <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <span>Category: <strong style={{ textTransform: 'capitalize' }}>{activeTicket.category}</strong></span>
                        <span>Priority: <strong style={{ textTransform: 'capitalize', color: activeTicket.priority === 'urgent' ? 'var(--color-accent-red)' : 'inherit' }}>{activeTicket.priority}</strong></span>
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {(activeTicket.messages_json || []).map((m, idx) => (
                        <div key={idx} style={{ 
                          alignSelf: m.sender_role === 'user' ? 'flex-end' : 'flex-start',
                          background: m.sender_role === 'user' ? 'var(--gradient-primary)' : 'var(--color-bg-secondary)',
                          color: m.sender_role === 'user' ? 'white' : 'inherit',
                          padding: '12px 16px', borderRadius: '16px', maxWidth: '80%',
                          borderBottomRightRadius: m.sender_role === 'user' ? '4px' : '16px',
                          borderBottomLeftRadius: m.sender_role === 'user' ? '16px' : '4px',
                        }}>
                          <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.content}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 6, textAlign: 'right' }}>
                            {m.sender_role === 'user' ? 'You' : 'YatraGo Support'} &bull; {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {['open', 'in_progress'].includes(activeTicket.status) ? (
                      <div style={{ padding: 16, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12 }}>
                        <input type="text" className="form-input" style={{ flex: 1 }} placeholder="Type a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => {
                          if (e.key === 'Enter') handleReply();
                        }} />
                        <button className="btn btn-primary" onClick={handleReply} disabled={!replyText.trim()}><MessageSquare size={18} /> Send</button>
                      </div>
                    ) : (
                      <div style={{ padding: 16, borderTop: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-secondary)' }}>
                        This ticket is {activeTicket.status}. You cannot send new messages.
                      </div>
                    )}
                  </>
                )
              })()}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <div>Select a ticket to view conversation</div>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <h3 style={{ marginBottom: 24 }}>Create Support Ticket</h3>
            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" className="form-input" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Briefly describe the issue..." required />
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                    <option value="booking">Booking Issue</option>
                    <option value="payment">Payment/Refund</option>
                    <option value="technical">Technical Issue</option>
                    <option value="feedback">Feedback/Complaint</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input" rows="4" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Provide as much detail as possible..." required></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
