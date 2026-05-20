import { useState, useCallback, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Loader2, CheckCircle2, XCircle, AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Validation helpers
const validators = {
  email: (value) => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  },
  password: (value, isLogin) => {
    if (!value) return 'Password is required';
    if (!isLogin && value.length < 6) return 'Password must be at least 6 characters';
    return '';
  },
  confirmPassword: (value, password) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return '';
  },
};

// Password strength calculator
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
  if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-teal-500' };
  return { score: 5, label: 'Very Strong', color: 'bg-emerald-500' };
};

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const emailRef = useRef(null);

  // Network connectivity listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Focus email input on mount and tab switch
  useEffect(() => {
    emailRef.current?.focus();
  }, [isLogin]);

  // Real-time field validation on blur
  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      if (field === 'email') newErrors.email = validators.email(email);
      if (field === 'password') newErrors.password = validators.password(password, isLogin);
      if (field === 'confirmPassword') newErrors.confirmPassword = validators.confirmPassword(confirmPassword, password);
      return newErrors;
    });
  }, [email, password, confirmPassword, isLogin]);

  // Clear field error when user starts typing
  const handleFieldChange = useCallback((field, value, setter) => {
    setter(value);
    if (touched[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear global error when user starts correcting
    if (error) setError('');
  }, [touched, error]);

  // Password match indicator (real-time)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsDontMatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordStrength = !isLogin ? getPasswordStrength(password) : null;

  const handleTabSwitch = useCallback((toLogin) => {
    setIsLogin(toLogin);
    setError('');
    setFieldErrors({ email: '', password: '', confirmPassword: '' });
    setTouched({ email: false, password: false, confirmPassword: false });
    setShowPassword(false);
    setShowConfirmPassword(false);
    // Keep email, clear passwords
    setPassword('');
    setConfirmPassword('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const emailError = validators.email(email);
    const passwordError = validators.password(password, isLogin);
    const confirmError = !isLogin ? validators.confirmPassword(confirmPassword, password) : '';

    setFieldErrors({ email: emailError, password: passwordError, confirmPassword: confirmError });
    setTouched({ email: true, password: true, confirmPassword: true });

    // If any validation errors, stop
    if (emailError || passwordError || confirmError) {
      return;
    }

    // Check network before attempting
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      let errorMessage = 'Authentication failed';

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes('not found') || msg.includes('user not found')) {
          errorMessage = 'No account found with this email. Please create an account first.';
        } else if (msg.includes('invalid credentials') || msg.includes('incorrect') || msg.includes('invalid') || msg.includes('password')) {
          errorMessage = 'Incorrect email or password. Please try again.';
        } else if (msg.includes('already exists') || msg.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (msg.includes('weak') || msg.includes('too short')) {
          errorMessage = 'Password is too weak. Use at least 6 characters.';
        } else if (msg.includes('validation') || msg.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitting = isLoading;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-125 h-125 bg-teal-500/8 rounded-full blur-3xl" />
      </div>

      {/* Auth Card */}
      <div className="relative w-full max-w-sm">
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-zinc-950" />
            </div>
            <span className="text-xl font-semibold text-white">MarketSense AI</span>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-zinc-800/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => handleTabSwitch(true)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isLogin
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabSwitch(false)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                !isLogin
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Offline Banner */}
          {!isOnline && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/40 rounded-lg flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-yellow-300 text-xs font-medium">You are offline. Please check your internet connection.</p>
            </div>
          )}

          {/* Global Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <div className="flex gap-2">
                <div className="text-red-400 mt-0.5 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-red-400 text-sm font-medium">Authentication Error</p>
                  <p className="text-red-300/80 text-sm mt-1">{error}</p>
                  {/* Contextual suggestions */}
                  {error.includes('No account found') && (
                    <button
                      onClick={() => handleTabSwitch(false)}
                      className="text-teal-400 text-xs mt-2 hover:text-teal-300 underline underline-offset-2 transition-colors"
                    >
                      Create an account instead →
                    </button>
                  )}
                  {error.includes('already exists') && (
                    <button
                      onClick={() => handleTabSwitch(true)}
                      className="text-teal-400 text-xs mt-2 hover:text-teal-300 underline underline-offset-2 transition-colors"
                    >
                      Sign in instead →
                    </button>
                  )}
                  {error.includes('Unable to connect') && (
                    <button
                      onClick={handleSubmit}
                      className="flex items-center gap-1 text-teal-400 text-xs mt-2 hover:text-teal-300 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
                  onBlur={() => handleBlur('email')}
                  placeholder="Email address"
                  className={`w-full bg-zinc-800/50 border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-all ${
                    touched.email && fieldErrors.email
                      ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/50'
                      : 'border-zinc-700 focus:border-teal-500 focus:ring-teal-500/50'
                  }`}
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
              {touched.email && fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Password"
                  className={`w-full bg-zinc-800/50 border rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-all ${
                    touched.password && fieldErrors.password
                      ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/50'
                      : 'border-zinc-700 focus:border-teal-500 focus:ring-teal-500/50'
                  }`}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
              {/* Password Strength Indicator (signup only) */}
              {!isLogin && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.score ? passwordStrength.color : 'bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] ${
                    passwordStrength.score <= 1 ? 'text-red-400' :
                    passwordStrength.score <= 2 ? 'text-orange-400' :
                    passwordStrength.score <= 3 ? 'text-yellow-400' :
                    'text-teal-400'
                  }`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password - Only for signup */}
            {!isLogin && (
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value, setConfirmPassword)}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="Confirm password"
                    className={`w-full bg-zinc-800/50 border rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-all ${
                      passwordsDontMatch || (touched.confirmPassword && fieldErrors.confirmPassword)
                        ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/50'
                        : passwordsMatch
                          ? 'border-teal-500/70 focus:border-teal-500 focus:ring-teal-500/50'
                          : 'border-zinc-700 focus:border-teal-500 focus:ring-teal-500/50'
                    }`}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  {/* Match indicator icon */}
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    {passwordsMatch && (
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    )}
                    {passwordsDontMatch && (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {touched.confirmPassword && fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <XCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.confirmPassword}
                  </p>
                )}
                {passwordsMatch && (
                  <p className="mt-1.5 text-xs text-teal-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    Passwords match
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
