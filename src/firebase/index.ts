
import {initializeApp, getApp, type FirebaseApp} from 'firebase/app';
import {getAuth, type Auth} from 'firebase/auth';
import {getFirestore, type Firestore} from 'firebase/firestore';

import {firebaseConfig} from '@/firebase/config';

import {FirebaseClientProvider} from '@/firebase/client-provider';
import {
  FirebaseProvider,
  useAuth,
  useFirebase,
  useFirebaseApp,
  useFirestore,
} from '@/firebase/provider';
import {useUser} from '@/firebase/auth/use-user';
import {useCollection, useCollectionQuery} from '@/firebase/firestore/use-collection';
import {useDoc} from '@/firebase/firestore/use-doc';

// This is a singleton that will be created once and used throughout the app.
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  try {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } catch (e) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }

  return {
    firebaseApp,
    auth,
    firestore,
  };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useCollection,
  useCollectionQuery,
  useDoc,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
