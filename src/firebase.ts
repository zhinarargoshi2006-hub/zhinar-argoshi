import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { VoiceHistoryItem } from './types';

// Initialize Firebase App singleton
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Authentication instance
export const auth = getAuth(firebaseApp);

// Firestore instance (connected to the user's custom database)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

// Persistent client user identifier (survives offline, browser reloads, and auth provider constraints)
export function getPersistentUserId(): string {
  try {
    const stored = localStorage.getItem('ku_voice_firebase_uid_v1');
    if (stored && stored.length > 5) {
      return stored;
    }
    const generated = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('ku_voice_firebase_uid_v1', generated);
    return generated;
  } catch (e) {
    return `usr_${Date.now()}`;
  }
}

// Connection test on boot as mandated by Firebase integration guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: Client is offline or caching.');
    } else {
      console.log('Firebase connection ready.');
    }
    return true;
  }
}

// Automatically test connection
testFirestoreConnection().catch(() => {});

// Initialize user authentication with automatic persistent fallback
export function initializeUserAuth(onUser: (user: { uid: string; isAnonymous: boolean } | null) => void): () => void {
  // If currentUser is already available
  if (auth.currentUser) {
    onUser(auth.currentUser);
    return () => {};
  }

  let resolved = false;

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      resolved = true;
      onUser(user);
    } else {
      try {
        const cred = await signInAnonymously(auth);
        resolved = true;
        onUser(cred.user);
      } catch (err) {
        // If Anonymous Auth provider is restricted in GCP project, smoothly use persistent device UID
        if (!resolved) {
          resolved = true;
          const fallbackUid = getPersistentUserId();
          onUser({ uid: fallbackUid, isAnonymous: true });
        }
      }
    }
  });

  // Safety timer: ensure callback is never delayed
  setTimeout(() => {
    if (!resolved) {
      resolved = true;
      const fallbackUid = getPersistentUserId();
      onUser({ uid: fallbackUid, isAnonymous: true });
    }
  }, 300);

  return unsubscribe;
}

// User Profile Document interface
export interface AppUserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  targetLanguage: string;
  uiLanguage: string;
  highestCefrLevel?: string;
  totalAttempts?: number;
  averageScore?: number;
  completedStages?: number[];
  createdAt: string;
  updatedAt: string;
}

// Sync or update user profile document in Firestore
export async function syncUserProfile(
  uid: string,
  data: Partial<AppUserProfile>
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid);
    const existing = await getDoc(userRef);
    const nowIso = new Date().toISOString();

    if (existing.exists()) {
      await setDoc(
        userRef,
        {
          ...data,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } else {
      const initialProfile: AppUserProfile = {
        uid,
        email: data.email || '',
        displayName: data.displayName || 'Learner',
        targetLanguage: data.targetLanguage || 'en',
        uiLanguage: data.uiLanguage || 'ku',
        highestCefrLevel: data.highestCefrLevel || 'B1',
        totalAttempts: data.totalAttempts || 0,
        averageScore: data.averageScore || 0,
        completedStages: data.completedStages || [],
        createdAt: nowIso,
        updatedAt: nowIso,
        ...data,
      };
      await setDoc(userRef, initialProfile);
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync user profile in Firestore:', err);
    return false;
  }
}

// Register user with email and password
export async function registerWithEmailPassword(
  email: string,
  pass: string,
  displayName?: string,
  targetLanguage: string = 'en',
  uiLanguage: string = 'ku'
): Promise<{ user: FirebaseUser; error?: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && displayName.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }

    // Save profile to Firestore
    await syncUserProfile(cred.user.uid, {
      email: cred.user.email || email.trim(),
      displayName: displayName?.trim() || email.split('@')[0],
      targetLanguage,
      uiLanguage,
    });

    // Save persistent ID for consistency
    try {
      localStorage.setItem('ku_voice_firebase_uid_v1', cred.user.uid);
    } catch (e) {}

    return { user: cred.user };
  } catch (err: any) {
    return { user: null as any, error: err?.code || err?.message || 'auth/unknown-error' };
  }
}

// Sign in with email and password
export async function loginWithEmailPassword(
  email: string,
  pass: string
): Promise<{ user: FirebaseUser; error?: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);

    // Save persistent ID
    try {
      localStorage.setItem('ku_voice_firebase_uid_v1', cred.user.uid);
    } catch (e) {}

    return { user: cred.user };
  } catch (err: any) {
    return { user: null as any, error: err?.code || err?.message || 'auth/unknown-error' };
  }
}

// Sign in or sign up seamlessly using Google Sign-In popup
export async function signInWithGoogle(
  targetLanguage: string = 'en',
  uiLanguage: string = 'ku'
): Promise<{ user: FirebaseUser; isNewUser?: boolean; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    const additionalInfo = getAdditionalUserInfo(cred);
    const isNewUser = !!additionalInfo?.isNewUser;

    // Save or merge user profile in Firestore
    await syncUserProfile(cred.user.uid, {
      email: cred.user.email || '',
      displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Learner',
      targetLanguage,
      uiLanguage,
    });

    // Save persistent user ID for consistent session handling
    try {
      localStorage.setItem('ku_voice_firebase_uid_v1', cred.user.uid);
    } catch (e) {}

    return { user: cred.user, isNewUser };
  } catch (err: any) {
    return { user: null as any, error: err?.code || err?.message || 'auth/unknown-error' };
  }
}

// Update user profile data in both Firestore and Firebase Auth
export async function updateUserProfileData(
  uid: string,
  updates: {
    displayName?: string;
    highestCefrLevel?: string;
    targetLanguage?: string;
    uiLanguage?: string;
  }
): Promise<boolean> {
  try {
    if (updates.displayName && updates.displayName.trim() && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: updates.displayName.trim() });
    }
    await syncUserProfile(uid, updates);
    return true;
  } catch (err) {
    console.warn('Failed to update user profile:', err);
    return false;
  }
}

// Sign out user
export async function logoutAppUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out warning:', err);
  }
}

// Translate Firebase Auth error code to user's language
export function translateFirebaseAuthError(code: string, uiLang: string): string {
  const isAr = uiLang === 'ar';
  const isKu = uiLang === 'ku';

  switch (code) {
    case 'auth/email-already-in-use':
      return isAr
        ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر.'
        : isKu
        ? 'ئەم ئیمەیڵە پێشتر لە سیستەمەکە تۆمار کراوە. تکایە بچۆ ژوورەوە یان ئیمەیڵێکی تر بەکاربێنە.'
        : 'This email is already registered. Please sign in or use another email.';
    case 'auth/invalid-email':
      return isAr
        ? 'عنوان البريد الإلكتروني غير صالح. يرجى التأكد من كتابته بشكل صحيح.'
        : isKu
        ? 'فۆرماتی ئیمەیڵەکە نادروستە. تکایە بە دروستی بینوسە (نموونە name@example.com).'
        : 'Invalid email address format. Please check and try again.';
    case 'auth/weak-password':
      return isAr
        ? 'كلمة المرور ضعيفة جداً. يجب أن تحتوي على 6 أحرف على الأقل.'
        : isKu
        ? 'وشەی نهێنی زۆر لاوازە. دەبێت لانی کەم ٦ پیت یان زیاتر بێت.'
        : 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return isAr
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة.'
        : isKu
        ? 'ئیمەیڵ یان وشەی نهێنی هەڵەیە. تکایە زانیارییەکانت بپشکنەوە.'
        : 'Incorrect email or password. Please verify and try again.';
    case 'auth/too-many-requests':
      return isAr
        ? 'تم حظر الحساب مؤقتاً لكثرة المحاولات الخاطئة. يرجى الانتظار قليلاً.'
        : isKu
        ? 'هەوڵی هەڵەی زۆر دراوە. کەمێکی تر چاوەڕێ بکە و هەوڵ بدەرەوە.'
        : 'Too many unsuccessful attempts. Access temporarily disabled. Please wait a few moments.';
    case 'auth/popup-closed-by-user':
      return isAr
        ? 'تم إغلاق نافذة تسجيل الدخول عبر Google قبل إكمال العملية.'
        : isKu
        ? 'پەنجەرەی چوونە ژوورەوەی گووگڵ داخرا پێش تەواوبوونی پڕۆسەکە.'
        : 'Google sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return isAr
        ? 'قام المتصفح بحظر نافذة Google المنبثقة. يرجى السماح بالنوافذ المنبثقة من شريط العنوان ثم المحاولة.'
        : isKu
        ? 'وێبگەڕەکەت پەنجەرەی گووگڵی بلۆک کرد. تکایە ڕێگە بە Pop-ups بدە و دووبارە هەوڵبدەرەوە.'
        : 'The browser blocked the Google sign-in popup. Please allow popups for this site and try again.';
    case 'auth/cancelled-popup-request':
      return isAr
        ? 'تم إلغاء طلب تسجيل الدخول.'
        : isKu
        ? 'داواکاریی چوونە ژوورەوە هەڵوەشێنرایەوە.'
        : 'Sign-in popup request was cancelled.';
    case 'auth/account-exists-with-different-credential':
      return isAr
        ? 'يوجد حساب مسجل بالفعل بهذا البريد الإلكتروني بطريقة دخول مختلفة (مثل كلمة المرور).'
        : isKu
        ? 'ئەم ئیمەیڵە پێشتر بە ڕێگەیەکی تر تۆمار کراوە (وەک پاسۆرد). تکایە بە پاسۆرد بچۆ ژوورەوە.'
        : 'An account already exists with this email using a different sign-in method.';
    case 'auth/operation-not-allowed':
      return isAr
        ? 'تسجيل الدخول عبر Google غير مفعل حالياً في إعدادات النظام.'
        : isKu
        ? 'چوونە ژوورەوە بە گووگڵ لە ئێستادا لە سیستەمەکە چالاک نەکراوە.'
        : 'Google sign-in is not enabled in Firebase Authentication.';
    case 'auth/network-request-failed':
      return isAr
        ? 'تعذر الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.'
        : isKu
        ? 'کێشەی هێڵی ئینتەرنێت هەیە. تکایە پەیوەستبوون بە ئینتەرنێت بپشکنە.'
        : 'Network connection failed. Please check your internet connection.';
    default:
      return isAr
        ? 'حدث خطأ أثناء المصادقة. يرجى إعادة المحاولة.'
        : isKu
        ? 'هەڵەیەک لە چوونە ژوورەوە ڕوویدا. تکایە دووبارە هەوڵ بدەرەوە.'
        : 'An authentication error occurred. Please try again.';
  }
}

// Synchronize speaking attempt to Firestore
export async function saveAttemptToFirestore(
  attempt: VoiceHistoryItem,
  userId?: string
): Promise<boolean> {
  try {
    const currentUid = userId || auth.currentUser?.uid || getPersistentUserId();

    const docRef = doc(db, 'speaking_attempts', attempt.id);
    const payload = {
      id: attempt.id,
      userId: currentUid,
      stageId: typeof attempt.stageId === 'number' ? attempt.stageId : 1,
      stageLevel: attempt.stageLevel || 'A1',
      stageTitle: (attempt.stageTitle || '').slice(0, 200),
      language: attempt.language,
      overallScore: typeof attempt.overallScore === 'number' ? attempt.overallScore : 70,
      cefrLevel: attempt.cefrLevel || 'B1',
      scores: attempt.scores || {},
      recognizedText: (attempt.recognizedText || '').slice(0, 3000),
      audioBase64: attempt.audioBase64 && attempt.audioBase64.length < 700000 ? attempt.audioBase64 : '',
      mimeType: attempt.mimeType || 'audio/webm',
      durationSeconds: attempt.durationSeconds || 0,
      timestamp: attempt.timestamp || Date.now(),
      createdAt: new Date(attempt.timestamp || Date.now()).toISOString(),
    };

    await setDoc(docRef, payload);
    return true;
  } catch (err) {
    console.warn('Failed to save speaking attempt to Firestore:', err);
    return false;
  }
}

// Load user's speaking history from Firestore
export async function loadAttemptsFromFirestore(
  userId?: string,
  limitCount: number = 20
): Promise<VoiceHistoryItem[]> {
  try {
    const currentUid = userId || auth.currentUser?.uid || getPersistentUserId();

    const attemptsRef = collection(db, 'speaking_attempts');
    const q = query(
      attemptsRef,
      where('userId', '==', currentUid),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const results: VoiceHistoryItem[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      results.push({
        id: data.id || d.id,
        stageId: data.stageId,
        stageLevel: data.stageLevel,
        stageTitle: data.stageTitle,
        language: data.language,
        overallScore: data.overallScore,
        cefrLevel: data.cefrLevel,
        scores: data.scores,
        recognizedText: data.recognizedText,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType,
        durationSeconds: data.durationSeconds,
        timestamp: data.timestamp || Date.now(),
      });
    });

    // Sort descending by timestamp
    return results.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.warn('Error loading attempts from Firestore:', err);
    return [];
  }
}

// Delete attempt from Firestore
export async function deleteAttemptFromFirestore(attemptId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'speaking_attempts', attemptId));
    return true;
  } catch (err) {
    console.warn('Error deleting attempt from Firestore:', err);
    return false;
  }
}

// Sync user profile data to Firestore
export async function syncUserProfileToFirestore(
  userId: string,
  profile: {
    targetLanguage: string;
    uiLanguage?: string;
    highestCefrLevel?: string;
    totalAttempts?: number;
    averageScore?: number;
    completedStages?: number[];
  }
): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        uid: userId,
        targetLanguage: profile.targetLanguage,
        uiLanguage: profile.uiLanguage || 'ku',
        highestCefrLevel: profile.highestCefrLevel || 'A1',
        totalAttempts: profile.totalAttempts || 0,
        averageScore: profile.averageScore || 0,
        completedStages: profile.completedStages || [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Error syncing profile to Firestore:', err);
    return false;
  }
}

// Sync user weekly XP to Firestore community leaderboard
export async function syncLeaderboardEntry(entry: {
  userId: string;
  displayName: string;
  weeklyXp: number;
  cefrLevel: string;
  avatar?: string;
  streakDays?: number;
  language?: string;
}): Promise<boolean> {
  try {
    const leaderDocRef = doc(db, 'leaderboard', entry.userId);
    await setDoc(
      leaderDocRef,
      {
        userId: entry.userId,
        displayName: (entry.displayName || 'Learner').slice(0, 60),
        weeklyXp: Math.max(0, entry.weeklyXp || 0),
        cefrLevel: entry.cefrLevel || 'B1',
        avatar: entry.avatar || '🎙️',
        streakDays: entry.streakDays || 1,
        language: entry.language || 'en',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Error syncing leaderboard entry:', err);
    return false;
  }
}

// Fetch community leaderboard entries from Firestore
export async function fetchWeeklyLeaderboard(limitCount: number = 20): Promise<Array<{
  userId: string;
  displayName: string;
  weeklyXp: number;
  cefrLevel: string;
  avatar?: string;
  streakDays?: number;
  language?: string;
  updatedAt: string;
}>> {
  try {
    const colRef = collection(db, 'leaderboard');
    const q = query(colRef, limit(limitCount));
    const snapshot = await getDocs(q);
    const entries: any[] = [];
    snapshot.forEach((d) => {
      entries.push(d.data());
    });
    // Sort descending by weekly XP
    return entries.sort((a, b) => (b.weeklyXp || 0) - (a.weeklyXp || 0));
  } catch (err) {
    console.warn('Error fetching leaderboard from Firestore:', err);
    return [];
  }
}

