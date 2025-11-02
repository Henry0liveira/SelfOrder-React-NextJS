
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
  WhereFilterOp,
} from 'firebase/firestore';

import {useFirestore} from '@/firebase';
import {errorEmitter} from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

export function useCollection<T>(collectionName: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collectionName) {
      setData([]);
      setLoading(false);
      return;
    }
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

interface QueryConstraint {
    field: string;
    operator: WhereFilterOp;
    value: any;
}


export function useCollectionQuery<T>(
  collectionName: string,
  constraints: QueryConstraint | QueryConstraint[]
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  // Serialize constraints to create a stable dependency for useEffect
  const constraintsJSON = JSON.stringify(constraints);

  useEffect(() => {
    const deserializedConstraints = JSON.parse(constraintsJSON) as QueryConstraint | QueryConstraint[];
    
    // Ensure constraints is an array
    const constraintsArray = Array.isArray(deserializedConstraints) ? deserializedConstraints : [deserializedConstraints];

    // Basic validation: if collectionName is falsy, or no valid constraints, do nothing.
    if (!collectionName || !constraintsArray || constraintsArray.length === 0 || constraintsArray.some(c => c.value === undefined || c.value === null || c.value === '')) {
        setData([]);
        setLoading(false);
        return;
    }

    const collectionRef = collection(firestore, collectionName);
    
    // Filter out invalid where clauses
    const validWhereClauses = constraintsArray
        .filter(c => c.field && c.operator && c.value !== undefined)
        .map(c => where(c.field, c.operator, c.value));
    
    if (validWhereClauses.length === 0) {
        setData([]);
        setLoading(false);
        return;
    }

    const q = query(collectionRef, ...validWhereClauses);

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
  // Using constraintsJSON ensures the effect only re-runs when the query truly changes.
  }, [firestore, collectionName, constraintsJSON]);

  return {data, loading};
}
