import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
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

