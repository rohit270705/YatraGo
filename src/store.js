import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabaseClient';

// ===== MOCK DATA =====
const MOCK_VEHICLES = [
  {
    id: 'v1',
    registrationNumber: 'MH-12-AB-1234',
    type: 'SUV',
    seatingCapacity: 7,
    luggageCapacity: 60,
    ownerId: 'owner1',
    ownerName: 'Rajesh Kumar',
    approved: true,
    isActive: true,
    puc: { number: 'PUC-2025-4432', validUntil: '2026-12-15', status: 'valid' },
    driverLicense: { number: 'MH-DL-9988776', validUntil: '2027-03-20', holder: 'Rajesh Kumar' },
    insurance: { number: 'INS-7744-MH', validUntil: '2026-09-10', provider: 'ICICI Lombard' },
    journeyHistory: [
      { id: 'j1', from: 'Mumbai', to: 'Pune', date: '2026-06-10', passengers: 5, status: 'completed' },
      { id: 'j2', from: 'Pune', to: 'Lonavala', date: '2026-06-08', passengers: 4, status: 'completed' },
      { id: 'j3', from: 'Mumbai', to: 'Nashik', date: '2026-06-05', passengers: 6, status: 'completed' },
      { id: 'j4', from: 'Nashik', to: 'Mumbai', date: '2026-06-03', passengers: 3, status: 'completed' },
      { id: 'j5', from: 'Mumbai', to: 'Goa', date: '2026-05-28', passengers: 7, status: 'completed' },
    ],
    currentLocation: { lat: 19.076, lng: 72.8777, updatedAt: new Date().toISOString() }
  },
  {
    id: 'v2',
    registrationNumber: 'MH-04-CD-5678',
    type: 'Sedan',
    seatingCapacity: 4,
    luggageCapacity: 35,
    ownerId: 'owner2',
    ownerName: 'Priya Sharma',
    approved: true,
    isActive: true,
    puc: { number: 'PUC-2025-8821', validUntil: '2026-11-30', status: 'valid' },
    driverLicense: { number: 'MH-DL-5566334', validUntil: '2028-01-15', holder: 'Priya Sharma' },
    insurance: { number: 'INS-3322-MH', validUntil: '2026-08-20', provider: 'Bajaj Allianz' },
    journeyHistory: [
      { id: 'j6', from: 'Pune', to: 'Mumbai', date: '2026-06-11', passengers: 3, status: 'completed' },
      { id: 'j7', from: 'Mumbai', to: 'Pune', date: '2026-06-09', passengers: 4, status: 'completed' },
      { id: 'j8', from: 'Pune', to: 'Satara', date: '2026-06-06', passengers: 2, status: 'completed' },
    ],
    currentLocation: { lat: 18.5204, lng: 73.8567, updatedAt: new Date().toISOString() }
  },
  {
    id: 'v3',
    registrationNumber: 'KA-01-EF-9012',
    type: 'Mini Bus',
    seatingCapacity: 14,
    luggageCapacity: 120,
    ownerId: 'owner3',
    ownerName: 'Vikram Patel',
    approved: true,
    isActive: true,
    puc: { number: 'PUC-2025-1100', validUntil: '2026-07-01', status: 'expiring_soon' },
    driverLicense: { number: 'KA-DL-7788990', validUntil: '2027-06-10', holder: 'Vikram Patel' },
    insurance: { number: 'INS-9900-KA', validUntil: '2026-12-25', provider: 'New India Assurance' },
    journeyHistory: [],
    currentLocation: { lat: 12.9716, lng: 77.5946, updatedAt: new Date().toISOString() }
  },
  {
    id: 'v4',
    registrationNumber: 'GJ-05-GH-3456',
    type: 'Tempo Traveller',
    seatingCapacity: 12,
    luggageCapacity: 90,
    ownerId: 'owner4',
    ownerName: 'Amit Desai',
    approved: false,
    isActive: false,
    puc: { number: 'PUC-2026-2233', validUntil: '2027-02-15', status: 'valid' },
    driverLicense: { number: 'GJ-DL-1122334', validUntil: '2027-08-30', holder: 'Amit Desai' },
    insurance: { number: 'INS-5566-GJ', validUntil: '2027-01-10', provider: 'SBI General' },
    journeyHistory: [],
    currentLocation: null
  },
  {
    id: 'v5',
    registrationNumber: 'DL-01-BU-7890',
    type: 'Bus',
    seatingCapacity: 40,
    luggageCapacity: 200,
    ownerId: 'owner5',
    ownerName: 'Suresh Travels Pvt Ltd',
    approved: true,
    isActive: true,
    puc: { number: 'PUC-2026-5501', validUntil: '2027-04-20', status: 'valid' },
    driverLicense: { number: 'DL-DL-3344556', validUntil: '2028-02-10', holder: 'Ramesh Yadav' },
    insurance: { number: 'INS-8800-DL', validUntil: '2027-03-15', provider: 'United India Insurance' },
    journeyHistory: [
      { id: 'j9', from: 'Delhi', to: 'Jaipur', date: '2026-06-11', passengers: 35, status: 'completed' },
      { id: 'j10', from: 'Jaipur', to: 'Delhi', date: '2026-06-10', passengers: 38, status: 'completed' },
      { id: 'j11', from: 'Delhi', to: 'Agra', date: '2026-06-08', passengers: 32, status: 'completed' },
      { id: 'j12', from: 'Delhi', to: 'Chandigarh', date: '2026-06-06', passengers: 28, status: 'completed' },
      { id: 'j13', from: 'Delhi', to: 'Jaipur', date: '2026-06-04', passengers: 40, status: 'completed' },
    ],
    currentLocation: { lat: 28.6139, lng: 77.2090, updatedAt: new Date().toISOString() }
  },
  {
    id: 'v6',
    registrationNumber: 'TN-07-BU-2345',
    type: 'Bus',
    seatingCapacity: 32,
    luggageCapacity: 160,
    ownerId: 'owner6',
    ownerName: 'KPN Travels',
    approved: true,
    isActive: true,
    puc: { number: 'PUC-2026-6612', validUntil: '2027-01-30', status: 'valid' },
    driverLicense: { number: 'TN-DL-9900112', validUntil: '2027-11-05', holder: 'Murugan S' },
    insurance: { number: 'INS-1122-TN', validUntil: '2026-10-18', provider: 'Oriental Insurance' },
    journeyHistory: [
      { id: 'j14', from: 'Bangalore', to: 'Chennai', date: '2026-06-11', passengers: 30, status: 'completed' },
      { id: 'j15', from: 'Chennai', to: 'Bangalore', date: '2026-06-09', passengers: 28, status: 'completed' },
      { id: 'j16', from: 'Bangalore', to: 'Hyderabad', date: '2026-06-07', passengers: 25, status: 'completed' },
    ],
    currentLocation: { lat: 12.9716, lng: 77.5946, updatedAt: new Date().toISOString() }
  }
];

const MOCK_ROUTES = [
  {
    id: 'r1', vehicleId: 'v1', from: 'Mumbai', to: 'Pune', stops: ['Lonavala', 'Khandala'],
    departureTime: '06:00', arrivalTime: '10:00', date: '2026-06-15', price: 650,
    availableSeats: 4, luggageAvailable: 30
  },
  {
    id: 'r2', vehicleId: 'v2', from: 'Pune', to: 'Mumbai', stops: ['Khandala'],
    departureTime: '08:00', arrivalTime: '11:30', date: '2026-06-15', price: 550,
    availableSeats: 2, luggageAvailable: 15
  },
  {
    id: 'r3', vehicleId: 'v3', from: 'Bangalore', to: 'Mysore', stops: ['Ramanagara', 'Mandya'],
    departureTime: '07:00', arrivalTime: '10:30', date: '2026-06-15', price: 450,
    availableSeats: 10, luggageAvailable: 80
  },
  {
    id: 'r4', vehicleId: 'v1', from: 'Mumbai', to: 'Goa', stops: ['Pune', 'Kolhapur', 'Belgaum'],
    departureTime: '22:00', arrivalTime: '08:00', date: '2026-06-16', price: 1200,
    availableSeats: 5, luggageAvailable: 40
  },
  {
    id: 'r5', vehicleId: 'v3', from: 'Bangalore', to: 'Goa', stops: ['Hubli', 'Belgaum'],
    departureTime: '20:00', arrivalTime: '06:00', date: '2026-06-16', price: 950,
    availableSeats: 12, luggageAvailable: 100
  },
  {
    id: 'r6', vehicleId: 'v2', from: 'Mumbai', to: 'Nashik', stops: ['Kasara', 'Igatpuri'],
    departureTime: '09:00', arrivalTime: '12:30', date: '2026-06-17', price: 500,
    availableSeats: 3, luggageAvailable: 20
  },
  {
    id: 'r7', vehicleId: 'v5', from: 'Delhi', to: 'Jaipur', stops: ['Gurgaon', 'Neemrana', 'Behror'],
    departureTime: '06:30', arrivalTime: '12:00', date: '2026-06-15', price: 700,
    availableSeats: 28, luggageAvailable: 150
  },
  {
    id: 'r8', vehicleId: 'v5', from: 'Mumbai', to: 'Ahmedabad', stops: ['Surat', 'Vadodara', 'Anand'],
    departureTime: '21:00', arrivalTime: '06:30', date: '2026-06-16', price: 850,
    availableSeats: 35, luggageAvailable: 180
  },
  {
    id: 'r9', vehicleId: 'v6', from: 'Bangalore', to: 'Chennai', stops: ['Hosur', 'Krishnagiri', 'Vellore'],
    departureTime: '23:00', arrivalTime: '05:30', date: '2026-06-15', price: 600,
    availableSeats: 22, luggageAvailable: 120
  },
  {
    id: 'r10', vehicleId: 'v6', from: 'Hyderabad', to: 'Bangalore', stops: ['Kurnool', 'Anantapur'],
    departureTime: '20:00', arrivalTime: '06:00', date: '2026-06-16', price: 900,
    availableSeats: 18, luggageAvailable: 100
  },
];

// ===== FIX 1: persist middleware mein avatar_url ko exclude karo =====
// Base64 avatar string bahut badi hoti hai — localStorage ki 5MB limit exceed ho
// jaati hai. Avatar URL agar normal string hai toh save karo, base64 hai toh exclude karo.
const authPersistConfig = {
  name: 'auth-storage',
  partialize: (state) => {
    let persistUser = state.user ? { ...state.user } : null;
    if (persistUser && persistUser.avatarUrl && persistUser.avatarUrl.startsWith('data:')) {
      // Exclude massive base64 strings to avoid QuotaExceededError
      persistUser.avatarUrl = undefined;
    }
    return {
      user: persistUser,
      isAuthenticated: state.isAuthenticated,
      activeSessions: state.activeSessions,
    };
  },
};

// ===== FIX 2: Login ke baad avatar sessionStorage se restore karo =====
const restoreAvatarToUser = (user) => {
  if (!user?.id) return user;
  try {
    const cachedAvatar = sessionStorage.getItem(`avatar_${user.id}`);
    if (cachedAvatar) return { ...user, avatarUrl: cachedAvatar };
  } catch (e) { /* ignore */ }
  return user;
};

// ===== AUTH STORE =====
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      activeSessions: [],
      isLoading: false,
      error: null,

      register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Use Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone || null,
            role: userData.role || 'passenger'
          }
        }
      });

      if (authError) throw authError;

      // The trigger will handle inserting into public.users.
      // But we need to update the remaining fields that aren't in raw_user_meta_data
      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          blood_group: userData.bloodGroup || null,
          aadhar_number: userData.aadharNumber || null,
          pan_number: userData.panNumber || null,
          avatar_url: userData.avatarUrl || null,
          dob: userData.dob || null
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const user = {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        emailVerified: data.email_verified,
        phoneVerified: data.phone_verified,
        bloodGroup: data.blood_group,
        dob: data.dob,
        age: data.age,
        gender: data.gender,
        address: data.address,
        aadharNumber: data.aadhar_number,
        panNumber: data.pan_number,
        avatarUrl: data.avatar_url,
        createdAt: data.created_at,
      };

      set({ user, isAuthenticated: true, isLoading: false });
      
      // Initialize wallet
      if (get().initializeWallet) {
        useWalletStore.getState().initializeWallet(user.id);
      }
      return user;
    } catch (err) {
      console.error('Registration error:', err);
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  signInWithGoogle: async (role = null) => {
    try {
      set({ isLoading: true, error: null });
      if (role) {
        localStorage.setItem('oauth_intended_role', role);
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      // Note: The redirect will happen automatically. Session sync is handled in App.jsx.
    } catch (err) {
      console.error('Google Auth Error:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  linkGoogleAccount: async (role = null) => {
    try {
      set({ isLoading: true, error: null });
      if (role) {
        localStorage.setItem('oauth_intended_role', role);
      }
      
      // Force sign out of any existing Supabase session. 
      // If they have a stale 'email' session, signInWithOAuth throws "Manual linking is disabled".
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'consent'
          }
        }
      });
      if (error) throw error;
      useToastStore.getState().addToast('Redirecting to Google...', 'info');
      
      set({ isLoading: false });
    } catch (err) {
      console.error('Error linking Google account:', err);
      const message = err.message || 'Failed to link Google account';
      set({ error: message, isLoading: false });
      useToastStore.getState().addToast(message, 'error');
    }
  },

  login: async (email, password, role) => {
    try {
      set({ isLoading: true, error: null });

      // Super Admin Override
      if (email.trim().toLowerCase() === 'admin@yatrago.com' && password.trim() === 'YRohit@372729#') {
        const adminId = 'a1b2c3d4-e5f6-4a1b-8c9d-0123456789ab';
        
        // Try to fetch saved admin profile from database
        const { data: dbAdmin } = await supabase
          .from('users')
          .select('*')
          .eq('id', adminId)
          .maybeSingle();

        const adminUser = dbAdmin ? {
          id: dbAdmin.id,
          email: dbAdmin.email,
          name: dbAdmin.name,
          phone: dbAdmin.phone,
          role: dbAdmin.role || 'admin',
          emailVerified: dbAdmin.email_verified ?? true,
          phoneVerified: dbAdmin.phone_verified ?? true,
          bloodGroup: dbAdmin.blood_group,
          dob: dbAdmin.dob,
          age: dbAdmin.age,
          gender: dbAdmin.gender,
          address: dbAdmin.address,
          aadharNumber: dbAdmin.aadhar_number,
          panNumber: dbAdmin.pan_number,
          avatarUrl: dbAdmin.avatar_url,
          wallet: 9999999,
          createdAt: dbAdmin.created_at,
        } : {
          // Fallback if admin row doesn't exist yet in DB
          id: adminId,
          email: 'admin@yatraGo.com',
          name: 'Super Admin',
          phone: '9999999999',
          role: 'admin',
          emailVerified: true,
          phoneVerified: true,
          wallet: 9999999,
          createdAt: new Date().toISOString()
        };
        
        // If admin doesn't exist in DB, create the row so future profile saves persist
        if (!dbAdmin) {
          await supabase.from('users').insert([{
            id: adminId,
            email: 'admin@yatraGo.com',
            name: 'Super Admin',
            phone: '9999999999',
            role: 'admin',
            email_verified: true,
            phone_verified: true
          }]).select().maybeSingle();
        }

        const newSession = {
          deviceId: 'admin-device',
          deviceName: navigator.userAgent.includes('Windows') ? 'Windows PC' : 'Admin Device',
          platform: 'Windows',
          loginAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        };

        const adminUserWithAvatar = restoreAvatarToUser(adminUser);

        set({
          user: adminUserWithAvatar,
          isAuthenticated: true,
          isLoading: false,
          activeSessions: [newSession]
        });
        
        if (get().initializeWallet) {
          useWalletStore.getState().initializeWallet(adminUser.id);
        }
        return adminUser;
      }
      
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Fetch the user's public profile and verify role
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (error) {
        throw new Error(`Supabase Error: ${error.message || JSON.stringify(error)}`);
      }
      
      if (role && data.role !== role) {
        await supabase.auth.signOut();
        throw new Error('Invalid role. Please select the correct account type.');
      }

      const { activeSessions } = get();
      if (activeSessions.length >= 4) {
        throw new Error('Maximum device limit reached (4 devices). Please log out from another device.');
      }

      const user = {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        emailVerified: data.email_verified,
        phoneVerified: data.phone_verified,
        bloodGroup: data.blood_group,
        dob: data.dob,
        age: data.age,
        gender: data.gender,
        address: data.address,
        aadharNumber: data.aadhar_number,
        panNumber: data.pan_number,
        // FIX: DB se fresh avatar_url lo, aur sessionStorage se bhi try karo
        avatarUrl: data.avatar_url || null,
        createdAt: data.created_at,
      };

      // Restore avatar from sessionStorage if available (set during last session)
      const userWithAvatar = restoreAvatarToUser(user);

      const newSession = {
        deviceId: uuidv4().slice(0, 8),
        deviceName: navigator.userAgent.includes('Windows') ? 'Windows PC' : 'Android Device',
        platform: navigator.userAgent.includes('Windows') ? 'Windows' : 'Android',
        loginAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      set({
        user: userWithAvatar,
        isAuthenticated: true,
        activeSessions: [...activeSessions, newSession],
        isLoading: false
      });

      if (get().initializeWallet) {
        useWalletStore.getState().initializeWallet(user.id);
      }
      return true;
    } catch (err) {
      console.error('Login error:', err);
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  verifyEmail: async () => {
    const { user } = get();
    if (!user) return;
    await supabase.from('users').update({ email_verified: true }).eq('id', user.id);
    set(state => ({ user: { ...state.user, emailVerified: true } }));
  },
  
  setPassword: async (newPassword) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      console.error('Error setting password:', err);
      set({ error: err.message, isLoading: false });
      return { error: err.message };
    }
  },

  updateProfile: async (updates) => {
    try {
      const { user } = get();
      if (!user) return { error: 'Not authenticated' };

      // ===== AVATAR UPLOAD FIX =====
      // Base64 string DB mein mat bhejo — Supabase Storage use karo
      // Isse fresh login ke baad bhi photo dikhega (permanent URL)
      let finalAvatarUrl = user.avatarUrl || null;

      if (updates.avatarUrl && updates.avatarUrl.startsWith('data:')) {
        // Base64 → Blob → Supabase Storage upload
        try {
          const base64Data = updates.avatarUrl.split(',')[1];
          const mimeType = updates.avatarUrl.split(';')[0].split(':')[1] || 'image/jpeg';
          const byteCharacters = atob(base64Data);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([byteArray], { type: mimeType });
          const fileExt = mimeType.split('/')[1] || 'jpg';
          const filePath = `avatars/${user.id}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('user-avatars')
            .upload(filePath, blob, { upsert: true, contentType: mimeType });

          if (uploadError) {
            console.warn('Avatar upload to storage failed:', uploadError.message);
            // Fallback: sessionStorage mein rakho (sirf is session ke liye)
            try { sessionStorage.setItem(`avatar_${user.id}`, updates.avatarUrl); } catch (e) {}
            finalAvatarUrl = updates.avatarUrl; // in-memory only
          } else {
            // Permanent public URL milega — har login pe kaam karega
            const { data: urlData } = supabase.storage
              .from('user-avatars')
              .getPublicUrl(filePath);
            finalAvatarUrl = urlData.publicUrl;
            // sessionStorage bhi update karo for instant display
            try { sessionStorage.setItem(`avatar_${user.id}`, finalAvatarUrl); } catch (e) {}
          }
        } catch (convErr) {
          console.warn('Avatar conversion error:', convErr);
          finalAvatarUrl = user.avatarUrl;
        }
      } else if (updates.avatarUrl && !updates.avatarUrl.startsWith('data:')) {
        // Already a URL (e.g. Google avatar) — use directly
        finalAvatarUrl = updates.avatarUrl;
      }

      // Map camelCase → snake_case for DB
      // Convert DOB from DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD for PostgreSQL
      let formattedDob = null;
      if (updates.dob) {
        const dobStr = updates.dob.trim();
        // Try DD/MM/YYYY or DD-MM-YYYY
        const parts = dobStr.split(/[\/\-]/);
        if (parts.length === 3 && parts[0].length <= 2) {
          // DD/MM/YYYY → YYYY-MM-DD
          formattedDob = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        } else {
          // Already YYYY-MM-DD or other format, pass as-is
          formattedDob = dobStr;
        }
      }

      const dbUpdates = {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        blood_group: updates.bloodGroup,
        dob: formattedDob,
        age: updates.age ? parseInt(updates.age) : null,
        gender: updates.gender,
        address: updates.address,
        aadhar_number: updates.aadharNumber,
        pan_number: updates.panNumber,
        avatar_url: finalAvatarUrl,  // permanent Storage URL, not base64
      };

      // undefined values hata do
      Object.keys(dbUpdates).forEach(
        key => dbUpdates[key] === undefined && delete dbUpdates[key]
      );

      const { data, error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // DB se confirmed data use karo local state mein
      const updatedUser = {
        ...user,
        name: data.name,
        email: data.email,
        phone: data.phone,
        bloodGroup: data.blood_group,
        dob: data.dob,
        age: data.age ? String(data.age) : '',
        gender: data.gender,
        address: data.address,
        aadharNumber: data.aadhar_number,
        panNumber: data.pan_number,
        avatarUrl: data.avatar_url || finalAvatarUrl,
      };

      set({ user: updatedUser });
      return { success: true };
    } catch (err) {
      console.error('Update profile error:', err);
      return { error: err.message || 'Failed to update profile' };
    }
  },
  
  verifyPhone: async () => {
    const { user } = get();
    if (!user) return;
    await supabase.from('users').update({ phone_verified: true }).eq('id', user.id);
    set(state => ({ user: { ...state.user, phoneVerified: true } }));
  },

  isFullyVerified: () => {
    const { user } = get();
    return user?.emailVerified && user?.phoneVerified;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, activeSessions: [], error: null });
  },

  removeSession: (deviceId) => set(state => ({
    activeSessions: state.activeSessions.filter(s => s.deviceId !== deviceId)
  })),

      clearError: () => set({ error: null }),
    }),
    authPersistConfig  // FIX 1: avatar exclude karne wala config
  )
);


// ==========================================
// 2B. PLATFORM SETTINGS STORE
// ==========================================
export const usePlatformStore = create((set, get) => ({
  settings: {
    AGENT_COMMISSION_PERCENT: 5.0,
    PLATFORM_FEE_FIXED: 0,
    SUPPORT_EMAIL: 'support@yatrago.com',
    CANCELLATION_FEE_MAX: 30.0,
  },
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('platform_settings').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        const parsedSettings = {};
        data.forEach(row => { 
          // Parse as number if possible, else string
          const numValue = Number(row.setting_value);
          parsedSettings[row.setting_key] = isNaN(numValue) ? row.setting_value : numValue;
        });
        set({ settings: { ...get().settings, ...parsedSettings } });
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  updateSetting: async (key, value) => {
    try {
      const strValue = String(value);
      const { error } = await supabase.from('platform_settings').upsert({ setting_key: key, setting_value: strValue, updated_at: new Date().toISOString() });
      if (error) throw error;
      
      const numValue = Number(value);
      set(state => ({
        settings: {
          ...state.settings,
          [key]: isNaN(numValue) ? strValue : numValue
        }
      }));
      return true;
    } catch (error) {
      console.error('Error updating platform setting:', error);
      return false;
    }
  }
}));

// ==========================================
// 3. WALLET STORE
// ==========================================
export const useWalletStore = create(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      withdrawals: [],
      isLoading: false,

      initializeWallet: async (userId) => {
    try {
      set({ isLoading: true });
      // Try to get wallet
      let { data: wallet, error } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
      
      if (error && error.code === 'PGRST116') {
        // Wallet doesn't exist, create it with welcome bonus
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert([{ user_id: userId, balance: 5000 }])
          .select()
          .single();
        
        if (createError) throw createError;
        wallet = newWallet;

        // Add welcome bonus transaction
        await supabase.from('wallet_transactions').insert([{
          user_id: userId,
          type: 'WALLET_TOPUP',
          amount: 5000,
          description: 'Welcome bonus',
          balance_before: 0,
          balance_after: 5000
        }]);
      } else if (error) {
        throw error;
      }

      // Fetch transactions
      const { data: txns } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Fetch withdrawals
      const { data: withdrawalsList } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      set({ 
        balance: wallet.balance, 
        transactions: txns || [], 
        withdrawals: withdrawalsList || [], 
        isLoading: false 
      });
    } catch (err) {
      console.error('Wallet init error:', err);
      set({ isLoading: false });
    }
  },

  addMoney: async (amount) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return false;

      const { balance, transactions } = get();
      const newBalance = balance + amount;

      // Update wallet
      await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);

      // Add transaction
      const { data: txn } = await supabase.from('wallet_transactions').insert([{
        user_id: user.id,
        type: 'WALLET_TOPUP',
        amount,
        description: 'Money added to wallet',
        balance_before: balance,
        balance_after: newBalance
      }]).select().single();

      set({ balance: newBalance, transactions: [txn, ...transactions] });
      return true;
    } catch (err) {
      console.error('Add money error:', err);
      return false;
    }
  },

  deductMoney: async (amount, description) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return false;

      const { balance, transactions } = get();
      if (balance < amount) return false;

      const newBalance = balance - amount;

      await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);

      const { data: txn } = await supabase.from('wallet_transactions').insert([{
        user_id: user.id,
        type: 'TICKET_PAYMENT',
        amount: -amount,
        description,
        balance_before: balance,
        balance_after: newBalance
      }]).select().single();

      set({ balance: newBalance, transactions: [txn, ...transactions] });
      return true;
    } catch (err) {
      console.error('Deduct money error:', err);
      return false;
    }
  },

  refundMoney: async (amount, description) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return false;

      const { balance, transactions } = get();
      const newBalance = balance + amount;

      await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);

      const { data: txn } = await supabase.from('wallet_transactions').insert([{
        user_id: user.id,
        type: 'TICKET_REFUND',
        amount,
        description,
        balance_before: balance,
        balance_after: newBalance
      }]).select().single();

      set({ balance: newBalance, transactions: [txn, ...transactions] });
      return true;
    } catch (err) {
      console.error('Refund money error:', err);
      return false;
    }
  },

  requestWithdrawal: async (amount, bankAccount, ifscCode) => {
    try {
      set({ isLoading: true });
      const user = useAuthStore.getState().user;
      if (!user) return { success: false, error: 'Not logged in' };

      const { balance, transactions, withdrawals } = get();
      if (balance < amount) return { success: false, error: 'Insufficient balance' };

      const newBalance = balance - amount;

      // 1. Create withdrawal request
      const { data: withdrawal, error: wError } = await supabase.from('withdrawals').insert([{
        user_id: user.id,
        amount,
        bank_account: bankAccount,
        ifsc_code: ifscCode,
        status: 'pending'
      }]).select().single();
      if (wError) throw wError;

      // 2. Deduct from wallet
      await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);

      // 3. Log transaction
      const { data: txn } = await supabase.from('wallet_transactions').insert([{
        user_id: user.id,
        type: 'WITHDRAWAL_REQUEST',
        amount: -amount,
        description: `Withdrawal request to ${bankAccount}`,
        balance_before: balance,
        balance_after: newBalance
      }]).select().single();

      set({ 
        balance: newBalance, 
        transactions: [txn, ...transactions],
        withdrawals: [withdrawal, ...withdrawals],
        isLoading: false
      });
      return { success: true };
    } catch (err) {
      console.error('Withdrawal error:', err);
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  // ===== ADMIN FUNCTIONS =====
  fetchAllWithdrawals: async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, user:users(name, email, role)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ withdrawals: data || [] });
    } catch (err) {
      console.error('Error fetching all withdrawals:', err);
    }
  },

  approveWithdrawal: async (withdrawalId) => {
    try {
      const { error } = await supabase.rpc('approve_withdrawal_admin', {
        target_withdrawal_id: withdrawalId,
        secret_key: 'yatrago_super_admin_secret_2026'
      });
      if (error) throw error;
      
      set(state => ({
        withdrawals: state.withdrawals.map(w => w.id === withdrawalId ? { ...w, status: 'approved' } : w)
      }));
      return { success: true };
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      return { success: false, error: err.message };
    }
  },

  rejectWithdrawal: async (withdrawal) => {
    try {
      const { error } = await supabase.rpc('reject_withdrawal_admin', {
        target_withdrawal_id: withdrawal.id,
        target_user_id: withdrawal.user_id,
        refund_amount: withdrawal.amount,
        secret_key: 'yatrago_super_admin_secret_2026'
      });
      if (error) throw error;
      
      set(state => ({
        withdrawals: state.withdrawals.map(w => w.id === withdrawal.id ? { ...w, status: 'rejected' } : w)
      }));
      return { success: true };
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      return { success: false, error: err.message };
    }
  },

}),
    {
      name: 'wallet-storage',
    }
  )
);


// ===== BOOKING STORE =====
export const useBookingStore = create(
  persist(
    (set, get) => ({
      routes: MOCK_ROUTES,
      bookings: [],
      searchResults: [],
      reviews: [],

      searchRoutes: (from, to, date) => {
    const vehicles = useVehicleStore.getState().vehicles || [];
    const results = MOCK_ROUTES.filter(r => {
      // Find the vehicle for this route
      const vehicle = vehicles.find(v => v.id === (r.vehicle_id || r.vehicleId));
      // Only show routes if vehicle exists and is approved
      if (!vehicle || !vehicle.approved) return false;

      const matchFrom = !from || r.from.toLowerCase().includes(from.toLowerCase());
      const matchTo = !to || r.to.toLowerCase().includes(to.toLowerCase());
      const matchDate = !date || r.date === date;
      return matchFrom && matchTo && (matchDate || !date);
    });
    set({ searchResults: results });
    return results;
  },

  createBooking: async (routeId, passengers, totalLuggageKg, isAgentBooking = false, agentId = null, customerPaymentMode = 'wallet', promoDiscount = 0, promoCode = null) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return { error: 'Not authenticated' };

      const route = MOCK_ROUTES.find(r => r.id === routeId);
      if (!route) return { error: 'Route not found' };

      const vehicle = MOCK_VEHICLES.find(v => v.id === route.vehicle_id || v.id === route.vehicleId);

      const calculatePassengerPrice = (ageStr) => {
        const age = parseInt(ageStr) || 0;
        if (age > 0 && age <= 5) return 0;
        if (age >= 6 && age <= 7) return Math.round(route.price / 2);
        return route.price;
      };

      const totalTicketPrice = passengers.reduce((sum, p) => sum + calculatePassengerPrice(p.age), 0);

      const freeLuggageLimit = passengers.length * 15;
      const extraLuggage = Math.max(0, totalLuggageKg - freeLuggageLimit);
      const luggageCost = extraLuggage * 10; // ₹10 per extra kg
      let totalAmount = totalTicketPrice + luggageCost;

      // Agent commission
      let commissionAmount = 0;
      if (isAgentBooking) {
        const commissionRate = (usePlatformStore.getState().settings.agent_commission_rate || 5) / 100;
        commissionAmount = Math.round(totalAmount * commissionRate);
        totalAmount += commissionAmount;
      }

      // Promo Discount
      if (promoDiscount > 0) {
        totalAmount -= Math.round((totalAmount * promoDiscount) / 100);
      }

      // For the two-step booking flow, we don't deduct money immediately.
      // We just create a pending request for the owner to approve.

      // Insert into Supabase with pending status
      const { data: booking, error: insertError } = await supabase.from('bookings').insert([{
        id: 'BK-' + uuidv4().slice(0, 8).toUpperCase(),
        user_id: user.id,
        route_id: routeId,
        passenger_details: passengers,
        luggage_kg: totalLuggageKg,
        extra_luggage_cost: luggageCost,
        total_amount: totalAmount,
        commission_amount: commissionAmount,
        is_agent_booking: isAgentBooking,
        agent_id: agentId,
        status: 'pending_owner_approval'
      }]).select().single();

      if (insertError) {
        throw insertError;
      }

      if (promoCode) {
        await supabase.rpc('apply_promo_code', { target_code: promoCode });
      }

      // Format for local state
      const localBooking = {
        ...booking,
        route,
        vehicle: vehicle ? {
          id: vehicle.id,
          registrationNumber: vehicle.registration_number || vehicle.registrationNumber,
          type: vehicle.type,
          ownerName: vehicle.owner_name || vehicle.ownerName,
        } : null,
        passengerDetails: booking.passenger_details,
        luggageKg: booking.luggage_kg,
        extraLuggageCost: booking.extra_luggage_cost,
        totalAmount: booking.total_amount,
        commissionAmount: booking.commission_amount,
        isAgentBooking: booking.is_agent_booking,
        agentId: booking.agent_id,
        customerPaymentMode: customerPaymentMode,
        createdAt: booking.created_at,
      };

      const { bookings } = get();
      set({ bookings: [localBooking, ...bookings] });
      return localBooking;
    } catch (err) {
      console.error('Booking error:', err);
      return { error: 'Booking failed. Please try again.' };
    }
  },

  // Check if booking can be modified (only 2+ hours before journey)
  canModifyBooking: (bookingId) => {
    const { bookings } = get();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || booking.status !== 'confirmed') return { allowed: false, reason: 'Booking is not active' };

    const journeyDate = new Date(booking.route.date + 'T' + booking.route.departureTime);
    const now = new Date();
    const hoursUntilJourney = (journeyDate - now) / (1000 * 60 * 60);

    if (hoursUntilJourney < 2) {
      return { allowed: false, reason: 'Modifications are only allowed up to 2 hours before journey. Less than 2 hours remaining.' };
    }

    return { allowed: true, hoursRemaining: Math.floor(hoursUntilJourney) };
  },

  // Update payment mode for agent reports
  updatePaymentMode: (bookingId, newMode) => {
    set(state => ({
      bookings: state.bookings.map(b => 
        b.id === bookingId ? { ...b, customerPaymentMode: newMode } : b
      )
    }));
    return true;
  },

  // Modify booking details (allowed only 2+ hours before journey)
  modifyBooking: (bookingId, updatedDetails) => {
    const canModify = get().canModifyBooking(bookingId);
    if (!canModify.allowed) return { error: canModify.reason };

    const { bookings } = get();
    const booking = bookings.find(b => b.id === bookingId);

    const modification = {
      timestamp: new Date().toISOString(),
      changes: {},
    };

    // Track what changed
    if (updatedDetails.name && updatedDetails.name !== booking.passengerDetails.name) {
      modification.changes.name = { from: booking.passengerDetails.name, to: updatedDetails.name };
    }
    if (updatedDetails.age && updatedDetails.age !== booking.passengerDetails.age) {
      modification.changes.age = { from: booking.passengerDetails.age, to: updatedDetails.age };
    }
    if (updatedDetails.bloodGroup && updatedDetails.bloodGroup !== booking.passengerDetails.bloodGroup) {
      modification.changes.bloodGroup = { from: booking.passengerDetails.bloodGroup, to: updatedDetails.bloodGroup };
    }
    if (updatedDetails.aadhar && updatedDetails.aadhar !== booking.passengerDetails.aadhar) {
      modification.changes.aadhar = { from: booking.passengerDetails.aadhar, to: updatedDetails.aadhar };
    }
    if (updatedDetails.pan && updatedDetails.pan !== booking.passengerDetails.pan) {
      modification.changes.pan = { from: booking.passengerDetails.pan, to: updatedDetails.pan };
    }
    if (updatedDetails.luggageKg !== undefined && updatedDetails.luggageKg !== booking.luggageKg) {
      modification.changes.luggage = { from: booking.luggageKg, to: updatedDetails.luggageKg };
    }

    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId
          ? {
              ...b,
              passengerDetails: { ...b.passengerDetails, ...updatedDetails },
              luggageKg: updatedDetails.luggageKg !== undefined ? updatedDetails.luggageKg : b.luggageKg,
              modifiedAt: new Date().toISOString(),
              modificationHistory: [...(b.modificationHistory || []), modification],
            }
          : b
      ),
    }));

    return { success: true, modification };
  },

  // Mark journey as completed (triggers review prompt)
  completeBooking: (bookingId) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId
          ? { ...b, status: 'completed', completedAt: new Date().toISOString(), reviewPending: true }
          : b
      ),
    }));
  },

  // Submit review/feedback after journey completion
  submitReview: (bookingId, rating, comment, tags = []) => {
    const { bookings } = get();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return null;

    const review = {
      id: 'REV-' + uuidv4().slice(0, 8).toUpperCase(),
      bookingId,
      rating,       // 1-5
      comment,
      tags,         // e.g. ['clean vehicle', 'on-time', 'polite driver']
      routeFrom: booking.route.from,
      routeTo: booking.route.to,
      vehicleType: booking.vehicle?.type,
      vehicleReg: booking.vehicle?.registrationNumber,
      passengerName: booking.passengerDetails.name,
      isAgentBooking: booking.isAgentBooking,
      submittedAt: new Date().toISOString(),
    };

    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId
          ? { ...b, review, reviewPending: false }
          : b
      ),
      reviews: [review, ...state.reviews],
    }));

    return review;
  },

  // Skip review (dismiss the prompt)
  skipReview: (bookingId) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId
          ? { ...b, reviewPending: false }
          : b
      ),
    }));
  },
  approveBooking: async (bookingId) => {
    // In a real app, we would update Supabase here
    const { error } = await supabase.from('bookings').update({ status: 'approved_awaiting_payment' }).eq('id', bookingId);
    if (error) return { error: error.message };

    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'approved_awaiting_payment' } : b
      ),
    }));
    return { success: true };
  },

  rejectBooking: async (bookingId) => {
    // In a real app, we would update Supabase here
    const { error } = await supabase.from('bookings').update({ status: 'rejected_by_owner' }).eq('id', bookingId);
    if (error) return { error: error.message };

    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'rejected_by_owner' } : b
      ),
    }));
    return { success: true };
  },

  payForBooking: async (bookingId) => {
    const { bookings } = get();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { error: 'Booking not found' };

    // Deduct from wallet
    const walletSuccess = await useWalletStore.getState().deductMoney(
      booking.totalAmount,
      `Ticket Payment: Booking ${bookingId}`
    );

    if (!walletSuccess) return { error: 'Insufficient wallet balance' };

    // Update in Supabase
    const { error } = await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);
    if (error) {
       await useWalletStore.getState().refundMoney(
         booking.totalAmount,
         `Refund: Booking failed (${bookingId})`
       );
       return { error: error.message };
    }

    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'confirmed', paidAt: new Date().toISOString() } : b
      ),
    }));
    return { success: true };
  },

  cancelBooking: (bookingId) => {
    const { bookings } = get();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || booking.status !== 'confirmed') return null;

    const journeyDate = new Date(booking.route.date + 'T' + booking.route.departureTime);
    const now = new Date();
    const hoursUntilJourney = (journeyDate - now) / (1000 * 60 * 60);

    let refundAmount;
    let cancellationFee = 0;

    if (hoursUntilJourney <= 24) {
      cancellationFee = 30;
      refundAmount = booking.totalAmount - cancellationFee;
    } else {
      refundAmount = booking.totalAmount;
    }

    // Refund to wallet
    useWalletStore.getState().refundMoney(
      refundAmount,
      `Refund: ${booking.route.from} → ${booking.route.to} ${cancellationFee > 0 ? '(₹30 fee deducted)' : '(Full refund)'}`
    );

    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId
          ? { ...b, status: 'cancelled', cancelledAt: new Date().toISOString(), refundAmount, cancellationFee }
          : b
      ),
    }));

    return { refundAmount, cancellationFee };
  },
}),
{
  name: 'booking-storage',
}
)
);


// Helper to map DB snake_case to frontend camelCase
const mapVehicleFromDB = (v) => ({
  id: v.id,
  ownerId: v.owner_id,
  owner_id: v.owner_id,
  registrationNumber: v.registration_number,
  modelName: v.model_name,
  variant: v.variant,
  fuelType: v.fuel_type,
  purchaseDate: v.purchase_date,
  type: v.type,
  seatingCapacity: v.seating_capacity,
  luggageCapacity: v.luggage_capacity,
  approved: v.approved,
  isActive: v.is_active,
  createdAt: v.created_at,
  documentsSubmitted: v.documents_submitted || false,
  photos: {
    front: v.photo_front_url || null,
    back: v.photo_back_url || null,
    left: v.photo_left_url || null,
    right: v.photo_right_url || null,
    interior: v.photo_interior_url || null,
  },
  documents: {
    rc: { number: v.rc_number || '', photoUrl: v.rc_photo_url || null },
    puc: { number: v.puc_number || '', validUntil: v.puc_valid_until || '', photoUrl: v.puc_photo_url || null },
    dl: { number: v.dl_number || '', holderName: v.dl_holder_name || '', validUntil: v.dl_valid_until || '', photoUrl: v.dl_photo_url || null },
  },
});

export const useVehicleStore = create((set, get) => ({
  vehicles: MOCK_VEHICLES,
  isLoading: false,

  fetchVehicles: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.from('vehicles').select('*');
      if (error) throw error;
      
      const mappedVehicles = (data || []).map(mapVehicleFromDB);
      
      // Merge with mock vehicles for now to keep UI populated
      const combined = [...MOCK_VEHICLES, ...mappedVehicles];
      set({ vehicles: combined, isLoading: false });
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      set({ isLoading: false });
    }
  },

  getVehicle: (id) => get().vehicles.find(v => v.id === id),

  // Upload a single photo to Supabase Storage
  uploadVehiclePhoto: async (vehicleId, photoFile, photoType) => {
    try {
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `${vehicleId}/${photoType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(filePath, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(filePath);

      return { success: true, url: urlData.publicUrl };
    } catch (err) {
      console.error(`Error uploading ${photoType} photo:`, err);
      return { success: false, error: err.message };
    }
  },

  createVehicle: async (vehicleData) => {
    try {
      set({ isLoading: true });

      const vehicleId = uuidv4();
      
      // 1. Insert the vehicle row first
      const { data, error } = await supabase.from('vehicles').insert([{
        id: vehicleId,
        owner_id: vehicleData.owner_id,
        registration_number: vehicleData.registrationNumber,
        model_name: vehicleData.modelName,
        variant: vehicleData.variant,
        fuel_type: vehicleData.fuelType,
        purchase_date: vehicleData.purchaseDate || null,
        type: vehicleData.type,
        seating_capacity: vehicleData.seatingCapacity,
        luggage_capacity: vehicleData.luggageCapacity,
        approved: false,
        is_active: false
      }]).select().single();

      if (error) throw error;

      // 2. Upload photos if provided
      const photoFields = ['front', 'back', 'left', 'right', 'interior'];
      const photoUrls = {};
      for (const field of photoFields) {
        const file = vehicleData.photos?.[field];
        if (file) {
          const result = await get().uploadVehiclePhoto(vehicleId, file, field);
          if (result.success) {
            photoUrls[`photo_${field}_url`] = result.url;
          }
        }
      }

      // 3. Update the vehicle row with photo URLs if any were uploaded
      if (Object.keys(photoUrls).length > 0) {
        const { error: updateError } = await supabase.from('vehicles')
          .update(photoUrls)
          .eq('id', vehicleId);
        if (updateError) console.error('Error saving photo URLs:', updateError);
        Object.assign(data, photoUrls);
      }

      const mappedVehicle = mapVehicleFromDB(data);

      set(state => ({ vehicles: [mappedVehicle, ...state.vehicles], isLoading: false }));
      return { success: true, vehicle: mappedVehicle };
    } catch (err) {
      console.error('Error creating vehicle:', err);
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  deleteVehicle: async (vehicleId) => {
    try {
      // If it's a mock vehicle, just remove from state
      if (vehicleId.startsWith('v')) {
        set(state => ({
          vehicles: state.vehicles.filter(v => v.id !== vehicleId),
        }));
        return { success: true };
      }

      // Delete photos from storage
      const { data: files } = await supabase.storage
        .from('vehicle-photos')
        .list(vehicleId);
      if (files && files.length > 0) {
        const filePaths = files.map(f => `${vehicleId}/${f.name}`);
        await supabase.storage.from('vehicle-photos').remove(filePaths);
      }

      // Delete vehicle from database
      const { error } = await supabase.from('vehicles')
        .delete()
        .eq('id', vehicleId);
      if (error) throw error;

      set(state => ({
        vehicles: state.vehicles.filter(v => v.id !== vehicleId),
      }));
      return { success: true };
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      return { success: false, error: err.message };
    }
  },

  approveVehicle: async (vehicleId) => {
    try {
      // If it's a mock vehicle, just update state
      if (vehicleId.startsWith('v')) {
        set(state => ({
          vehicles: state.vehicles.map(v =>
            v.id === vehicleId ? { ...v, approved: true, isActive: true } : v
          ),
        }));
        return { success: true };
      }

      const { error } = await supabase.rpc('approve_vehicle_admin', { 
        target_vehicle_id: vehicleId,
        secret_key: 'yatrago_super_admin_secret_2026'
      });
        
      if (error) throw error;

      // Find the vehicle to get owner details
      const vehicle = get().vehicles.find(v => v.id === vehicleId);
      const ownerId = vehicle?.ownerId || vehicle?.owner_id;
      const regNumber = vehicle?.registrationNumber || vehicle?.registration_number || vehicleId;

      // Create in-app notification for the owner
      if (ownerId) {
        try {
          await supabase.from('notifications').insert([{
            user_id: ownerId,
            title: '🎉 Vehicle Approved!',
            message: `Your vehicle ${regNumber} has been approved by admin! Please upload your pending documents (RC Book, PUC Certificate, Driving License) to complete the registration.`,
            type: 'action_required',
            reference_type: 'vehicle_approved',
            reference_id: vehicleId,
          }]);
        } catch (notifErr) {
          console.warn('Failed to create notification:', notifErr);
        }

        // Look up owner email for email notification
        try {
          const { data: ownerData } = await supabase.from('users').select('email, name').eq('id', ownerId).single();
          if (ownerData?.email) {
            // Send approval email via Edge Function or log it
            console.log(`[EMAIL] To: ${ownerData.email} | Subject: Vehicle ${regNumber} Approved | From: admin@yatraGo.com`);
            console.log(`[EMAIL] Body: Dear ${ownerData.name}, your vehicle ${regNumber} has been approved. Please log in and upload your RC Book, PUC Certificate, and Driving License to complete registration.`);
            // In production, call an edge function or email API here
          }
        } catch (emailErr) {
          console.warn('Failed to send email notification:', emailErr);
        }

        // Update the notification store if it's the current user
        useNotificationStore.getState().fetchNotifications();
      }

      set(state => ({
        vehicles: state.vehicles.map(v =>
          v.id === vehicleId ? { ...v, approved: true, is_active: true, isActive: true } : v
        ),
      }));
      return { success: true };
    } catch (err) {
      console.error('Error approving vehicle:', err);
      return { success: false, error: err.message };
    }
  },

  rejectVehicle: async (vehicleId) => {
    try {
      // If it's a mock vehicle, just remove it from state
      if (vehicleId.startsWith('v')) {
        set(state => ({
          vehicles: state.vehicles.filter(v => v.id !== vehicleId),
        }));
        return { success: true };
      }

      const { error } = await supabase.rpc('reject_vehicle_admin', { 
        target_vehicle_id: vehicleId,
        secret_key: 'yatrago_super_admin_secret_2026'
      });
        
      if (error) throw error;

      set(state => ({
        vehicles: state.vehicles.filter(v => v.id !== vehicleId),
      }));
      return { success: true };
    } catch (err) {
      console.error('Error rejecting vehicle:', err);
      return { success: false, error: err.message };
    }
  },

  getPendingApprovals: () => get().vehicles.filter(v => v.approved === false),
  getActiveVehicles: () => get().vehicles.filter(v => v.approved === true && (v.is_active !== false && v.isActive !== false)),

  // Upload a document photo to Supabase Storage
  uploadDocumentPhoto: async (vehicleId, docType, photoFile) => {
    try {
      // Validate file size (max 5MB)
      if (photoFile.size > 5 * 1024 * 1024) {
        return { success: false, error: 'File must be under 5MB' };
      }
      // Validate file type (jpg/png only)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(photoFile.type)) {
        return { success: false, error: 'Only JPG and PNG formats are allowed' };
      }

      const fileExt = photoFile.name.split('.').pop().toLowerCase();
      const filePath = `${vehicleId}/doc_${docType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(filePath, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(filePath);

      return { success: true, url: urlData.publicUrl };
    } catch (err) {
      console.error(`Error uploading ${docType} document:`, err);
      return { success: false, error: err.message };
    }
  },

  // Submit all vehicle documents (RC, PUC, DL) after approval
  submitVehicleDocuments: async (vehicleId, docData) => {
    try {
      set({ isLoading: true });

      const photoUrls = {};

      // Upload RC Book photo
      if (docData.rcPhoto) {
        const result = await get().uploadDocumentPhoto(vehicleId, 'rc', docData.rcPhoto);
        if (result.success) photoUrls.rc_photo_url = result.url;
        else { set({ isLoading: false }); return { success: false, error: `RC Book photo: ${result.error}` }; }
      }

      // Upload PUC photo
      if (docData.pucPhoto) {
        const result = await get().uploadDocumentPhoto(vehicleId, 'puc', docData.pucPhoto);
        if (result.success) photoUrls.puc_photo_url = result.url;
        else { set({ isLoading: false }); return { success: false, error: `PUC photo: ${result.error}` }; }
      }

      // Upload DL photo
      if (docData.dlPhoto) {
        const result = await get().uploadDocumentPhoto(vehicleId, 'dl', docData.dlPhoto);
        if (result.success) photoUrls.dl_photo_url = result.url;
        else { set({ isLoading: false }); return { success: false, error: `DL photo: ${result.error}` }; }
      }

      // Update vehicle record with all document info
      const updatePayload = {
        rc_number: docData.rcNumber || null,
        puc_number: docData.pucNumber || null,
        puc_valid_until: docData.pucValidUntil || null,
        dl_number: docData.dlNumber || null,
        dl_holder_name: docData.dlHolderName || null,
        dl_valid_until: docData.dlValidUntil || null,
        documents_submitted: true,
        ...photoUrls,
      };

      const { error } = await supabase.from('vehicles')
        .update(updatePayload)
        .eq('id', vehicleId);

      if (error) throw error;

      // Update local state
      set(state => ({
        vehicles: state.vehicles.map(v =>
          v.id === vehicleId ? {
            ...v,
            documentsSubmitted: true,
            documents: {
              rc: { number: docData.rcNumber || '', photoUrl: photoUrls.rc_photo_url || v.documents?.rc?.photoUrl || null },
              puc: { number: docData.pucNumber || '', validUntil: docData.pucValidUntil || '', photoUrl: photoUrls.puc_photo_url || v.documents?.puc?.photoUrl || null },
              dl: { number: docData.dlNumber || '', holderName: docData.dlHolderName || '', validUntil: docData.dlValidUntil || '', photoUrl: photoUrls.dl_photo_url || v.documents?.dl?.photoUrl || null },
            }
          } : v
        ),
        isLoading: false,
      }));

      return { success: true };
    } catch (err) {
      console.error('Error submitting documents:', err);
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },
}));


// ===== AGENT STORE =====
export const useAgentStore = create((set, get) => ({
  agents: [
    {
      id: 'agent1',
      userId: 'user-agent1',
      name: 'Travels Express Agency',
      email: 'agent@travelexpress.com',
      phone: '+91 99887 76655',
      commissionRate: 0.05,
      totalEarnings: 12500,
      totalBookings: 47,
      bookings: [],
    }
  ],
  currentAgent: null,

  loginAgent: (email) => {
    const agent = get().agents[0]; // Mock: always return first agent
    set({ currentAgent: { ...agent, email } });
    return agent;
  },

  logoutAgent: () => set({ currentAgent: null }),

  addAgentBooking: (booking) => {
    set(state => ({
      currentAgent: state.currentAgent ? {
        ...state.currentAgent,
        totalBookings: state.currentAgent.totalBookings + 1,
        totalEarnings: state.currentAgent.totalEarnings + booking.commissionAmount,
        bookings: [booking, ...(state.currentAgent.bookings || [])],
      } : null,
    }));
  },
}));


// ===== PARCEL STORE =====
export const useParcelStore = create((set, get) => ({
  parcels: [],

  createParcel: async (parcelData) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return { error: 'Not authenticated' };

      // Deduct from wallet
      const walletSuccess = await useWalletStore.getState().deductMoney(parcelData.price, `Parcel: ${parcelData.pickup} → ${parcelData.dropoff}`);
      if (!walletSuccess) return { error: 'Insufficient wallet balance' };

      const parcelId = 'PRC-' + uuidv4().slice(0, 8).toUpperCase();
      const trackingUpdates = [
        { status: 'booked', message: 'Parcel booking confirmed', timestamp: new Date().toISOString() },
      ];

      // Insert into Supabase
      const { data: parcel, error: insertError } = await supabase.from('parcels').insert([{
        id: parcelId,
        user_id: user.id,
        sender_name: parcelData.senderName,
        sender_phone: parcelData.senderPhone,
        receiver_name: parcelData.receiverName,
        receiver_phone: parcelData.receiverPhone,
        pickup_address: parcelData.pickup,
        dropoff_address: parcelData.dropoff,
        weight_kg: parcelData.weight,
        description: parcelData.itemDetails,
        price: parcelData.price,
        status: 'booked',
        tracking_updates: trackingUpdates
      }]).select().single();

      if (insertError) throw insertError;

      const localParcel = {
        ...parcelData,
        id: parcel.id,
        status: parcel.status,
        trackingUpdates: parcel.tracking_updates,
        createdAt: parcel.created_at,
      };

      const { parcels } = get();
      set({ parcels: [localParcel, ...parcels] });
      return localParcel;
    } catch (err) {
      console.error('Parcel creation error:', err);
      return { error: 'Failed to create parcel. Please try again.' };
    }
  },

  updateParcelStatus: (parcelId, status, message) => {
    set(state => ({
      parcels: state.parcels.map(p =>
        p.id === parcelId
          ? {
              ...p,
              status,
              trackingUpdates: [
                ...p.trackingUpdates,
                { status, message, timestamp: new Date().toISOString() }
              ]
            }
          : p
      ),
    }));
  },
}));


// ===== TOAST STORE =====
export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'info') => {
    const toast = { id: uuidv4(), message, type };
    set(state => ({ toasts: [...state.toasts, toast] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== toast.id) }));
    }, 4000);
  },
}));


// ===== RENTAL STORE =====
const RENTAL_VEHICLES = [
  // 10 Bikes
  {
    id: 'bk1', category: 'bike', name: 'Royal Enfield Classic 350',
    brand: 'Royal Enfield', cc: 350, fuelType: 'Petrol', mileage: '35 km/l',
    pricePerHour: 80, pricePerDay: 800, securityDeposit: 2000,
    color: 'Stealth Black', year: 2025, rating: 4.8, totalRentals: 234,
    features: ['ABS', 'Tubeless Tyres', 'Electric Start', 'USB Charging'],
    location: 'Mumbai - Andheri', available: true, image: '🏍️',
  },
  {
    id: 'bk2', category: 'bike', name: 'KTM Duke 200',
    brand: 'KTM', cc: 200, fuelType: 'Petrol', mileage: '30 km/l',
    pricePerHour: 100, pricePerDay: 1000, securityDeposit: 2500,
    color: 'Orange', year: 2025, rating: 4.7, totalRentals: 189,
    features: ['ABS', 'Slipper Clutch', 'LED Headlight', 'Digital Console'],
    location: 'Mumbai - Bandra', available: true, image: '🏍️',
  },
  {
    id: 'bk3', category: 'bike', name: 'Bajaj Pulsar NS200',
    brand: 'Bajaj', cc: 200, fuelType: 'Petrol', mileage: '35 km/l',
    pricePerHour: 60, pricePerDay: 600, securityDeposit: 1500,
    color: 'Red-Black', year: 2024, rating: 4.5, totalRentals: 312,
    features: ['ABS', 'Perimeter Frame', 'Projector Headlamp', 'Monoshock'],
    location: 'Pune - Hinjewadi', available: true, image: '🏍️',
  },
  {
    id: 'bk4', category: 'bike', name: 'Yamaha R15 V4',
    brand: 'Yamaha', cc: 155, fuelType: 'Petrol', mileage: '40 km/l',
    pricePerHour: 90, pricePerDay: 900, securityDeposit: 2500,
    color: 'Racing Blue', year: 2025, rating: 4.9, totalRentals: 156,
    features: ['Dual Channel ABS', 'Traction Control', 'Quick Shifter', 'VVA'],
    location: 'Bangalore - Koramangala', available: true, image: '🏍️',
  },
  {
    id: 'bk5', category: 'bike', name: 'Honda CB Hornet 2.0',
    brand: 'Honda', cc: 184, fuelType: 'Petrol', mileage: '38 km/l',
    pricePerHour: 70, pricePerDay: 700, securityDeposit: 1800,
    color: 'Pearl Spartan Red', year: 2025, rating: 4.6, totalRentals: 201,
    features: ['ABS', 'LED Headlamp', 'Digital-Analog Console', 'Hazard Switch'],
    location: 'Delhi - Connaught Place', available: true, image: '🏍️',
  },
  {
    id: 'bk6', category: 'bike', name: 'TVS Apache RTR 160 4V',
    brand: 'TVS', cc: 160, fuelType: 'Petrol', mileage: '42 km/l',
    pricePerHour: 55, pricePerDay: 550, securityDeposit: 1500,
    color: 'Matte Blue', year: 2024, rating: 4.4, totalRentals: 278,
    features: ['Dual Channel ABS', 'SmartXConnect', 'Glide Through Tech', 'Race Tuned FI'],
    location: 'Chennai - T Nagar', available: true, image: '🏍️',
  },
  {
    id: 'bk7', category: 'bike', name: 'Suzuki Gixxer SF 250',
    brand: 'Suzuki', cc: 250, fuelType: 'Petrol', mileage: '32 km/l',
    pricePerHour: 95, pricePerDay: 950, securityDeposit: 2500,
    color: 'Metallic Mat Black', year: 2025, rating: 4.7, totalRentals: 134,
    features: ['ABS', 'Oil Cooled', 'Clip-on Handlebars', 'Full Digital Display'],
    location: 'Hyderabad - Jubilee Hills', available: true, image: '🏍️',
  },
  {
    id: 'bk8', category: 'bike', name: 'Hero Xpulse 200 4V',
    brand: 'Hero', cc: 200, fuelType: 'Petrol', mileage: '40 km/l',
    pricePerHour: 65, pricePerDay: 650, securityDeposit: 1800,
    color: 'Trail Green', year: 2025, rating: 4.5, totalRentals: 198,
    features: ['ABS', 'Rally Kit Ready', 'LED Headlamp', 'Turn-by-Turn Nav'],
    location: 'Goa - Panaji', available: true, image: '🏍️',
  },
  {
    id: 'bk9', category: 'bike', name: 'Kawasaki Ninja 300',
    brand: 'Kawasaki', cc: 296, fuelType: 'Petrol', mileage: '28 km/l',
    pricePerHour: 150, pricePerDay: 1500, securityDeposit: 4000,
    color: 'Lime Green', year: 2025, rating: 4.9, totalRentals: 87,
    features: ['ABS', 'Slipper Clutch', 'Twin Cylinder', 'Assist Clutch'],
    location: 'Bangalore - MG Road', available: true, image: '🏍️',
  },
  {
    id: 'bk10', category: 'bike', name: 'Jawa 42 Bobber',
    brand: 'Jawa', cc: 294, fuelType: 'Petrol', mileage: '30 km/l',
    pricePerHour: 85, pricePerDay: 850, securityDeposit: 2000,
    color: 'Moonstone White', year: 2025, rating: 4.6, totalRentals: 112,
    features: ['Dual Channel ABS', 'Liquid Cooled', 'Alloy Wheels', 'LED DRL'],
    location: 'Jaipur - MI Road', available: false, image: '🏍️',
  },

  // 7 Scooties
  {
    id: 'sc1', category: 'scooty', name: 'Honda Activa 6G',
    brand: 'Honda', cc: 110, fuelType: 'Petrol', mileage: '55 km/l',
    pricePerHour: 30, pricePerDay: 300, securityDeposit: 1000,
    color: 'Pearl Precious White', year: 2025, rating: 4.7, totalRentals: 567,
    features: ['CBS', 'Silent Start', 'LED Headlamp', 'External Fuel Lid'],
    location: 'Mumbai - Dadar', available: true, image: '🛵',
  },
  {
    id: 'sc2', category: 'scooty', name: 'TVS Jupiter 125',
    brand: 'TVS', cc: 125, fuelType: 'Petrol', mileage: '50 km/l',
    pricePerHour: 35, pricePerDay: 350, securityDeposit: 1000,
    color: 'Starlight Blue', year: 2025, rating: 4.6, totalRentals: 423,
    features: ['IntelliGo', 'USB Charging', 'Eco-Thrust FI', 'LED Headlamp'],
    location: 'Pune - Kothrud', available: true, image: '🛵',
  },
  {
    id: 'sc3', category: 'scooty', name: 'Suzuki Access 125',
    brand: 'Suzuki', cc: 125, fuelType: 'Petrol', mileage: '48 km/l',
    pricePerHour: 35, pricePerDay: 350, securityDeposit: 1000,
    color: 'Metallic Matte Black', year: 2024, rating: 4.5, totalRentals: 389,
    features: ['CBS', 'LED Headlamp', 'Bluetooth Connect', 'SEP Engine'],
    location: 'Bangalore - Whitefield', available: true, image: '🛵',
  },
  {
    id: 'sc4', category: 'scooty', name: 'Ather 450X (Electric)',
    brand: 'Ather', cc: 0, fuelType: 'Electric', mileage: '105 km range',
    pricePerHour: 50, pricePerDay: 500, securityDeposit: 2000,
    color: 'Space Grey', year: 2025, rating: 4.8, totalRentals: 245,
    features: ['Touchscreen', '0-40 in 3.3s', 'Google Maps', 'OTA Updates'],
    location: 'Bangalore - HSR Layout', available: true, image: '⚡',
  },
  {
    id: 'sc5', category: 'scooty', name: 'Yamaha Fascino 125',
    brand: 'Yamaha', cc: 125, fuelType: 'Petrol', mileage: '50 km/l',
    pricePerHour: 30, pricePerDay: 300, securityDeposit: 1000,
    color: 'Vivid Red', year: 2025, rating: 4.4, totalRentals: 310,
    features: ['Side Stand Engine Cut-off', 'Bluetooth', 'LED Headlamp', 'Smart Motor Generator'],
    location: 'Delhi - Karol Bagh', available: true, image: '🛵',
  },
  {
    id: 'sc6', category: 'scooty', name: 'Ola S1 Pro (Electric)',
    brand: 'Ola', cc: 0, fuelType: 'Electric', mileage: '135 km range',
    pricePerHour: 45, pricePerDay: 450, securityDeposit: 2000,
    color: 'Jet Black', year: 2025, rating: 4.3, totalRentals: 178,
    features: ['Touchscreen', 'MoveOS', 'Cruise Control', 'Hill Hold'],
    location: 'Hyderabad - Gachibowli', available: true, image: '⚡',
  },
  {
    id: 'sc7', category: 'scooty', name: 'Hero Destini 125 Xtec',
    brand: 'Hero', cc: 125, fuelType: 'Petrol', mileage: '52 km/l',
    pricePerHour: 28, pricePerDay: 280, securityDeposit: 800,
    color: 'Panther Black', year: 2024, rating: 4.3, totalRentals: 267,
    features: ['i3S', 'Bluetooth', 'Digital-Analog Console', 'Integrated Braking'],
    location: 'Goa - Margao', available: true, image: '🛵',
  },
];

export const useRentalStore = create(
  persist(
    (set, get) => ({
      rentalVehicles: RENTAL_VEHICLES,
      activeRentals: [],
      rentalHistory: [],

      getRentalVehicle: (id) => get().rentalVehicles.find(v => v.id === id),

      bookRental: async (vehicleId, duration, durationType) => {
    const vehicle = RENTAL_VEHICLES.find(v => v.id === vehicleId);
    if (!vehicle) return { error: 'Vehicle not found' };

    const totalCost = durationType === 'hourly'
      ? vehicle.price_per_hour * duration || vehicle.pricePerHour * duration
      : vehicle.price_per_day * duration || vehicle.pricePerDay * duration;

    const securityDeposit = vehicle.security_deposit || vehicle.securityDeposit;
    const totalPayable = totalCost + securityDeposit;

    // Deduct from wallet
    const walletSuccess = await useWalletStore.getState().deductMoney(
      totalPayable,
      `Rental: ${vehicle.name} (${duration} ${durationType === 'hourly' ? 'hr' : 'day'}${duration > 1 ? 's' : ''}) + ₹${securityDeposit} deposit`
    );

    if (!walletSuccess) return { error: 'Insufficient wallet balance' };

    const rental = {
      id: 'RNT-' + uuidv4().slice(0, 8).toUpperCase(),
      userId: useAuthStore.getState().user?.id,
      vehicleId,
      vehicleName: vehicle.name,
      vehicleCategory: vehicle.category,
      vehicleImage: vehicle.image,
      brand: vehicle.brand,
      location: vehicle.location,
      duration,
      durationType,
      rentalCost: totalCost,
      securityDeposit: vehicle.securityDeposit,
      totalPaid: totalPayable,
      status: 'active', // active, returned, cancelled
      bookedAt: new Date().toISOString(),
      returnBy: new Date(Date.now() + (durationType === 'hourly' ? duration * 3600000 : duration * 86400000)).toISOString(),
      returnedAt: null,
    };

    // Mark vehicle as unavailable
    set(state => ({
      rentalVehicles: state.rentalVehicles.map(v =>
        v.id === vehicleId ? { ...v, available: false } : v
      ),
      activeRentals: [rental, ...state.activeRentals],
    }));

    return rental;
  },

  returnRental: async (rentalId) => {
    const { activeRentals } = get();
    const rental = activeRentals.find(r => r.id === rentalId);
    if (!rental) return null;

    // Refund security deposit
    await useWalletStore.getState().refundMoney(
      rental.securityDeposit,
      `Deposit refund: ${rental.vehicleName}`
    );

    // Mark vehicle as available again
    set(state => ({
      rentalVehicles: state.rentalVehicles.map(v =>
        v.id === rental.vehicleId ? { ...v, available: true, totalRentals: v.totalRentals + 1 } : v
      ),
      activeRentals: state.activeRentals.filter(r => r.id !== rentalId),
      rentalHistory: [{ ...rental, status: 'returned', returnedAt: new Date().toISOString() }, ...state.rentalHistory],
    }));

    return rental;
  },

  cancelRental: async (rentalId) => {
    const { activeRentals } = get();
    const rental = activeRentals.find(r => r.id === rentalId);
    if (!rental) return null;

    // Full refund (rental + deposit)
    await useWalletStore.getState().refundMoney(
      rental.totalPaid,
      `Rental cancelled: ${rental.vehicleName} (Full refund)`
    );

    set(state => ({
      rentalVehicles: state.rentalVehicles.map(v =>
        v.id === rental.vehicleId ? { ...v, available: true } : v
      ),
      activeRentals: state.activeRentals.filter(r => r.id !== rentalId),
        rentalHistory: [{ ...rental, status: 'cancelled', returnedAt: new Date().toISOString() }, ...state.rentalHistory],
      }));

      return rental;
    },
  }),
  {
    name: 'rental-storage',
  }
)
);

// ===== CHAT STORE =====
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;
      
      set({ isLoading: true });
      const { data, error } = await supabase.from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Silently handle auth/RLS errors (e.g. 'missing sub claim')
        // These occur when user is logged in via custom auth, not Supabase Auth
        const msg = error.message || '';
        if (msg.includes('missing sub claim') || msg.includes('JWT') || error.code === 'PGRST301') {
          console.warn('Notification fetch skipped (no auth session):', msg);
          set({ isLoading: false });
          return;
        }
        throw error;
      }
      set({ notifications: data || [], isLoading: false });
    } catch (err) {
      // Don't show toast for auth errors — just log silently
      const msg = err?.message || '';
      if (!msg.includes('missing sub claim') && !msg.includes('JWT')) {
        console.error('Error fetching notifications:', err);
      }
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const { error } = await supabase.from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      }));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;
      
      const { error } = await supabase.from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true }))
      }));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }
}));

export const useChatStore = create((set, get) => ({
  conversations: [],
  messages: [],
  isChatOpen: false,
  activeConversationId: null,
  realtimeSubscription: null,

  toggleChat: () => set(state => ({ isChatOpen: !state.isChatOpen })),
  openChat: (conversationId = null) => {
    set({ isChatOpen: true, activeConversationId: conversationId });
    if (conversationId) get().fetchMessages(conversationId);
  },
  closeChat: () => set({ isChatOpen: false, activeConversationId: null }),

  fetchConversations: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    // Fetch conversations where user is participant1 or participant2
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);
      
    if (!error && data) {
      set({ conversations: data });
    }
  },

  fetchAdminConversations: async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('type', 'support');
      
    if (!error && data) {
      set({ conversations: data });
    }
  },

  fetchMessages: async (conversationId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      // Map to camelCase to match our UI
      const mapped = data.map(m => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        content: m.content,
        isRead: m.is_read,
        createdAt: m.created_at
      }));
      set({ messages: mapped });
    }
  },
  
  startSupportChat: async () => {
    const { conversations } = get();
    const userId = useAuthStore.getState().user?.id || 'guest';
    
    let supportConv = conversations.find(c => c.type === 'support' && c.participant1_id === userId);
    
    if (!supportConv) {
      const newConvId = 'conv-' + uuidv4().slice(0, 8);
      const newConv = {
        id: newConvId,
        type: 'support',
        participant1_id: userId,
        participant2_id: 'bot',
        title: 'YatraGo Assistant'
      };
      
      const { error } = await supabase.from('conversations').insert([newConv]);
      if (!error) {
        supportConv = newConv;
        set({ conversations: [...conversations, supportConv] });
        get().sendMessage(newConvId, 'Hello! I am the YatraGo Assistant. I can help you with wallet balance, ticket status, or rental issues. How can I help you today?', 'bot');
      }
    }
    
    set({ activeConversationId: supportConv.id, isChatOpen: true });
    get().fetchMessages(supportConv.id);
    return supportConv.id;
  },

  startPeerChat: async (referenceId, ownerId, ownerName, type = 'booking') => {
    const { conversations } = get();
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;

    let conv = conversations.find(c => c.reference_id === referenceId && c.participant1_id === userId);
    
    if (!conv) {
      const newConvId = 'conv-' + uuidv4().slice(0, 8);
      conv = {
        id: newConvId,
        type, 
        reference_id: referenceId,
        participant1_id: userId,
        participant2_id: ownerId,
        title: `Chat with ${ownerName} (Ref: ${referenceId})`
      };
      
      const { error } = await supabase.from('conversations').insert([conv]);
      if (!error) {
        set({ conversations: [...conversations, conv] });
      }
    }
    
    set({ activeConversationId: conv.id, isChatOpen: true });
    get().fetchMessages(conv.id);
    return conv.id;
  },

  sendMessage: async (conversationId, content, senderId) => {
    const { messages, conversations } = get();
    const newMsgId = 'msg-' + uuidv4().slice(0, 8);
    const newMsg = {
      id: newMsgId,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      is_read: false
    };
    
    const uiMsg = {
      id: newMsgId,
      conversationId,
      senderId,
      content,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    // Optimistic update
    set({ messages: [...messages, uiMsg] });

    await supabase.from('messages').insert([newMsg]);

    // Bot Logic
    const conv = conversations.find(c => c.id === conversationId);
    if (conv && conv.type === 'support' && senderId !== 'bot') {
      setTimeout(() => get().processBotResponse(conversationId, content), 1000);
    }
  },

  processBotResponse: (conversationId, userText) => {
    const text = userText.toLowerCase();
    
    // Language Detection Helpers
    const isMarathi = text.match(/\b(kase|ahas|ahes|kiti|aahe|ahet|majhe|ushir|vela|bhadyane|bhadya|pahije|karaycha|kasa)\b/);
    const isHindi = text.match(/\b(kaise|kitne|mera|deri|der|kab|chahiye|karein|hain|ho)\b/);
    const isEnglish = text.match(/\b(how|what|when|my|where|is|are|can|will|need|want|delay|late|time|wallet|balance|rent)\b/);
    
    let detectedLang = 'english';
    if (isMarathi) detectedLang = 'marathi';
    else if (isHindi) detectedLang = 'hindi';

    let botReply = '';
    
    // --- HELLO / GREETINGS ---
    if (text.match(/\b(namaskar|kase ahat|kasa ahes|namaste|pranam|kaise ho|hello|hi|hey)\b/)) {
      if (detectedLang === 'marathi' || text.includes('namaskar')) botReply = "Namaskar! YatraGo madhye tumche swagat aahe. Me tumchi pravasat kashi madat karu shakto?";
      else if (detectedLang === 'hindi' || text.includes('namaste') || text.includes('pranam')) botReply = "Namaste! YatraGo mein aapka swagat hai. Main aapki yatra mein kaise madad kar sakta hoon?";
      else botReply = "Hello there! Welcome to YatraGo. How can I assist you with your travel today?";
    }
    
    // --- WALLET / BALANCE ---
    else if (text.match(/\b(wallet|balance|money|paise|batwa|batua|rupee|rakkam)\b/)) {
      const balance = useWalletStore.getState().balance;
      if (detectedLang === 'marathi') botReply = `Tumchya wallet madhye ₹${balance} ahet. Tumhi Wallet page varun ankin paise securely add karu shakta.`;
      else if (detectedLang === 'hindi') botReply = `Aapke wallet mein ₹${balance} hain. Aap Wallet page se aur paise securely add kar sakte hain.`;
      else botReply = `Your current wallet balance is ₹${balance}. You can add more funds securely from the Wallet page.`;
    }
    
    // --- DELAY / LATE ---
    else if (text.match(/\b(late|delay|time|ushir|deri|vela|der)\b/)) {
      if (detectedLang === 'marathi') botReply = "Jara tumchi bus kiva vehicle late asel, tar 'My Bookings' madhye jaun 'Chat with Driver' var click kara. Number share na karta tumhi tyanchyashi bolu shakta. Tumhi Live Tracking sudha pahu shakta.";
      else if (detectedLang === 'hindi') botReply = "Agar aapki bus ya vehicle late hai, toh 'My Bookings' mein jaakar 'Chat with Driver' par click karein. Aap bina number share kiye unse baat kar sakte hain. Live Tracking page se location bhi dekh sakte hain.";
      else botReply = "If your bus or vehicle is late, you can go to 'My Bookings' and click 'Chat with Driver' to message them directly without sharing your phone number. You can also track the live location from the Live Tracking page.";
    }
    
    // --- TICKET / BOOKING / CANCEL ---
    else if (text.match(/\b(ticket|booking|cancel|radd|cancle)\b/)) {
      if (detectedLang === 'marathi') botReply = "Tumhi 'My Bookings' section madhun tumche ticket pahu kiva cancel karu shakta. Cancel kelyas policy nusar thodi fee lagu shakte.";
      else if (detectedLang === 'hindi') botReply = "Aap 'My Bookings' section se apni ticket dekh, download ya cancel kar sakte hain. Cancellation par policy ke mutabiq thodi fee lag sakti hai.";
      else botReply = "You can view, cancel, or download your tickets directly from the 'My Bookings' section. Cancellations may incur a small fee based on the policy.";
    }
    
    // --- RENTALS / BIKES ---
    else if (text.match(/\b(rent|bike|scooty|kirae|bhadyane|bhadya|kiraya)\b/)) {
      if (detectedLang === 'marathi') botReply = "Vehicle bhadyane ghenyasathi 'Rentals' tab madhye jaa. Laksha theva, security deposit dyava lagto jo vehicle parat kelyavar purna wapas kela jato.";
      else if (detectedLang === 'hindi') botReply = "Vehicle kirae par lene ke liye 'Rentals' tab mein jayein. Dhyan rahe, security deposit dena hota hai jo vehicle sahi salamat wapas karne par pura refund ho jata hai.";
      else botReply = "To rent a vehicle, go to the 'Rentals' tab. Please note that a security deposit is required and will be fully refunded upon safe return.";
    }
    
    // --- ESCALATION FALLBACK (EVERY OTHER PROBLEM) ---
    else {
      if (detectedLang === 'marathi') botReply = "Mala maaf kara, pan mala ha prashna samajla nahi. Tumhala kontihi itar adchan aslyas, krupaya aamchya Customer Care Head la admin@yatraGo.com var mail kiva call karun sampark sadha. Te tumchi samasya nantar sodavtil.";
      else if (detectedLang === 'hindi') botReply = "Maaf kijiye, mujhe yeh samajh nahi aaya. Agar aapko koi aur pareshani aa rahi hai, toh kripya humare Customer Care Head ko admin@yatraGo.com par mail ya call karein. Woh aapki samasya ka samadhan karenge.";
      else botReply = "I'm sorry, I couldn't quite understand your request. If you are facing any other issue, please contact our Customer Care Head via call or email at admin@yatraGo.com. They will escalate and resolve your problem immediately.";
    }

    get().sendMessage(conversationId, botReply, 'bot');
  },

  setupRealtimeSubscription: () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const { conversations, activeConversationId } = get();
          const newDbMsg = payload.new;
          
          // Check if this message belongs to any of our conversations
          const conv = conversations.find(c => c.id === newDbMsg.conversation_id);
          
          if (conv) {
            // Only handle if it's not our own message (we optimistically update those)
            if (newDbMsg.sender_id !== user.id) {
              const uiMsg = {
                id: newDbMsg.id,
                conversationId: newDbMsg.conversation_id,
                senderId: newDbMsg.sender_id,
                content: newDbMsg.content,
                isRead: newDbMsg.is_read,
                createdAt: newDbMsg.created_at
              };
              
              // Only add if it doesn't already exist (in case optimistic update somehow raced, though sender_id is checked)
              set({ messages: [...get().messages, uiMsg] });
              
              // If chat is not open or not on this conversation, show notification
              if (!get().isChatOpen || activeConversationId !== conv.id) {
                const title = conv.title || (conv.type === 'support' ? 'YatraGo Assistant' : 'New Message');
                useToastStore.getState().addToast(`New message from ${title}: ${newDbMsg.content}`, 'info');
              }
            }
          }
        }
      )
      .subscribe();
      
    set({ realtimeSubscription: channel });
  },

  cleanupRealtimeSubscription: () => {
    const { realtimeSubscription } = get();
    if (realtimeSubscription) {
      supabase.removeChannel(realtimeSubscription);
      set({ realtimeSubscription: null });
    }
  }
}));

// ==========================================
// 12. HOLIDAY PACKAGES STORE
// ==========================================
export const usePackageStore = create((set, get) => ({
  packages: [],
  isLoading: false,
  
  fetchPackages: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('holiday_packages').select('*');
      if (error) throw error;
      if (data) set({ packages: data });
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      set({ isLoading: false });
    }
  },
  
  getPackage: (id) => get().packages.find(p => p.id === id),
  
  createPackage: async (pkg) => {
    try {
      const { data, error } = await supabase.from('holiday_packages').insert([pkg]).select().single();
      if (error) throw error;
      set(state => ({ packages: [...state.packages, data] }));
      return { success: true, data };
    } catch (err) {
      console.error('Error creating package:', err);
      return { success: false, error: err.message };
    }
  }
}));

// ==========================================
// 13. ACCOMMODATIONS STORE
// ==========================================
export const useAccommodationStore = create((set, get) => ({
  accommodations: [],
  isLoading: false,
  
  fetchAccommodations: async (destination = null) => {
    set({ isLoading: true });
    try {
      let query = supabase.from('accommodations').select('*').eq('status', 'approved');
      if (destination) {
        query = query.ilike('destination', `%${destination}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) set({ accommodations: data });
    } catch (err) {
      console.error('Error fetching accommodations:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHostAccommodations: async (hostId) => {
    try {
      const { data, error } = await supabase.from('accommodations').select('*').eq('host_id', hostId);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching host accommodations:', err);
      return [];
    }
  },
  
  createAccommodation: async (acc) => {
    try {
      const { data, error } = await supabase.from('accommodations').insert([acc]).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error creating accommodation:', err);
      return { success: false, error: err.message };
    }
  }
}));

// ==========================================
// 14. LOCAL CUISINES STORE
// ==========================================
export const useFoodStore = create((set, get) => ({
  cuisines: [],
  isLoading: false,
  
  fetchCuisines: async (destination = null) => {
    set({ isLoading: true });
    try {
      let query = supabase.from('local_cuisines').select('*');
      if (destination) {
        query = query.ilike('destination', `%${destination}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) set({ cuisines: data });
    } catch (err) {
      console.error('Error fetching cuisines:', err);
    } finally {
      set({ isLoading: false });
    }
  },
  
  createCuisine: async (cuisine) => {
    try {
      const { data, error } = await supabase.from('local_cuisines').insert([cuisine]).select().single();
      if (error) throw error;
      set(state => ({ cuisines: [...state.cuisines, data] }));
      return { success: true, data };
    } catch (err) {
      console.error('Error creating cuisine:', err);
      return { success: false, error: err.message };
    }
  }
}));

// ==========================================
// 15. PROMO CODES STORE
// ==========================================
export const usePromoStore = create((set, get) => ({
  promos: [],
  isLoading: false,
  
  fetchPromos: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ promos: data || [] });
    } catch (err) {
      console.error('Error fetching promos:', err);
    } finally {
      set({ isLoading: false });
    }
  },
  
  createPromo: async (promo) => {
    try {
      const { data, error } = await supabase.from('promo_codes').insert([promo]).select().single();
      if (error) throw error;
      set(state => ({ promos: [data, ...state.promos] }));
      return { success: true, data };
    } catch (err) {
      console.error('Error creating promo:', err);
      return { success: false, error: err.message };
    }
  },

  updatePromoStatus: async (id, isActive) => {
    try {
      const { error } = await supabase.from('promo_codes').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      set(state => ({
        promos: state.promos.map(p => p.id === id ? { ...p, is_active: isActive } : p)
      }));
      return true;
    } catch (err) {
      console.error('Error updating promo:', err);
      return false;
    }
  }
}));

// ==========================================
// 16. SUPPORT TICKETS STORE
// ==========================================
export const useSupportStore = create((set, get) => ({
  tickets: [],
  isLoading: false,
  
  fetchAllTickets: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ tickets: data || [] });
    } catch (err) {
      console.error('Error fetching all tickets:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserTickets: async (userId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      set({ tickets: data || [] });
    } catch (err) {
      console.error('Error fetching user tickets:', err);
    } finally {
      set({ isLoading: false });
    }
  },
  
  createTicket: async (ticket) => {
    try {
      const { data, error } = await supabase.from('support_tickets').insert([ticket]).select().single();
      if (error) throw error;
      set(state => ({ tickets: [data, ...state.tickets] }));
      return { success: true, data };
    } catch (err) {
      console.error('Error creating ticket:', err);
      return { success: false, error: err.message };
    }
  },

  addMessage: async (ticketId, message) => {
    try {
      const ticket = get().tickets.find(t => t.id === ticketId);
      if (!ticket) throw new Error("Ticket not found");
      
      const newMessages = [...(ticket.messages_json || []), message];
      
      const { data, error } = await supabase.from('support_tickets')
        .update({ messages_json: newMessages, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw error;
      
      set(state => ({
        tickets: state.tickets.map(t => t.id === ticketId ? data : t)
      }));
      return { success: true };
    } catch (err) {
      console.error('Error adding message:', err);
      return { success: false, error: err.message };
    }
  },

  updateTicketStatus: async (ticketId, status) => {
    try {
      const { data, error } = await supabase.from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw error;
      set(state => ({
        tickets: state.tickets.map(t => t.id === ticketId ? data : t)
      }));
      return true;
    } catch (err) {
      console.error('Error updating status:', err);
      return false;
    }
  }
}));

// ==========================================
// 17. REVIEWS STORE
// ==========================================
export const useReviewStore = create((set, get) => ({
  reviews: [],
  isLoading: false,

  fetchReviews: async (targetType, targetId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, target_type, target_id, rating, comment, created_at,
          users ( id, name, avatar_url )
        `)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      set({ reviews: data || [] });
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addReview: async (review) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([review])
        .select(`
          id, target_type, target_id, rating, comment, created_at,
          users ( id, name, avatar_url )
        `)
        .single();
        
      if (error) throw error;
      set(state => ({ reviews: [data, ...state.reviews] }));
      return { success: true, data };
    } catch (err) {
      console.error('Error adding review:', err);
      return { success: false, error: err.message };
    }
  }
}));
