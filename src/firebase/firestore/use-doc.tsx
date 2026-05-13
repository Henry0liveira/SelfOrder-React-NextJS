'use client';

import {useEffect, useState} from 'react';
import {
  onSnapshot,
  doc,
  type Firestore,
  type DocumentData,
} from 'firebase/firestore';

import {useFirestore} from '@/firebase';
import {errorEmitter} from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

export function useDoc<T>(collectionName: string, docId: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId || !collectionName) {
      setData(null);
      setLoading(false);
      return;
    }

    const docRef = doc(firestore, collectionName, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({...(snapshot.data() as T), id: snapshot.id});
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error(error);
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, collectionName, docId]);

  return {data, loading};
}
