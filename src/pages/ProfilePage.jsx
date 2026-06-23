import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCircle, Mail, Phone, MapPin, Edit2, Check, ShieldCheck, CreditCard, Calendar, Activity } from 'lucide-react';
import { useAuthStore, useToastStore } from '../store';
import { supabase } from '../supabaseClient';

export default function ProfilePage() {
  const { user, updateProfile, linkGoogleAccount } = useAuthStore();
  const { addToast } = useToastStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    bloodGroup: '',
    dob: '',
    age: '',
    gender: '',
    address: '',
    aadharNumber: '',
    panNumber: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bloodGroup: user.bloodGroup || '',
        dob: user.dob || '',
        age: user.age || '',
        gender: user.gender || '',
        address: user.address || '',
        aadharNumber: user.aadharNumber || '',
        panNumber: user.panNumber || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.message) {
      addToast(location.state.message, 'info');
      setIsEditing(true);
      // Clean up the state so it doesn't fire again on re-render
      // But keep fromIncomplete flag so we know they need to complete it
      const newState = { ...location.state };
      delete newState.message;
      window.history.replaceState(newState, document.title);
    }
    
    // Check if Google is linked via Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.app_metadata?.provider === 'google' || 
          session?.user?.app_metadata?.providers?.includes('google')) {
        setIsGoogleLinked(true);
      }
    });
  }, [location.state, addToast]);

  const parseDateToCalculateAge = (val) => {
    if (!val) return '';
    let d = null;
    // Format: YYYY-MM-DD (Native picker)
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      d = new Date(val);
    } 
    // Format: DD-MM-YYYY or DD/MM/YYYY (Manual entry)
    else if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(val)) {
      const parts = val.split(/[-/]/);
      d = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    if (d && !isNaN(d.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
        age--;
      }
      return age > 0 ? age : 0;
    }
    return '';
  };

  const updateForm = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'dob') {
        next.age = parseDateToCalculateAge(value);
      }
      return next;
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        updateForm('avatarUrl', dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Absolutely enforce mandatory fields
    if (!form.phone || !form.dob || !form.bloodGroup) {
      addToast('Please complete Phone Number, Date of Birth, and Blood Group first.', 'error');
      return;
    }

    if (form.aadharNumber) {
      const aadharClean = form.aadharNumber.replace(/\s/g, '');
      if (!/^\d{12}$/.test(aadharClean)) {
        addToast('Invalid Aadhar Number. It must be exactly 12 digits.', 'error');
        return;
      }
    }

    if (form.panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(form.panNumber)) {
        addToast('Invalid PAN Number format. Example: ABCDE1234F', 'error');
        return;
      }
    }

    setIsLoading(true);
    const res = await updateProfile(form);
    setIsLoading(false);
    
    if (res.error) {
      addToast(res.error, 'error');
    } else {
      addToast('Profile updated successfully!', 'success');
      setIsEditing(false);
      
      if (location.state?.fromIncomplete) {
        const dest = user.role === 'admin' ? '/admin'
          : user.role === 'agent' ? '/agent'
          : user.role === 'owner' ? '/owner'
          : '/dashboard';
        navigate(dest, { replace: true });
      }
    }
  };

  if (!user) return null;

  return (
    <div className="app-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal details and account settings</p>
        </div>
        {!isEditing ? (
          <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
            <Edit2 size={18} /> Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => {
              setIsEditing(false);
              // Reset form
              setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                bloodGroup: user.bloodGroup || '',
                dob: user.dob || '',
                age: user.age || '',
                gender: user.gender || '',
                address: user.address || '',
                aadharNumber: user.aadharNumber || '',
                panNumber: user.panNumber || '',
                avatarUrl: user.avatarUrl || ''
              });
            }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}>
              {isLoading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Check size={18} />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="form-row">
        {/* Left Column - Core Identity */}
        <div className="glass-card" style={{ padding: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 800, color: 'white',
              marginBottom: 16, boxShadow: 'var(--shadow-glow-teal)',
              position: 'relative', overflow: 'hidden',
              cursor: isEditing ? 'pointer' : 'default',
              backgroundImage: form.avatarUrl ? `url(${form.avatarUrl})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center'
            }}>
              {!form.avatarUrl && (user.name ? user.name.charAt(0).toUpperCase() : <UserCircle size={56} />)}
              
              {isEditing && (
                <>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.5)', padding: '6px',
                    fontSize: '0.7rem', textAlign: 'center', color: 'white'
                  }}>Change</div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} 
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </>
              )}
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>{user.name}</h2>
            <div className="badge badge-teal" style={{ textTransform: 'capitalize' }}>{user.role}</div>
          </div>

          <div className="form-divider" />

          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--color-text-secondary)' }}>Basic Info</h3>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="form-input-icon-wrapper">
              <UserCircle className="form-input-icon" size={20} />
              <input type="text" className="form-input" 
                value={form.name} onChange={e => updateForm('name', e.target.value)} 
                disabled={!isEditing} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="form-input-icon-wrapper">
              <Mail className="form-input-icon" size={20} />
              <input type="email" className="form-input" 
                value={form.email} onChange={e => updateForm('email', e.target.value)} 
                disabled={!isEditing} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div className="form-input-icon-wrapper">
              <Phone className="form-input-icon" size={20} />
              <input type="tel" className="form-input" 
                value={form.phone} onChange={e => updateForm('phone', e.target.value)} 
                disabled={!isEditing} />
            </div>
          </div>
          
          <div style={{ marginTop: 24 }}>
            {isGoogleLinked ? (
              <button className="btn btn-secondary btn-full" style={{ display: 'flex', justifyContent: 'center', gap: '8px', opacity: 0.7 }} disabled>
                 <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                Google Account Linked
              </button>
            ) : (
              <button className="btn btn-secondary btn-full" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }} onClick={linkGoogleAccount}>
                 <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                Link Google Account
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="glass-card" style={{ padding: 'var(--space-2xl)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--color-text-secondary)' }}>Personal Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <div className="form-input-icon-wrapper">
                <Calendar className="form-input-icon" size={20} />
                <input type="text" className="form-input" placeholder="DD-MM-YYYY or Calendar"
                  value={form.dob} onChange={e => updateForm('dob', e.target.value)} 
                  disabled={!isEditing} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Age</label>
              <input type="number" className="form-input" placeholder="Auto-calculated"
                value={form.age} onChange={() => {}} 
                disabled={true} style={{ opacity: 0.8, cursor: 'not-allowed' }} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" 
                value={form.gender} onChange={e => updateForm('gender', e.target.value)} 
                disabled={!isEditing}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select className="form-select" 
                value={form.bloodGroup} onChange={e => updateForm('bloodGroup', e.target.value)} 
                disabled={!isEditing}>
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Address</label>
            <div className="form-input-icon-wrapper">
              <MapPin className="form-input-icon" size={20} />
              <textarea className="form-input" rows="3" placeholder="Enter your full residential address"
                value={form.address} onChange={e => updateForm('address', e.target.value)} 
                disabled={!isEditing} style={{ paddingLeft: 44, resize: 'vertical' }} />
            </div>
          </div>

          <div className="form-divider" />
          
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--color-text-secondary)' }}>Verification Documents</h3>

          <div className="form-group">
            <label className="form-label">Aadhar Number</label>
            <div className="form-input-icon-wrapper">
              <ShieldCheck className="form-input-icon" size={20} />
              <input type="text" className="form-input" placeholder="12-digit Aadhar Number"
                value={form.aadharNumber} onChange={e => {
                  const val = e.target.value.replace(/\D/g, ''); // only allow digits
                  updateForm('aadharNumber', val);
                }} 
                disabled={!isEditing} maxLength={12} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">PAN Number</label>
            <div className="form-input-icon-wrapper">
              <CreditCard className="form-input-icon" size={20} />
              <input type="text" className="form-input" placeholder="ABCDE1234F"
                value={form.panNumber} onChange={e => updateForm('panNumber', e.target.value.toUpperCase())} 
                disabled={!isEditing} maxLength={10} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
