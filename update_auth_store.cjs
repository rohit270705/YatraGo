const fs = require('fs');

const storePath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\scratch\\tours_travels\\src\\store.js';
let content = fs.readFileSync(storePath, 'utf8');

// Replace register
const oldRegister = `      register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      // For now, we are just inserting into our custom 'users' table, not using Supabase Auth
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          name: userData.name,
          phone: userData.phone || null,
          role: userData.role || 'passenger',
          blood_group: userData.bloodGroup || null,
          aadhar_number: userData.aadharNumber || null,
          pan_number: userData.panNumber || null,
          avatar_url: userData.avatarUrl || null,
          dob: userData.dob || null,
          email_verified: false,
          phone_verified: false
        }])
        .select()
        .single();

      if (error) throw error;

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
  },`;

const newRegister = `      register: async (userData) => {
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
  },`;

content = content.replace(oldRegister, newRegister);

// Replace Login
const oldLogin = `      // In a real app with Supabase Auth, you'd use supabase.auth.signInWithPassword
      // Since we are mocking passwords but using a real DB, we just lookup the user by email
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', role || 'passenger')
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(\`Supabase Error: \${error.message || JSON.stringify(error)}\`);
      }
      if (!data) {
        throw new Error('Invalid email or role. User not found.');
      }

      const { activeSessions } = get();
      if (activeSessions.length >= 4) {
        throw new Error('Maximum device limit reached (4 devices). Please log out from another device.');
      }`;

const newLogin = `      // Authenticate with Supabase Auth
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
        throw new Error(\`Supabase Error: \${error.message || JSON.stringify(error)}\`);
      }
      
      if (role && data.role !== role) {
        await supabase.auth.signOut();
        throw new Error('Invalid role. Please select the correct account type.');
      }

      const { activeSessions } = get();
      if (activeSessions.length >= 4) {
        throw new Error('Maximum device limit reached (4 devices). Please log out from another device.');
      }`;

content = content.replace(oldLogin, newLogin);

// Replace Logout
const oldLogout = `  logout: () => set({ user: null, isAuthenticated: false, activeSessions: [], error: null }),`;
const newLogout = `  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, activeSessions: [], error: null });
  },`;

content = content.replace(oldLogout, newLogout);

fs.writeFileSync(storePath, content);
console.log("Updated store.js auth methods");
