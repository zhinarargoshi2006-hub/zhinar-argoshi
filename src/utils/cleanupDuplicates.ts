import { SavedBookmark, VoiceHistoryItem, ChatMessage } from '../types';

export interface CleanupResult {
  bookmarksRemoved: number;
  historyRemoved: number;
  conversationsCleaned: number;
  totalDuplicatesCleaned: number;
}

/**
 * Normalizes text for comparison to identify duplicate phrases regardless of punctuation or whitespace.
 */
export function normalizeSentence(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Cleans all duplicate data stored in localStorage without losing user progress.
 */
export function cleanAllDuplicatesFromApp(): CleanupResult {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { bookmarksRemoved: 0, historyRemoved: 0, conversationsCleaned: 0, totalDuplicatesCleaned: 0 };
  }

  let bookmarksRemoved = 0;
  let historyRemoved = 0;
  let conversationsCleaned = 0;

  try {
    // 1. Deduplicate Bookmarks
    const rawBookmarks = localStorage.getItem('kd_voice_bookmarks');
    if (rawBookmarks) {
      try {
        const parsed = JSON.parse(rawBookmarks);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          const deduped: SavedBookmark[] = [];
          for (const item of parsed) {
            if (!item || !item.text) continue;
            const norm = normalizeSentence(item.text);
            if (norm && !seen.has(norm)) {
              seen.add(norm);
              deduped.push(item);
            } else {
              bookmarksRemoved++;
            }
          }
          localStorage.setItem('kd_voice_bookmarks', JSON.stringify(deduped));
        }
      } catch (e) {
        console.warn('Bookmarks cleanup warning:', e);
      }
    }

    // 2. Deduplicate Voice Assessment History
    const rawHistory =
      localStorage.getItem('kd_voice_assessment_history_v1') ||
      localStorage.getItem('ku_voice_assessment_history_v1') ||
      localStorage.getItem('argosh_voice_history');

    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) {
          const map = new Map<string, VoiceHistoryItem>();
          let prevCount = parsed.length;
          for (const item of parsed) {
            if (!item) continue;
            const key = item.stageId ? `stage-${item.stageId}` : (item.id || `hist-${item.timestamp}`);
            if (!map.has(key) || (item.timestamp && item.timestamp > (map.get(key)!.timestamp || 0))) {
              map.set(key, item);
            }
          }
          const deduped = Array.from(map.values())
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 5);
          historyRemoved += Math.max(0, prevCount - deduped.length);

          localStorage.setItem('kd_voice_assessment_history_v1', JSON.stringify(deduped));
          // Remove outdated duplicate keys
          localStorage.removeItem('ku_voice_assessment_history_v1');
          localStorage.removeItem('argosh_voice_history');
        }
      } catch (e) {
        console.warn('History cleanup warning:', e);
      }
    }

    // 3. Deduplicate Chat Conversation Messages
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ku_voice_conv_')) {
        try {
          const rawConv = localStorage.getItem(key);
          if (rawConv) {
            const parsed: ChatMessage[] = JSON.parse(rawConv);
            if (Array.isArray(parsed)) {
              const seenMsg = new Set<string>();
              const dedupedConv: ChatMessage[] = [];
              let removedInConv = 0;

              for (const msg of parsed) {
                if (!msg || !msg.content) continue;
                const mKey = `${msg.role}:${normalizeSentence(msg.content)}`;
                if (!seenMsg.has(mKey)) {
                  seenMsg.add(mKey);
                  dedupedConv.push(msg);
                } else {
                  removedInConv++;
                }
              }

              if (removedInConv > 0) {
                conversationsCleaned += removedInConv;
                localStorage.setItem(key, JSON.stringify(dedupedConv));
              }
            }
          }
        } catch (e) {
          console.warn('Conversation cleanup warning for key', key, e);
        }
      }
    }
  } catch (err) {
    console.warn('Full app deduplication error:', err);
  }

  const totalDuplicatesCleaned = bookmarksRemoved + historyRemoved + conversationsCleaned;
  return {
    bookmarksRemoved,
    historyRemoved,
    conversationsCleaned,
    totalDuplicatesCleaned,
  };
}

/**
 * Cleans all duplicates and refreshes the page smoothly.
 */
export function refreshAndCleanApp(): void {
  cleanAllDuplicatesFromApp();
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}
