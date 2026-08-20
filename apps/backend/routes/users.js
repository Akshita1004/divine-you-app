import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Helper to extract Auth User ID
async function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// HELPER: Sync Auth User into public.profiles Table
async function ensureProfileExists(userId, email, fullName) {
  try {
    if (!userId || !email) return;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      // Insert new profile record
      await supabase.from('profiles').insert([
        {
          id: userId,
          email: email.trim().toLowerCase(),
          full_name: fullName || 'Divine Customer',
          role: 'customer',
        },
      ]);
    } else if (fullName && existingProfile.full_name !== fullName) {
      // Update full_name if name changed
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId);
    }
  } catch (err) {
    console.error('Error in ensureProfileExists:', err.message);
  }
}

// 1. Send / Resend Email OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        data: { full_name: name || 'Divine Customer' },
        shouldCreateUser: true,
      },
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'OTP sent to email successfully' });
  } catch (err) {
    console.error('Send OTP Error:', err);
    res.status(500).json({ success: false, message: 'Server error during OTP request' });
  }
});

// 2. Verify Email OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, type } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpToken = otp.trim();

    let otpType = type || 'email';
    let { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: otpToken,
      type: otpType,
    });

    if (error && !type) {
      const fallbackResult = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otpToken,
        type: 'signup',
      });
      if (!fallbackResult.error) {
        data = fallbackResult.data;
        error = null;
      }
    }

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const userId = data.user?.id;
    const userEmail = data.user?.email || cleanEmail;
    const userName = data.user?.user_metadata?.full_name || 'Divine Customer';

    // Auto-save to public.profiles table
    if (userId) {
      await ensureProfileExists(userId, userEmail, userName);
    }

    const user = {
      id: userId,
      email: userEmail,
      name: userName,
      role: 'customer',
    };

    res.json({
      success: true,
      user,
      token: data.session?.access_token,
      message: 'Verified and logged in successfully',
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ success: false, message: 'Verification server error' });
  }
});

// 3. Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')
      ) {
        return res.status(400).json({
          success: false,
          message: 'Account already exists. Please sign in instead.',
        });
      }
      return res.status(400).json({ success: false, message: error.message });
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Account already exists. Please sign in instead.',
      });
    }

    if (data.user?.id) {
      // Save directly to public.profiles table
      await ensureProfileExists(data.user.id, cleanEmail, name);
    }

    if (data.session) {
      const user = {
        id: data.user?.id,
        email: data.user?.email,
        name,
        role: 'customer',
      };

      return res.status(201).json({
        success: true,
        user,
        token: data.session.access_token,
        message: 'Registration successful',
      });
    }

    res.status(200).json({
      success: true,
      requiresOtp: true,
      email: cleanEmail,
      message: 'OTP code sent to your email. Please verify.',
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// 4. Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const userName = data.user.user_metadata?.full_name || 'Divine Customer';

    // Auto-save/sync to public.profiles table on login
    await ensureProfileExists(data.user.id, cleanEmail, userName);

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: userName,
      role: 'customer',
    };

    res.json({
      success: true,
      user,
      token: data.session?.access_token,
      message: 'Logged in successfully',
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// 5. GET USER ADDRESSES (From DB Table)
router.get('/addresses', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data: addresses, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('DB Fetch Addresses Error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, addresses: addresses || [] });
  } catch (err) {
    console.error('Fetch Addresses Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 6. ADD / UPDATE ADDRESS (To DB Table)
router.post('/addresses', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const addr = req.body;
    const addressId = addr.id || `addr_${Date.now()}`;

    // If marked as default, remove default flag from user's other addresses
    if (addr.isDefault) {
      await supabase
        .from('user_addresses')
        .update({ isDefault: false })
        .eq('user_id', user.id);
    }

    const payload = {
      id: addressId,
      user_id: user.id,
      fullName: addr.fullName,
      mobile: addr.mobile,
      addressLine1: addr.addressLine1,
      apartment: addr.apartment || '',
      pincode: addr.pincode,
      city: addr.city,
      state: addr.state,
      country: addr.country || 'India',
      type: addr.type || 'Home',
      isDefault: !!addr.isDefault,
    };

    const { error: upsertError } = await supabase
      .from('user_addresses')
      .upsert(payload, { onConflict: 'id' });

    if (upsertError) {
      console.error('DB Upsert Address Error:', upsertError.message);
      return res.status(400).json({ success: false, message: upsertError.message });
    }

    // Also update full_name in profiles table if provided in address
    if (addr.fullName) {
      await supabase
        .from('profiles')
        .update({ full_name: addr.fullName })
        .eq('id', user.id);
    }

    // Return latest address list
    const { data: addresses } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    res.json({
      success: true,
      addresses: addresses || [],
      message: 'Address saved successfully!',
    });
  } catch (err) {
    console.error('Add Address Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 7. DELETE ADDRESS (From DB Table)
router.delete('/addresses/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    const { error: deleteErr } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteErr) {
      return res.status(400).json({ success: false, message: deleteErr.message });
    }

    const { data: addresses } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    res.json({
      success: true,
      addresses: addresses || [],
      message: 'Address deleted successfully',
    });
  } catch (err) {
    console.error('Delete Address Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;