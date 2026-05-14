/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface StudentMemory {
  weakTopics: string[];
  lastExamScore?: string;
  identifiedMistakes: string[];
  examPapersAnalysis: string[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const user = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const memoryService = {
  async getMemory(userId: string): Promise<StudentMemory> {
    const path = `users/${userId}`;
    try {
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as StudentMemory;
      }
      return {
        weakTopics: [],
        identifiedMistakes: [],
        examPapersAnalysis: []
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return { weakTopics: [], identifiedMistakes: [], examPapersAnalysis: [] }; // Unreachable but for types
    }
  },

  async saveMemory(userId: string, memory: StudentMemory) {
    const path = `users/${userId}`;
    try {
      const docRef = doc(db, path);
      await setDoc(docRef, {
        ...memory,
        uid: userId,
        email: auth.currentUser?.email,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async addWeakTopic(userId: string, topic: string) {
    const mem = await this.getMemory(userId);
    if (!mem.weakTopics.includes(topic)) {
      mem.weakTopics.push(topic);
      await this.saveMemory(userId, mem);
    }
  },

  async addExamAnalysis(userId: string, analysis: string) {
    const mem = await this.getMemory(userId);
    mem.examPapersAnalysis.push(analysis);
    if (mem.examPapersAnalysis.length > 5) {
      mem.examPapersAnalysis.shift();
    }
    await this.saveMemory(userId, mem);
  }
};
