import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { AuthLayout } from '@/layouts/AuthLayout';

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const completeRedirectSession = useAuthStore((s) => s.completeRedirectSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Hash router URL from the backend redirect: /#/google-callback?token=xxx
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const token = params.get('token');
    if (!token) {
      setError('Google sign-in did not return a session. Please try again.');
      return;
    }
    completeRedirectSession(token)
      .then(() => {
        const user = useAuthStore.getState().user;
        navigate({ to: user?.role === 'admin' ? '/admin' : '/dashboard' });
      })
      .catch(() => setError('Could not complete Google sign-in. Please try again.'));
  }, [completeRedirectSession, navigate]);

  return (
    <AuthLayout>
      <div className="space-y-4 text-center">
        {error ? (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => navigate({ to: '/' })}
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Completing Google sign-in…</p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
