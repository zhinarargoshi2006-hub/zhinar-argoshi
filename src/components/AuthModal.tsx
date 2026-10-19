import React, { useState, useId } from 'react';
import { UILanguage, TargetLanguage } from '../types';
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  registerWithEmailPassword,
  loginWithEmailPassword,
  signInWithGoogle,
  translateFirebaseAuthError,
} from '../firebase';
import {
  evaluatePasswordStrength,
  getLocalizedStrengthLabel,
} from '../utils/passwordStrength';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  onUserAuthenticated?: (user: FirebaseUser, isNewRegistration?: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  targetLang,
  onUserAuthenticated,
}) => {
  if (!isOpen) return null;

  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading and Error states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Unique IDs for form controls
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  // Evaluate password strength
  const strengthResult = evaluatePasswordStrength(password);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setLoading(false);
    setGoogleLoading(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleModeSwitch = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleLoading(true);

    try {
      const res = await signInWithGoogle(targetLang, uiLang);

      if (res.error) {
        setErrorMessage(translateFirebaseAuthError(res.error, uiLang));
        setGoogleLoading(false);
        return;
      }

      setSuccessMessage(
        isAr
          ? 'تم تسجيل الدخول بنجاح عبر حساب Google!'
          : isKu
          ? 'بە سەرکەوتوویی لە ڕێگەی ئەکاونتی گووگڵ چوویتە ژوورەوە!'
          : 'Successfully signed in with Google!'
      );

      if (onUserAuthenticated && res.user) {
        onUserAuthenticated(res.user, !!res.isNewUser);
      }

      setTimeout(() => {
        onClose();
        resetForm();
      }, 900);
    } catch (err: any) {
      setErrorMessage(
        translateFirebaseAuthError(err?.code || 'auth/unknown-error', uiLang)
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage(
        isAr
          ? 'يرجى إدخال عنوان البريد الإلكتروني.'
          : isKu
          ? 'تکایە ناونیشانی ئیمەیڵەکەت بنووسە.'
          : 'Please enter your email address.'
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        isAr
          ? 'يرجى إدخال كلمة المرور.'
          : isKu
          ? 'تکایە وشەی نهێنی بنووسە.'
          : 'Please enter your password.'
      );
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMessage(
          isAr
            ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف.'
            : isKu
            ? 'وشەی نهێنی نابێت لە ٦ پیت کەمتر بێت.'
            : 'Password must be at least 6 characters long.'
        );
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage(
          isAr
            ? 'كلمتا المرور غير متطابقتين.'
            : isKu
            ? 'وشەی نهێنی و دووبارەکردنەوەی یەکناگرنەوە.'
            : 'Passwords do not match.'
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await registerWithEmailPassword(
          cleanEmail,
          password,
          displayName.trim(),
          targetLang,
          uiLang
        );

        if (res.error) {
          setErrorMessage(translateFirebaseAuthError(res.error, uiLang));
          setLoading(false);
          return;
        }

        setSuccessMessage(
          isAr
            ? 'تم إنشاء الحساب بنجاح! مرحباً بك.'
            : isKu
            ? 'ئەکاونتەکەت بە سەرکەوتوویی دروستکرا! بەخێربێیت.'
            : 'Account created successfully! Welcome.'
        );

        if (onUserAuthenticated && res.user) {
          onUserAuthenticated(res.user, true);
        }

        setTimeout(() => {
          onClose();
          resetForm();
        }, 1200);
      } else {
        const res = await loginWithEmailPassword(cleanEmail, password);

        if (res.error) {
          setErrorMessage(translateFirebaseAuthError(res.error, uiLang));
          setLoading(false);
          return;
        }

        setSuccessMessage(
          isAr
            ? 'تم تسجيل الدخول بنجاح!'
            : isKu
            ? 'بە سەرکەوتوویی چوویتە ژوورەوە!'
            : 'Signed in successfully!'
        );

        if (onUserAuthenticated && res.user) {
          onUserAuthenticated(res.user, false);
        }

        setTimeout(() => {
          onClose();
          resetForm();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMessage(
        translateFirebaseAuthError(err?.code || 'auth/unknown-error', uiLang)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {mode === 'signin'
                  ? isAr
                    ? 'تسجيل الدخول إلى حسابك'
                    : isKu
                    ? 'چوونە ژوورەوە بۆ ئەکاونتەکەت'
                    : 'Sign In to Your Account'
                  : isAr
                  ? 'إنشاء حساب جديد'
                  : isKu
                  ? 'دروستکردنی ئەکاونتی نوێ'
                  : 'Create a New Account'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'حفظ تدريباتك الصوتية ومستواك في السحابة'
                  : isKu
                  ? 'هەڵگرتنی مەشقە دەنگییەکان و ئاستی زمانیت'
                  : 'Sync speaking history & CEFR progress'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-2 bg-slate-950/60 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleModeSwitch('signin')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'چوونە ژوورەوە (دخول)' : isKu ? 'چوونە ژوورەوە' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('signup')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'حساب جديد (تسجيل)' : isKu ? 'دروستکردنی ئەکاونت' : 'Create Account'}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div className="flex-1 leading-relaxed font-bold">{successMessage}</div>
            </div>
          )}

          {/* Google Sign-In Quick Action */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/5 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-emerald-400" />
                  <span className="text-slate-300 font-semibold">
                    {isAr
                      ? 'جاري الاتصال بـ Google...'
                      : isKu
                      ? 'پەیوەستبوون بە گووگڵ...'
                      : 'Connecting to Google...'}
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="tracking-wide">
                    {mode === 'signin'
                      ? isAr
                        ? 'تسجيل الدخول عبر Google'
                        : isKu
                        ? 'چوونە ژوورەوە بە گووگڵ'
                        : 'Sign in with Google'
                      : isAr
                      ? 'إنشاء حساب عبر Google'
                      : isKu
                      ? 'تۆمارکردن لە ڕێگەی گووگڵ'
                      : 'Sign up with Google'}
                  </span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400">
              {isAr
                ? '⚡ دخول فوري وآمن بنقرة واحدة بدون كلمة مرور'
                : isKu
                ? '⚡ بە یەک کلیک و بێ پێویستی بە نووسینی پاسۆرد'
                : '⚡ Quick, secure 1-click access without password'}
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] text-slate-500 font-medium px-2 shrink-0">
              {isAr
                ? 'أو عبر البريد الإلكتروني وكلمة المرور'
                : isKu
                ? 'یان لە ڕێگەی ئیمەیڵ و پاسۆرد'
                : 'or with email & password'}
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Full Name field (Register only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label htmlFor={nameId} className="block text-xs font-bold text-slate-300">
                {isAr ? 'الاسم الكامل أو المستعار:' : isKu ? 'ناوی تەواو یان نازناو:' : 'Full Name or Nickname:'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-3 rtl:pl-0 rtl:pr-3 pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id={nameId}
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={isAr ? 'مثال: هێمن کاروان' : isKu ? 'نموونە: هێمن کاروان' : 'e.g. Aso Barzan'}
                  className="w-full py-2.5 pl-9 pr-3 rtl:pl-3 rtl:pr-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <label htmlFor={emailId} className="block text-xs font-bold text-slate-300">
              {isAr ? 'عنوان البريد الإلكتروني:' : isKu ? 'ناونیشانی ئیمەیڵ:' : 'Email Address:'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-3 rtl:pl-0 rtl:pr-3 pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id={emailId}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className="w-full py-2.5 pl-9 pr-3 rtl:pl-3 rtl:pr-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Password field with Show/Hide toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={passwordId} className="block text-xs font-bold text-slate-300">
                {isAr ? 'كلمة المرور:' : isKu ? 'وشەی نهێنی (پاسۆرد):' : 'Password:'}
              </label>

              {/* Show/Hide password toggle link */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إخفاء' : isKu ? 'شاردنەوە' : 'Hide'}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إظهار' : isKu ? 'پیشاندان' : 'Show'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-3 rtl:pl-0 rtl:pr-3 pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                dir="ltr"
                className="w-full py-2.5 pl-9 pr-10 rtl:pl-10 rtl:pr-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-3 rtl:pr-0 rtl:pl-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Strength Meter (Shown live when typing password in signup mode) */}
          {mode === 'signup' && password.length > 0 && (
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400">
                  {isAr ? 'مستوى قوة كلمة المرور:' : isKu ? 'ئاستی بەهێزیی وشەی نهێنی:' : 'Password Strength:'}
                </span>
                <span className={`font-black ${strengthResult.colorClass}`}>
                  {getLocalizedStrengthLabel(strengthResult, uiLang)}
                </span>
              </div>

              {/* Strength Progress Bar Segments */}
              <div className="grid grid-cols-4 gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className={`h-full rounded-full transition-all duration-300 ${
                      seg <= strengthResult.score
                        ? strengthResult.bgColorClass
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Security Requirements Checklist */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                {strengthResult.requirements.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center gap-1.5 transition-colors ${
                      req.met ? 'text-emerald-400 font-medium' : 'text-slate-500'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        req.met ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <span>
                      {isAr ? req.labelAr : isKu ? req.labelKu : req.labelEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Password field (Register only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={confirmPasswordId} className="block text-xs font-bold text-slate-300">
                  {isAr ? 'تأكيد كلمة المرور:' : isKu ? 'دووبارەکردنەوەی وشەی نهێنی:' : 'Confirm Password:'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إخفاء' : isKu ? 'شاردنەوە' : 'Hide'}</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إظهار' : isKu ? 'پیشاندان' : 'Show'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-3 rtl:pl-0 rtl:pr-3 pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id={confirmPasswordId}
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  dir="ltr"
                  className={`w-full py-2.5 pl-9 pr-10 rtl:pl-10 rtl:pr-9 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-600 text-xs sm:text-sm focus:outline-none transition-all font-mono ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                      : confirmPassword && confirmPassword === password
                      ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                      : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-3 rtl:pr-0 rtl:pl-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isAr ? 'جاري المعالجة والتحقق...' : isKu ? 'چاوەڕێبە... دەپشکنرێت' : 'Verifying...'}
                  </span>
                </>
              ) : mode === 'signin' ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {isAr ? 'دخول فوري إلى الحساب' : isKu ? 'چوونە ژوورەوە بۆ ئەکاونت' : 'Sign In to Account'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isAr ? 'تأكيد وإنشاء الحساب' : isKu ? 'دروستکردن و تۆمارکردنی ئەکاونت' : 'Create & Register Account'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer with guest fallback */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {isAr ? 'المتابعة كضيف مؤقت' : isKu ? 'بەردەوامبوون وەک میوان' : 'Continue as Guest'}
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch(mode === 'signin' ? 'signup' : 'signin')}
            className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
          >
            {mode === 'signin'
              ? isAr
                ? 'ليس لديك حساب؟ أنشئ حساباً'
                : isKu
                ? 'ئەکاونتت نییە؟ دروستی بکە'
                : "Don't have an account? Sign up"
              : isAr
              ? 'لديك حساب بالفعل؟ سجل دخولك'
              : isKu
              ? 'پێشتر ئەکاونتت دروستکردووە؟'
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
