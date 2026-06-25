/**
 * Maps Supabase / Postgres errors to safe, user-friendly messages.
 * Detailed errors are logged to the console for debugging only — never shown
 * directly to users (they leak schema, RLS, and constraint details).
 */
export function getPublicErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  // Log full detail for developers, never surface it to the user.
  // eslint-disable-next-line no-console
  console.error('[App Error]', error);

  const err = error as { code?: string; status?: number; message?: string; name?: string };
  const rawMessage = (err.message || '').toLowerCase();
  const code = err.code || '';

  // PostgREST / Postgres standard codes
  const codeMap: Record<string, string> = {
    '23505': 'This item already exists.',
    '23503': 'Cannot complete this action because related data is in use.',
    '23502': 'Some required information is missing.',
    '23514': 'The information provided is not valid.',
    '22001': 'One of the fields is too long.',
    '42501': 'You do not have permission to perform this action.',
    'PGRST301': 'You do not have permission to perform this action.',
    'PGRST116': 'The requested item could not be found.',
  };
  if (code && codeMap[code]) return codeMap[code];

  // Heuristic matching for common RLS / auth signals
  if (rawMessage.includes('row-level security') || rawMessage.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }
  if (rawMessage.includes('jwt') || rawMessage.includes('not authenticated')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (rawMessage.includes('duplicate key')) {
    return 'This item already exists.';
  }
  if (rawMessage.includes('violates check constraint') || rawMessage.includes('invalid input')) {
    return 'The information provided is not valid.';
  }
  if (rawMessage.includes('network') || rawMessage.includes('failed to fetch')) {
    return 'Network problem. Please check your connection and try again.';
  }

  return fallback;
}
