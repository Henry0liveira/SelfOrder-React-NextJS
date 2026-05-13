'use client';

import {useEffect, useState} from 'react';
import { initializeFirebase } from '@/firebase';
import {FirebaseProvider} from '@/firebase/provider';

type Props = {
  children: React.ReactNode;
};

// Initialize Firebase outside of the component
const { firebaseApp, auth, firestore } = initializeFirebase();

export function FirebaseClientProvider({
  children
}: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
