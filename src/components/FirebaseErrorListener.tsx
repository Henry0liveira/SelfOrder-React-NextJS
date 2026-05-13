'use client';

import {useEffect} from 'react';

import {errorEmitter} from '@/firebase/error-emitter';
import type {FirestorePermissionError} from '@/firebase/errors';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // For demonstration, we'll just throw the error to show the Next.js
      // error overlay. In a real app, you might want to log this to a
      // service or display a more user-friendly message.
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return null;
}
