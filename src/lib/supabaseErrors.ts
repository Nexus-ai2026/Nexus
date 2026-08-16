import { supabase } from './supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export async function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null): Promise<never> {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUser = session?.user;

  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.id,
      email: currentUser?.email,
    },
    operationType,
    path,
  };
  
  console.error('Supabase Security / Operation Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}
