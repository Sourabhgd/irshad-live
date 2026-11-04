import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { PoetryResult } from './poetryService';

export interface SavedPoem extends PoetryResult {
  id: string;
  authorId: string;
  authorEmail: string;
  isPublic: boolean;
  createdAt?: any;
}

const POEMS_COLLECTION = 'poems';

export async function savePoemToFirestore(poetry: PoetryResult, isPublic: boolean = true): Promise<SavedPoem> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in with Google to preserve this poetry in your Mehfil.');
  }

  const poemId = 'poem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const poemPath = `${POEMS_COLLECTION}/${poemId}`;

  const poemData = {
    title: poetry.title.slice(0, 150),
    poem: poetry.poem.slice(0, 6000),
    sherUrdu: poetry.sherUrdu.slice(0, 1500),
    sherHindi: poetry.sherHindi.slice(0, 1500),
    authorId: user.uid,
    authorEmail: user.email || 'anonymous@irshad.live',
    isPublic,
    createdAt: serverTimestamp()
  };

  try {
    const docRef = doc(db, POEMS_COLLECTION, poemId);
    await setDoc(docRef, poemData);
    return {
      ...poetry,
      id: poemId,
      authorId: user.uid,
      authorEmail: user.email || '',
      isPublic
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, poemPath);
  }
}

export async function fetchUserPoems(): Promise<SavedPoem[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(
      collection(db, POEMS_COLLECTION),
      where('authorId', '==', user.uid),
      limit(25)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<SavedPoem, 'id'>)
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, POEMS_COLLECTION);
  }
}

export async function deletePoemFromFirestore(poemId: string): Promise<void> {
  const poemPath = `${POEMS_COLLECTION}/${poemId}`;
  try {
    await deleteDoc(doc(db, POEMS_COLLECTION, poemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, poemPath);
  }
}
