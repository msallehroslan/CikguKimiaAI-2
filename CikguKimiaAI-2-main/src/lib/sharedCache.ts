/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Layer 2: Firebase Shared Cache
 * Soalan yang pernah dijawab dikongsi antara semua pelajar.
 * Makin ramai guna app → makin jimat API calls.
 */

import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

const COLLECTION = "shared_cache";
const CACHE_TTL_DAYS = 90; // 90 hari — soalan kimia SPM tak banyak berubah

function makeCacheKey(question: string, topicId?: string): string {
  // Hash-like key: normalize + topicId prefix
  const norm = question
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80); // Firestore doc ID max 1500 chars, cap at 80
  return topicId ? `${topicId}__${norm}` : norm;
}

export const sharedCache = {
  /**
   * Check Firebase for a cached answer.
   * Returns null if not found or expired.
   */
  async hit(question: string, topicId?: string): Promise<string | null> {
    try {
      const key = makeCacheKey(question, topicId);
      const ref = doc(db, COLLECTION, key);
      const snap = await getDoc(ref);

      if (!snap.exists()) return null;

      const data = snap.data();

      // Check expiry
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAtMs || 0);
      const ageMs = Date.now() - createdAt.getTime();
      const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
      if (ageMs > maxAge) return null;

      // Increment hit counter (fire & forget)
      updateDoc(ref, { hits: increment(1), lastHitAt: serverTimestamp() }).catch(() => {});

      return data.answer as string;
    } catch {
      return null; // Firebase unavailable — gracefully degrade
    }
  },

  /**
   * Save a new answer to Firebase shared cache.
   */
  async set(question: string, answer: string, topicId?: string): Promise<void> {
    try {
      // Don't cache very short answers (likely errors)
      if (!answer || answer.length < 30) return;

      const key = makeCacheKey(question, topicId);
      const ref = doc(db, COLLECTION, key);

      await setDoc(ref, {
        question,
        answer,
        topicId: topicId || null,
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
        hits: 0,
        lastHitAt: null,
      }, { merge: false });
    } catch {
      // Silently fail — cache is optional
    }
  },

  /**
   * Get top cached entries (for admin dashboard stats).
   */
  async getTopEntries(n = 10): Promise<any[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        orderBy("hits", "desc"),
        limit(n)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  },
};
