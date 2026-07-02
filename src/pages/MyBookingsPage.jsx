import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket, Calendar, MapPin, Clock, Car, XCircle, CheckCircle, AlertTriangle,
  ArrowRight, Filter, Edit3, X, Star, MessageSquare, Save, Ban, ThumbsUp,
  Pencil, Info
} from 'lucide-react';
import { useBookingStore, useToastStore, useChatStore } from '../store';
import SkeletonLoader from '../components/SkeletonLoader';

const REVIEW_TAGS = [
  'Clean Vehicle', 'On Time', 'Polite Driver', 'Comfortable Ride',
  'Good AC', 'Safe Driving', 'Smooth Journey', 'Value for Money',
  'Late Arrival', 'Rough Driving', 'Dirty Vehicle', 'Rude Staff',
];

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { startPeerChat } = useChatStore();
  const {
    bookings, isLoading, cancelBooking, completeBooking, modifyBooking,
    canModifyBooking, submitReview, skipReview, payForBooking
  } = useBookingStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null);

  const handlePayNow = async (bookingId) => {
    const res = await payForBooking(bookingId);
    if (res.success) addToast('Payment successful! Booking confirmed. 🎉', 'success');
    else addToast(res.error, 'error');
  };

  // Modify modal state
  const [modifyModal, setModifyModal] = useState(null);
  const [modifyForm, setModifyForm] = useState({});
  const [modifyError, setModifyError] = useState(null);

  // Review modal state
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTags, setReviewTags] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const filtered = activeTab === 'all' ? (bookings || [])
    : (bookings || []).filter(b => b.status === activeTab);

  // Check for pending reviews
  const pendingReviews = (bookings || []).filter(b => b.reviewPending);

  const handleCancel = (bookingId) => {
    setCancellingId(bookingId);
    setTimeout(() => {
      const result = cancelBooking(bookingId);
      if (result) {
        addToast(
          result.cancellationFee > 0
            ? `Booking cancelled. ₹${result.refundAmount} refunded (₹30 fee deducted)`
            : `Booking cancelled. Full refund of ₹${result.refundAmount} to wallet`,
          'success'
        );
      }
      setCancellingId(null);
      setShowCancelModal(null);
    }, 1000);
  };

  // Open modify modal
  const openModify = (booking) => {
    const check = canModifyBooking(booking.id);
    if (!check.allowed) {
      setModifyError(check.reason);
      setModifyModal(booking);
      setModifyForm({});
      return;
    }
    setModifyError(null);
    setModifyModal(booking);
    setModifyForm({
      name: booking.passengerDetails.name || '',
      age: booking.passengerDetails.age || '',
      bloodGroup: booking.passengerDetails.bloodGroup || '',
      aadhar: booking.passengerDetails.aadhar || '',
      pan: booking.passengerDetails.pan || '',
      luggageKg: booking.luggageKg || 0,
    });
  };

  const handleModify = () => {
    const result = modifyBooking(modifyModal.id, modifyForm);
    if (result?.error) {
      addToast(result.error, 'error');
    } else {
      addToast('Booking details updated successfully! ✏️', 'success');
      setModifyModal(null);
    }
  };

  // Complete journey (demo)
  const handleCompleteJourney = (bookingId) => {
    completeBooking(bookingId);
    addToast('Journey completed! Please rate your experience. ⭐', 'success');
  };

  // Open review modal
  const openReview = (booking) => {
    setReviewModal(booking);
    setReviewRating(0);
    setReviewHover(0);
    setReviewComment('');
    setReviewTags([]);
  };

  const handleSubmitReview = () => {
    if (reviewRating === 0) {
      addToast('Please select a rating', 'warning');
      return;
    }
    setIsSubmittingReview(true);
    setTimeout(() => {
      submitReview(reviewModal.id, reviewRating, reviewComment, reviewTags);
      addToast('Thank you for your feedback! 🙏', 'success');
      setReviewModal(null);
      setIsSubmittingReview(false);
    }, 1200);
  };

  const handleSkipReview = (bookingId) => {
    skipReview(bookingId);
    addToast('Review skipped. You can still leave a review anytime.', 'info');
  };

  const toggleTag = (tag) => {
    setReviewTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return <span className="badge badge-success"><CheckCircle size={12} /> Confirmed</span>;
      case 'cancelled': return <span className="badge badge-danger"><XCircle size={12} /> Cancelled</span>;
      case 'completed': return <span className="badge badge-teal"><CheckCircle size={12} /> Completed</span>;
      case 'pending_owner_approval': return <span className="badge badge-warning"><Clock size={12} /> Awaiting Approval</span>;
      case 'approved_awaiting_payment': return <span className="badge badge-teal" style={{background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', borderColor: '#2ecc71'}}><CheckCircle size={12} /> Ready to Pay</span>;
      case 'rejected_by_owner': return <span className="badge badge-danger"><Ban size={12} /> Rejected</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  const ratingLabels = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>View and manage your trip bookings</p>
      </div>

      {/* Pending Review Banner */}
      {pendingReviews.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.12), rgba(155, 89, 182, 0.12))',
          border: '1px solid rgba(244, 162, 97, 0.2)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14,
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(244, 162, 97, 0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={20} color="var(--color-accent-amber)" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {pendingReviews.length} journey{pendingReviews.length > 1 ? 's' : ''} awaiting your review!
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
              Your feedback helps us improve. Please rate your experience.
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openReview(pendingReviews[0])}>
            <Star size={14} /> Leave Review
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'all', label: `All (${bookings.length})` },
          { id: 'confirmed', label: 'Active' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map(tab => (
          <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <SkeletonLoader type="list" count={4} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Ticket size={36} /></div>
          <h3>No bookings yet</h3>
          <p>Search for trips and book your first journey!</p>
          <button className="btn btn-primary" onClick={() => navigate('/search')}>Search Trips</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger-children">
          {filtered.map(booking => (
            <div key={booking.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Booking ID</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{booking.id}</div>
                  {booking.modifiedAt && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-accent-amber)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Pencil size={10} /> Modified {new Date(booking.modifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {getStatusBadge(booking.status)}
              </div>

              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <MapPin size={16} color="var(--color-accent-teal-light)" />
                    <span style={{ fontWeight: 600 }}>{booking.route.from}</span>
                    <ArrowRight size={14} color="var(--color-text-tertiary)" />
                    <span style={{ fontWeight: 600 }}>{booking.route.to}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                    <span><Calendar size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />{booking.route.date}</span>
                    <span><Clock size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />{booking.route.departureTime}</span>
                    <span><Car size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />{booking.vehicle?.type}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent-teal-light)' }}>
                    ₹{booking.totalAmount}
                  </div>
                  {booking.isAgentBooking && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-amber)' }}>
                      Agent commission: ₹{booking.commissionAmount}
                    </div>
                  )}
                  {booking.status === 'cancelled' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-green)' }}>
                      Refunded: ₹{booking.refundAmount}
                      {booking.cancellationFee > 0 && ` (₹${booking.cancellationFee} fee)`}
                    </div>
                  )}
                </div>
              </div>

              {/* Passenger details */}
              <div style={{
                marginTop: 12, padding: 12, background: 'var(--color-surface)',
                borderRadius: 'var(--radius-sm)', fontSize: '0.875rem',
                display: 'flex', gap: 16, flexWrap: 'wrap'
              }}>
                <span>Passenger: <strong>{booking.passengerDetails.name}</strong></span>
                {booking.passengerDetails.age && <span>Age: <strong>{booking.passengerDetails.age}</strong></span>}
                {booking.passengerDetails.bloodGroup && <span>Blood: <strong>{booking.passengerDetails.bloodGroup}</strong></span>}
                <span>Luggage: <strong>{booking.luggageKg}kg</strong></span>
              </div>

              {/* Review display (completed bookings with review) */}
              {booking.review && (
                <div style={{
                  marginTop: 12, padding: 12, background: 'rgba(244, 162, 97, 0.08)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 162, 97, 0.15)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent-amber)' }}>Your Review</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14}
                          fill={s <= booking.review.rating ? '#f4a261' : 'transparent'}
                          color={s <= booking.review.rating ? '#f4a261' : 'var(--color-text-tertiary)'}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      ({ratingLabels[booking.review.rating]})
                    </span>
                  </div>
                  {booking.review.comment && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, fontStyle: 'italic' }}>
                      "{booking.review.comment}"
                    </p>
                  )}
                  {booking.review.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {booking.review.tags.map(t => (
                        <span key={t} style={{
                          background: 'rgba(244, 162, 97, 0.15)', padding: '2px 8px',
                          borderRadius: 'var(--radius-full)', fontSize: '0.65rem',
                          color: 'var(--color-accent-amber)',
                        }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {booking.status === 'approved_awaiting_payment' && (
                  <button className="btn btn-primary btn-sm" style={{ background: '#2ecc71', borderColor: '#2ecc71' }}
                    onClick={() => handlePayNow(booking.id)}>
                    <CheckCircle size={14} /> Pay Now
                  </button>
                )}
                
                {booking.status === 'pending_owner_approval' && (
                  <button className="btn btn-danger btn-sm" onClick={() => setShowCancelModal(booking.id)}>
                    Cancel Request
                  </button>
                )}

                {booking.status === 'confirmed' && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => startPeerChat(booking.id, booking.vehicle?.ownerId || 'driver', booking.vehicle?.ownerName || 'Driver')}>
                      <MessageSquare size={14} /> Chat with Driver
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => openModify(booking)}>
                      <Edit3 size={14} /> Modify Details
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tracking')}>
                      Track Vehicle
                    </button>
                    <button className="btn btn-primary btn-sm" style={{ background: 'var(--color-accent-green)', borderColor: 'var(--color-accent-green)' }}
                      onClick={() => handleCompleteJourney(booking.id)}>
                      <CheckCircle size={14} /> Mark Completed
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => setShowCancelModal(booking.id)}>
                      Cancel Booking
                    </button>
                  </>
                )}

                {booking.status === 'completed' && booking.reviewPending && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => openReview(booking)}>
                      <Star size={14} /> Leave Review
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleSkipReview(booking.id)}>
                      Skip
                    </button>
                  </>
                )}

                {booking.status === 'completed' && !booking.reviewPending && !booking.review && (
                  <button className="btn btn-secondary btn-sm" onClick={() => openReview(booking)}>
                    <MessageSquare size={14} /> Write Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== CANCEL CONFIRMATION MODAL ===== */}
      {showCancelModal && (
        <div className="modal-backdrop" onClick={() => setShowCancelModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cancel Booking?</h3>
              <button className="modal-close" onClick={() => setShowCancelModal(null)}>
                <XCircle size={18} />
              </button>
            </div>

            <div style={{
              padding: 16, background: 'rgba(244, 162, 97, 0.1)',
              borderRadius: 'var(--radius-md)', marginBottom: 16,
              border: '1px solid rgba(244, 162, 97, 0.2)',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--color-accent-amber)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={16} /> Cancellation Policy
              </div>
              <ul style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', paddingLeft: 20 }}>
                <li style={{ marginBottom: 4 }}>Within 24 hours of journey: <strong>₹30 deduction</strong>, rest refunded to wallet</li>
                <li>More than 24 hours before journey: <strong>Full refund</strong> to wallet</li>
              </ul>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
              Are you sure you want to cancel this booking? The refund will be credited to your wallet.
            </p>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(null)}>Keep Booking</button>
              <button className="btn btn-danger"
                onClick={() => handleCancel(showCancelModal)}
                disabled={cancellingId === showCancelModal}
              >
                {cancellingId === showCancelModal
                  ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : 'Yes, Cancel & Refund'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODIFY BOOKING MODAL ===== */}
      {modifyModal && (
        <div className="modal-backdrop" onClick={() => setModifyModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title"><Edit3 size={18} /> Modify Booking — {modifyModal.id}</h3>
              <button className="modal-close" onClick={() => setModifyModal(null)}><X size={18} /></button>
            </div>

            {/* 2-hour restriction warning */}
            {modifyError ? (
              <>
                <div style={{
                  padding: 20, background: 'rgba(231, 76, 60, 0.1)',
                  borderRadius: 'var(--radius-md)', border: '1px solid rgba(231, 76, 60, 0.2)',
                  textAlign: 'center', marginBottom: 16,
                }}>
                  <Ban size={36} color="var(--color-accent-red)" style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: 'var(--color-accent-red)' }}>
                    Modification Not Allowed
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {modifyError}
                  </p>
                </div>
                <div style={{
                  padding: '12px 16px', background: 'rgba(244, 162, 97, 0.08)',
                  borderRadius: 'var(--radius-md)', border: '1px solid rgba(244, 162, 97, 0.15)',
                  fontSize: '0.8rem', color: 'var(--color-accent-amber)', marginBottom: 16,
                }}>
                  <Info size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  Booking details can only be modified at least <strong>2 hours before</strong> the scheduled departure time.
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setModifyModal(null)}>Close</button>
                </div>
              </>
            ) : (
              <>
                {/* Modification allowed info */}
                <div style={{
                  padding: '10px 14px', background: 'rgba(46, 204, 113, 0.08)',
                  borderRadius: 'var(--radius-md)', border: '1px solid rgba(46, 204, 113, 0.15)',
                  fontSize: '0.8rem', color: 'var(--color-accent-green)', marginBottom: 16,
                }}>
                  <CheckCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  You can modify this booking. Changes are allowed up to <strong>2 hours before departure</strong>.
                </div>

                {/* Route info (non-editable) */}
                <div style={{
                  padding: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
                  marginBottom: 16, fontSize: '0.85rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} color="var(--color-accent-teal-light)" />
                    <strong>{modifyModal.route.from}</strong>
                    <ArrowRight size={12} />
                    <strong>{modifyModal.route.to}</strong>
                    <span style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                      {modifyModal.route.date} • {modifyModal.route.departureTime}
                    </span>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="form-group">
                  <label className="form-label">Passenger Name</label>
                  <input className="form-input" value={modifyForm.name || ''}
                    onChange={e => setModifyForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input className="form-input" type="number" value={modifyForm.age || ''}
                      onChange={e => setModifyForm(f => ({ ...f, age: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select className="form-select" value={modifyForm.bloodGroup || ''}
                      onChange={e => setModifyForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                      <option value="">Select</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Aadhar Number</label>
                    <input className="form-input" value={modifyForm.aadhar || ''}
                      placeholder="XXXX XXXX XXXX"
                      onChange={e => setModifyForm(f => ({ ...f, aadhar: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Number</label>
                    <input className="form-input" value={modifyForm.pan || ''}
                      placeholder="ABCDE1234F"
                      onChange={e => setModifyForm(f => ({ ...f, pan: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Luggage (kg)</label>
                  <input className="form-input" type="number" min={0} max={50}
                    value={modifyForm.luggageKg || 0}
                    onChange={e => setModifyForm(f => ({ ...f, luggageKg: parseInt(e.target.value) || 0 }))} />
                </div>

                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setModifyModal(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleModify}>
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== REVIEW / FEEDBACK MODAL ===== */}
      {reviewModal && (
        <div className="modal-backdrop" onClick={() => setReviewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title"><Star size={18} /> Rate Your Journey</h3>
              <button className="modal-close" onClick={() => setReviewModal(null)}><X size={18} /></button>
            </div>

            {/* Journey info */}
            <div style={{
              padding: 14, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                background: 'rgba(27, 153, 139, 0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Car size={20} color="var(--color-accent-teal-light)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {reviewModal.route.from} → {reviewModal.route.to}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  {reviewModal.route.date} • {reviewModal.vehicle?.type} • {reviewModal.vehicle?.registrationNumber}
                </div>
              </div>
            </div>

            {/* Star Rating */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 10, color: 'var(--color-text-secondary)' }}>
                How was your experience?
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s}
                    onMouseEnter={() => setReviewHover(s)}
                    onMouseLeave={() => setReviewHover(0)}
                    onClick={() => setReviewRating(s)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      transform: (reviewHover >= s || reviewRating >= s) ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 150ms ease',
                      padding: 4,
                    }}>
                    <Star size={32}
                      fill={(reviewHover || reviewRating) >= s ? '#f4a261' : 'transparent'}
                      color={(reviewHover || reviewRating) >= s ? '#f4a261' : 'var(--color-text-tertiary)'}
                    />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <div style={{
                  fontSize: '1rem', fontWeight: 700,
                  color: reviewRating >= 4 ? 'var(--color-accent-green)' : reviewRating >= 3 ? 'var(--color-accent-amber)' : 'var(--color-accent-red)',
                }}>
                  {ratingLabels[reviewRating]}
                </div>
              )}
            </div>

            {/* Quick Tags */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                What went well? (select all that apply)
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {REVIEW_TAGS.map(tag => (
                  <button key={tag}
                    className={`btn btn-sm ${reviewTags.includes(tag) ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => toggleTag(tag)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="form-group">
              <label className="form-label">Tell us more (optional)</label>
              <textarea className="form-input" rows={3}
                placeholder="Share your experience... What did you like? What can we improve?"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                style={{ resize: 'vertical', minHeight: 80 }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => {
                handleSkipReview(reviewModal.id);
                setReviewModal(null);
              }} style={{ marginRight: 'auto' }}>
                Skip for now
              </button>
              <button className="btn btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating === 0}>
                {isSubmittingReview
                  ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : <><ThumbsUp size={16} /> Submit Review</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
