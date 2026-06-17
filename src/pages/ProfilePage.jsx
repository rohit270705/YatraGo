import React, { useState, useEffect } from 'react';
import { UserCircle, Mail, Phone, MapPin, Edit2, Check, ShieldCheck, CreditCard, Calendar, Activity } from 'lucide-react';
import { useAuthStore, useToastStore } from '../store';

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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

  const updateForm = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'dob' && value) {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        next.age = age > 0 ? age : 0;
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
    setIsLoading(true);
    const res = await updateProfile(form);
    setIsLoading(false);
    
    if (res.error) {
      addToast(res.error, 'error');
    } else {
      addToast('Profile updated successfully!', 'success');
      setIsEditing(false);
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
        </div>

        {/* Right Column - Details */}
        <div className="glass-card" style={{ padding: 'var(--space-2xl)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--color-text-secondary)' }}>Personal Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <div className="form-input-icon-wrapper">
                <Calendar className="form-input-icon" size={20} />
                <input type="date" className="form-input" 
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
              <input type="text" className="form-input" placeholder="XXXX XXXX XXXX"
                value={form.aadharNumber} onChange={e => updateForm('aadharNumber', e.target.value)} 
                disabled={!isEditing} maxLength={14} />
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
