'use client';

import {createContext, useContext} from 'react';

import type {FirebaseApp} from 'firebase/app';
import type {Auth}from 'firebase/auth';
import type {Firestore} from 'firebase/firestore';
import {FirebaseErrorListener} from '@/components/FirebaseErrorListener';

type FirebaseContextValue = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

type Props = {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: Props) {
  return (
    <FirebaseContext.Provider value={{firebaseApp, auth, firestore}}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }

  return context;
}

export function useFirebaseApp() {
  return useFirebase().firebaseApp;
}

export function useAuth() {
  return useFirebase().auth;
}

export function useFirestore() {
  return useFirebase().firestore;
}
