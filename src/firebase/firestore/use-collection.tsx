'use client';

import {useEffect, useState} from 'react';
import {
  onSnapshot,
  query,
  collection,
  where,
  type Firestore,
  type DocumentData,
  type Query,
} from 'firebase/firestore';

import {useFirestore} from '@/firebase';
import {errorEmitter} from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

export function useCollection<T>(collectionName: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectionRef = collection(firestore, collectionName);

    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        setData(snapshot.docs.map((doc) => ({...doc.data(), id: doc.id})) as T[]);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, collectionName]);

  return {data, loading};
}

export function useCollectionQuery<T>(
  collectionName: string,
  field: string,
  value: string
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectionRef = collection(firestore, collectionName);
    const q = query(collectionRef, where(field, '==', value));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map((doc) => ({...doc.data(), id: doc.id})) as T[]);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, collectionName, field, value]);

  return {data, loading};
}
