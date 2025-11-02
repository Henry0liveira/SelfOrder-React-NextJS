import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

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

function initializeFirebase() {
  const firebaseApp = initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

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
