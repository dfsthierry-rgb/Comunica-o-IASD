import { Presentation } from '../types';
import { db, auth } from './firebase';
import { collection, getDocs, getDoc, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

export const store = {
  getPresentations: async (): Promise<Presentation[]> => {
    try {
      if (!auth.currentUser) return [];
      const q = query(collection(db, 'presentations'), where('authorUid', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Presentation);
    } catch (e) {
      console.error("Error reading from Firestore", e);
      return [];
    }
  },
  
  getPresentation: async (id: string): Promise<Presentation | undefined> => {
    try {
      const docRef = doc(db, 'presentations', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Presentation;
      }
      return undefined;
    } catch (e) {
      console.error("Error reading presentation from Firestore", e);
      return undefined;
    }
  },

  savePresentation: async (presentation: Presentation) => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      const docRef = doc(db, 'presentations', presentation.id);
      
      // Firestore does not support undefined values.
      // JSON stringify/parse safely removes any undefined properties.
      const jsonString = JSON.stringify(presentation);
      
      // Check if the document size is close to the 1MB Firestore limit
      // 1MB = 1,048,576 bytes. We use 1,000,000 as a safe threshold.
      if (jsonString.length > 1000000) {
        throw new Error("A apresentação está muito grande (limite de 1MB). Tente remover algumas imagens ou criar uma nova apresentação.");
      }
      
      const cleanPresentation = JSON.parse(jsonString);
      
      await setDoc(docRef, cleanPresentation);
    } catch (e) {
      console.error("Error saving presentation to Firestore", e);
      throw e;
    }
  },

  deletePresentation: async (id: string) => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      const docRef = doc(db, 'presentations', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Error deleting presentation from Firestore", e);
      throw e;
    }
  }
};
