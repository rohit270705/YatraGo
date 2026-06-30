import { useState, useEffect } from 'react';
import { Star, Send, User } from 'lucide-react';
import { useReviewStore, useAuthStore, useToastStore } from '../store';

export default function ReviewSection({ targetType, targetId }) {
  const { reviews, fetchReviews, addReview, isLoading } = useReviewStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews(targetType, targetId);
  }, [targetType, targetId, fetchReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast('Please login to leave a review', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const { success, error } = await addReview({
      reviewer_id: user.id,
      target_type: targetType,
      target_id: targetId,
      rating,
      comment
    });
    
    setIsSubmitting(false);
    
    if (success) {
      addToast('Review submitted successfully!', 'success');
      setComment('');
      setRating(5);
    } else {
      addToast(error || 'Failed to submit review', 'error');
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="glass-card" style={{ marginTop: 24 }}>
      <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Star className="text-warning" fill="currentColor" size={20} /> 
        Reviews ({reviews.length})
      </h3>
      
      {reviews.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: 16, background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{averageRating}</div>
          <div>
            <div style={{ display: 'flex', color: 'var(--color-accent-yellow)' }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={16} fill={i <= Math.round(averageRating) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Based on {reviews.length} reviews</div>
          </div>
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 32, background: 'var(--color-bg-primary)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h4 style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.95rem' }}>Leave a Review</h4>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Rating</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: i <= rating ? 'var(--color-accent-yellow)' : 'var(--color-border)' }}
                >
                  <Star size={24} fill={i <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Comment (Optional)</label>
            <textarea
              className="form-input"
              rows="3"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell others about your experience..."
            ></textarea>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : <><Send size={16} /> Submit Review</>}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            No reviews yet. Be the first to review!
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {review.users?.avatar_url ? (
                      <img src={review.users.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={16} color="var(--color-text-tertiary)" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{review.users?.name || 'Anonymous'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{new Date(review.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', color: 'var(--color-accent-yellow)' }}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} fill={i <= review.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: 8 }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
