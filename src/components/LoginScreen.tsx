import React, { useState } from 'react';
import { UILanguage, TargetLanguage } from '../types';
import { KurdistanFlag } from './KurdistanFlag';
import { KdVoiceOfficialLogo } from './KdVoiceOfficialLogo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Layers,
  Award,
} from 'lucide-react';
import {
  registerWithEmailPassword,
  loginWithEmailPassword,
  signInWithGoogle,
  translateFirebaseAuthError,
} from '../firebase';
import {
  evaluatePasswordStrength,
} from '../utils/passwordStrength';
import { User as FirebaseUser } from 'firebase/auth';

interface LoginScreenProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  onUserAuthenticated: (user: any, isNewRegistration?: boolean) => void;
  onGuestContinue?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  uiLang,
  targetLang,
  onUserAuthenticated,
  onGuestContinue,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading and Error states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Real-time password strength
  const passwordStrength = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage(
        isAr ? 'يرجى إدخال البريد الإلكتروني.' : isKu ? 'تکایە ئیمەیڵەکەت بنووسە.' : 'Please enter your email.'
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        isAr ? 'يرجى إدخال كلمة المرور.' : isKu ? 'تکایە وشەی نهێنی بنووسە.' : 'Please enter your password.'
      );
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMessage(
          isAr
            ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف.'
            : isKu
            ? 'وشەی نهێنی دەبێت لانیکەم لە ٦ پیت یان ژمارە پێک بێت.'
            : 'Password must be at least 6 characters.'
        );
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage(
          isAr
            ? 'كلمتا المرور غير متطابقتين.'
            : isKu
            ? 'هەردوو پاسۆردەکە وەک یەک نین، تکایە دڵنیابەرەوە.'
            : 'Passwords do not match.'
        );
        return;
      }

      setLoading(true);
      try {
        const { user, error } = await registerWithEmailPassword(
          cleanEmail,
          password,
          displayName.trim() || undefined,
          targetLang,
          uiLang
        );

        if (error || !user) {
          const localized = translateFirebaseAuthError(error || '', uiLang);
          setErrorMessage(localized);
          setLoading(false);
          return;
        }

        setSuccessMessage(
          isAr
            ? 'تم إنشاء الحساب بنجاح! جاري تحضير القاعات التعليمية...'
            : isKu
            ? 'هەژمارەکەت بە سەرکەوتوویی درووست کرا! بەخێربێیت...'
            : 'Account created successfully! Entering the lab...'
        );

        setTimeout(() => {
          onUserAuthenticated(user, true);
        }, 600);
      } catch (err: any) {
        setErrorMessage(translateFirebaseAuthError(err?.code || err?.message || '', uiLang));
      } finally {
        setLoading(false);
      }
    } else {
      // Sign In mode
      setLoading(true);
      try {
        const { user, error } = await loginWithEmailPassword(cleanEmail, password);
        if (error || !user) {
          const localized = translateFirebaseAuthError(error || '', uiLang);
          setErrorMessage(localized);
          setLoading(false);
          return;
        }

        setSuccessMessage(
          isAr
            ? 'تم تسجيل الدخول بنجاح! جاري نقلك إلى المراحل...'
            : isKu
            ? 'بە سەرکەوتوویی چوویتە ژوورەوە! چاوەڕوان بە...'
            : 'Signed in successfully! Entering stages...'
        );

        setTimeout(() => {
          onUserAuthenticated(user, false);
        }, 600);
      } catch (err: any) {
        setErrorMessage(translateFirebaseAuthError(err?.code || err?.message || '', uiLang));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleLoading(true);

    try {
      const { user, isNewUser, error } = await signInWithGoogle(targetLang, uiLang);
      if (error || !user) {
        const localized = translateFirebaseAuthError(error || '', uiLang);
        setErrorMessage(localized);
        setGoogleLoading(false);
        return;
      }

      setSuccessMessage(
        isAr
          ? 'تم تسجيل الدخول بواسطة Google بنجاح!'
          : isKu
          ? 'بە سەرکەوتوویی لە ڕێگەی گووگڵەوە چوویتە ژوورەوە!'
          : 'Signed in with Google successfully!'
      );

      setTimeout(() => {
        onUserAuthenticated(user, !!isNewUser);
      }, 600);
    } catch (err: any) {
      setErrorMessage(translateFirebaseAuthError(err?.code || err?.message || '', uiLang));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background Ambient Glows & Kurdish Colors */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Top Header Card */}
        <div className="text-center space-y-3 flex flex-col items-center">
          {/* Official KD Voice Logo Centered Prominently */}
          <div className="relative p-3 sm:p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-cyan-500/15 flex items-center justify-center">
            <KdVoiceOfficialLogo size="hero" glow={true} showText={false} />
          </div>

          <div className="space-y-1.5 flex flex-col items-center">
            {/* Title with Kurdistan Flag beside it */}
            <div className="flex items-center justify-center gap-2">
              <KurdistanFlag size="sm" glow={true} rounded={true} />
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>KD</span>
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 bg-clip-text text-transparent">
                  Voice
                </span>
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                1,000 قۆناغ
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-sm">
              {isAr
                ? 'أكاديمية قياس النطق والتحدث بالذكاء الاصطناعي - ١,٠٠٠ مرحلة متتالية'
                : isKu
                ? 'ئەکادیمیای فێربوون و تاقیکردنەوەی دەنگ و قسەکردن (١,٠٠٠ قۆناغی قوفڵکراو)'
                : 'AI Voice Assessment & Speaking Academy (1,000 Progressive Stages)'}
            </p>
          </div>

          {/* REQUIRED PROMINENT DEVELOPER CREDIT */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/10">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>لە لایەن گەشەپێدەر ژینەر ئەرگۆشی درووست کراوە</span>
          </div>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/70 text-xs font-black">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAr ? 'تسجيل الدخول' : isKu ? 'چوونە ژوورەوە' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAr ? 'إنشاء حساب جديد' : isKu ? 'درووستکردنی هەژمار' : 'Create Account'}
            </button>
          </div>

          {/* Quick Google Sign-In Action */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500/80 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md group disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
              )}
              <span className="group-hover:text-emerald-300 transition-colors">
                {googleLoading
                  ? isAr
                    ? 'جاري الاتصال بـ Google...'
                    : isKu
                    ? 'پەیوەستبوون بە گووگڵ...'
                    : 'Connecting to Google...'
                  : isAr
                  ? 'الدخول المباشر بحساب Google'
                  : isKu
                  ? 'چوونە ژوورەوەی خێرا بە گووگڵ'
                  : 'Continue with Google'}
              </span>
            </button>

            {/* Separator Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium whitespace-nowrap">
                {isAr
                  ? 'یان بە ئیمەیڵ و وشەی نهێنی'
                  : isKu
                  ? 'یان بە جمەیڵ و وشەی نهێنی'
                  : 'or with email & password'}
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name for Signup */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'الاسم الكامل' : isKu ? 'ناوی تەواو' : 'Full Name'}</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={isAr ? 'مثال: أحمد محمد' : isKu ? 'نموونە: ئاسۆ عەلی' : 'e.g. John Doe'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            )}

            {/* Email / Gmail Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'البريد الإلكتروني / جيميل' : isKu ? 'ئیمەیڵ / جمەیڵ' : 'Email / Gmail'}</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                dir="ltr"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'كلمة المرور (الباسورد)' : isKu ? 'وشەی نهێنی (پاسۆرد)' : 'Password'}</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rtl:pr-3.5 rtl:pl-10 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password.length > 0 && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">
                      {isAr ? 'مقياس قوة كلمة المرور:' : isKu ? 'ئاستی بەهێزیی پاسۆرد:' : 'Password strength:'}
                    </span>
                    <span className={`font-bold ${passwordStrength.colorClass}`}>
                      {isKu ? passwordStrength.labelKu : isAr ? passwordStrength.labelAr : passwordStrength.labelEn}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1.5">
                    {[1, 2, 3, 4].map((step) => {
                      const isActive = passwordStrength.score >= step;
                      return (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all ${
                            isActive
                              ? passwordStrength.score === 1
                                ? 'bg-rose-500'
                                : passwordStrength.score === 2
                                ? 'bg-amber-500'
                                : passwordStrength.score === 3
                                ? 'bg-teal-500'
                                : 'bg-emerald-400'
                              : 'bg-slate-800'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'تأكيد كلمة المرور' : isKu ? 'دووبارەکردنەوەی وشەی نهێنی' : 'Confirm Password'}</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 rtl:pr-3.5 rtl:pl-10 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : isKu ? (
                mode === 'signin' ? 'چوونە ژوورەوە بۆ نێو یاری و قۆناغەکان' : 'تۆمارکردن و دەستپێکردنی قۆناغەکان'
              ) : isAr ? (
                mode === 'signin' ? 'الدخول إلى المنصة والمراحل' : 'تسجيل وبدء التحدي'
              ) : (
                mode === 'signin' ? 'Sign In & Enter Academy' : 'Register & Start Levels'
              )}
            </button>
          </form>

          {/* Guest preview button */}
          {onGuestContinue && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onGuestContinue}
                className="text-xs text-slate-500 hover:text-slate-300 underline font-medium transition-colors cursor-pointer"
              >
                {isAr
                  ? 'الدخول السريع كضيف للتجربة (بدون حفظ دائم)'
                  : isKu
                  ? 'چوونەژوورەوەی خێرا وەک میوان (بۆ تاقیکردنەوە)'
                  : 'Quick Guest Preview (Limited Progress Save)'}
              </button>
            </div>
          )}
        </div>

        {/* Feature badges card */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <Layers className="w-4 h-4 text-emerald-400 mx-auto" />
            <div className="font-bold text-slate-200">١,٠٠٠ قۆناغ</div>
            <div>قوفڵکراو و یەک بە یەک</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <Award className="w-4 h-4 text-amber-400 mx-auto" />
            <div className="font-bold text-slate-200">پێوەری CEFR</div>
            <div>هەڵسەنگاندنی ڕاستەقینە</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <ShieldCheck className="w-4 h-4 text-cyan-400 mx-auto" />
            <div className="font-bold text-slate-200">ئاسایشی فایەربەیس</div>
            <div>پاراستنی نمرە و مێژوو</div>
          </div>
        </div>

        {/* Bottom Developer Footer Signature */}
        <div className="text-center text-xs text-slate-500 space-y-1 pt-2">
          <p className="font-semibold text-slate-400">
            لە لایەن گەشەپێدەر ژینەر ئەرگۆشی درووست کراوە
          </p>
          <p className="text-[10px] text-slate-600">
            Zhiner Argushi · Kurdistan AI Audio & Language Academy
          </p>
        </div>
      </div>
    </div>
  );
};
