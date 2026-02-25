import { X, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimiter';

// Google Client ID — set this in your Google Cloud Console
// For now we'll use a placeholder; replace with your real client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Google Sign-In handler
  const handleGoogleCallback = useCallback(async (response: any) => {
    setError(null);
    setLoading(true);
    try {
      const result = await (supabase.auth as any).signInWithGoogle(response.credential);
      if (result.error) {
        throw new Error(result.error.message || 'Google sign-in failed');
      }
      setMessage('✅ Signed in with Google!');
      onClose();
      // Check if admin
      if (result.data?.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', result.data.user.id)
          .maybeSingle();
        if (roleData?.role === 'admin') navigate('/admin');
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [onClose, navigate]);

  // Load Google Identity Services script
  useEffect(() => {
    if (!isOpen || !GOOGLE_CLIENT_ID) return;

    const scriptId = 'google-gis-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Initialize Google Sign-In when script loads
    const initGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
      }
    };

    // Check if already loaded
    if ((window as any).google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.getElementById(scriptId);
      script?.addEventListener('load', initGoogle);
    }
  }, [isOpen, handleGoogleCallback]);

  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured yet. Please use email/password.');
      return;
    }
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    } else {
      setError('Google Sign-In is loading, please try again.');
    }
  };

  if (!isOpen) return null;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Rate limiting: 3 attempts per minute for signup
    const rl = rateLimit(`signup-${email}`, 3);
    if (!rl.allowed) {
      setError(`Too many attempts. Please try again in ${Math.ceil((rl.resetTime - Date.now()) / 1000)}s`);
      return;
    }

    // Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Starting signup process for:', email);

      // Create auth account — the DB trigger (handle_new_user) automatically
      // creates the user_profiles and user_roles entries
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: email.split('@')[0],
          },
        },
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        // Friendly error messages
        if (authError.message.includes('already registered')) {
          throw new Error('This email is already registered. Try signing in instead.');
        }
        throw new Error(authError.message || 'Failed to create account');
      }

      if (!authData.user) {
        throw new Error('No user returned from signup');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Check if email confirmation is required
      if (authData.user.identities?.length === 0) {
        setMessage('📧 A confirmation email has been sent. Please check your inbox and confirm your email before signing in.');
      } else if (authData.session) {
        // Auto-confirmed, user is logged in
        setMessage('✅ Account created and signed in!');
        onClose();
      } else {
        setMessage('✅ Account created! You can now sign in with your credentials.');
        setMode('login');
      }

      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('❌ Signup error:', err);
      const errorMsg = err?.message || 'Failed to create account. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Rate limiting: 5 attempts per minute for login
    const rl = rateLimit(`login-${email}`, 5);
    if (!rl.allowed) {
      setError(`Too many attempts. Please try again in ${Math.ceil((rl.resetTime - Date.now()) / 1000)}s`);
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Starting login process for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        throw new Error(error.message || 'Invalid email or password');
      }

      if (!data.user) {
        throw new Error('No user returned from login');
      }

      console.log('✅ Login successful for user:', data.user.id);

      // Check if admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (roleData?.role === 'admin') {
        console.log('👑 Admin user detected, redirecting...');
        navigate('/admin');
      }

      setMessage('✅ Login successful!');
      onClose();
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const errorMsg = err?.message || 'Failed to sign in. Please check your credentials.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Rate limiting: 2 attempts per minute for password reset
    const rl = rateLimit(`reset-${email}`, 2);
    if (!rl.allowed) {
      setError(`Too many attempts. Please try again in ${Math.ceil((rl.resetTime - Date.now()) / 1000)}s`);
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Sending password reset email to:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        console.error('❌ Reset error:', error);
        throw error;
      }

      console.log('✅ Password reset email sent');
      setMessage('✅ Password reset email sent! Check your inbox.');
      setEmail('');
    } catch (err: any) {
      console.error('❌ Password reset error:', err);
      const errorMsg = err?.message || 'Failed to send reset email';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (mode === 'login') {
      await handleLogin(e);
    } else if (mode === 'signup') {
      await handleSignUp(e);
    } else if (mode === 'reset') {
      await handlePasswordReset(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 px-4 py-6">
      <div className="w-full max-w-[380px] rounded-lg border border-slate-700 bg-slate-900 shadow-2xl transition-all duration-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-700 p-4 sm:p-5">
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
              {message}
            </div>
          )}

          {mode !== 'reset' && (
            <>
              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex items-center justify-center gap-3 w-full px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50 border border-gray-200"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
              <div className="relative mb-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-400">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              placeholder="you@example.com"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:opacity-50 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
              )}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:opacity-50 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                {mode === 'login' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending email...'}
              </span>
            ) : (
              mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'
            )}
          </button>

          <div className="space-y-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                    setMessage(null);
                  }}
                  className="block w-full text-slate-400 hover:text-white"
                >
                  Forgot password?
                </button>
                <div className="text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-red-600 hover:text-red-500 font-semibold"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}
            {mode === 'signup' && (
              <div className="text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-red-600 hover:text-red-500 font-semibold"
                >
                  Sign in
                </button>
              </div>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setMessage(null);
                }}
                className="block w-full text-slate-400 hover:text-white"
              >
                Back to sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
