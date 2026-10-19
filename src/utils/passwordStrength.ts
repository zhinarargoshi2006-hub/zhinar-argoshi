import { UILanguage } from '../types';

export interface PasswordRequirement {
  id: string;
  met: boolean;
  labelKu: string;
  labelAr: string;
  labelEn: string;
}

export interface PasswordStrengthResult {
  score: number; // 0: empty/very weak, 1: weak, 2: fair, 3: good, 4: strong
  labelKu: string;
  labelAr: string;
  labelEn: string;
  colorClass: string;
  bgColorClass: string;
  requirements: PasswordRequirement[];
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const reqs: PasswordRequirement[] = [
    {
      id: 'length',
      met: password.length >= 8,
      labelKu: 'لانی کەم ٨ پیت یان زیاتر',
      labelAr: 'على الأقل 8 أحرف أو أكثر',
      labelEn: 'At least 8 characters',
    },
    {
      id: 'uppercase',
      met: /[A-Z]/.test(password),
      labelKu: 'پیتی گەورەی ئینگلیزی (A-Z)',
      labelAr: 'حرف كبير إنجليزي (A-Z)',
      labelEn: 'Uppercase letter (A-Z)',
    },
    {
      id: 'lowercase',
      met: /[a-z]/.test(password),
      labelKu: 'پیتی بچووک (a-z)',
      labelAr: 'حرف صغير (a-z)',
      labelEn: 'Lowercase letter (a-z)',
    },
    {
      id: 'number',
      met: /[0-9]/.test(password),
      labelKu: 'ژمارە (0-9)',
      labelAr: 'أرقام (0-9)',
      labelEn: 'At least one number (0-9)',
    },
    {
      id: 'special',
      met: /[^A-Za-z0-9]/.test(password),
      labelKu: 'هێما یان کاراکتەری تایبەت (@, #, $, !)',
      labelAr: 'رمز أو علامة خاصة (@, #, $, !)',
      labelEn: 'Special character (@, #, $, !)',
    },
  ];

  if (!password) {
    return {
      score: 0,
      labelKu: 'وشەی نهێنی داخل بکە',
      labelAr: 'أدخل كلمة المرور',
      labelEn: 'Enter a password',
      colorClass: 'text-slate-500',
      bgColorClass: 'bg-slate-700',
      requirements: reqs,
    };
  }

  const metCount = reqs.filter((r) => r.met).length;

  if (password.length < 6 || metCount <= 1) {
    return {
      score: 1,
      labelKu: 'زۆر لاوازە',
      labelAr: 'ضعيفة جداً',
      labelEn: 'Very Weak',
      colorClass: 'text-rose-400',
      bgColorClass: 'bg-rose-500',
      requirements: reqs,
    };
  }

  if (metCount === 2 || metCount === 3) {
    return {
      score: 2,
      labelKu: 'مامناوەند',
      labelAr: 'متوسطة',
      labelEn: 'Fair / Moderate',
      colorClass: 'text-amber-400',
      bgColorClass: 'bg-amber-500',
      requirements: reqs,
    };
  }

  if (metCount === 4) {
    return {
      score: 3,
      labelKu: 'باش و بەهێز',
      labelAr: 'جيدة وقوية',
      labelEn: 'Good',
      colorClass: 'text-teal-400',
      bgColorClass: 'bg-teal-500',
      requirements: reqs,
    };
  }

  return {
    score: 4,
    labelKu: 'زۆر بەهێز و پارێزراو',
    labelAr: 'ممتازة وقوية جداً',
    labelEn: 'Very Strong',
    colorClass: 'text-emerald-400',
    bgColorClass: 'bg-emerald-500',
    requirements: reqs,
  };
}

export function getLocalizedStrengthLabel(result: PasswordStrengthResult, uiLang: UILanguage): string {
  if (uiLang === 'ar') return result.labelAr;
  if (uiLang === 'ku') return result.labelKu;
  return result.labelEn;
}
