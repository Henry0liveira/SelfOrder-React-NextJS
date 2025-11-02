'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  constructor(public context: SecurityRuleContext) {
    const {path, operation} = context;

    super(
      `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
{
  "path": "${path}",
  "operation": "${operation}"
}
`
    );

    this.name = 'FirestorePermissionError';
  }
}
