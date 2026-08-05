import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { CheckCircle2, Loader2, MailX } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';

type Status = 'verifying' | 'success' | 'error';

function getTokenFromHash(): string | undefined {
  // Hash router URLs look like: /#/verify-email?token=xxx
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return undefined;
  const params = new URLSearchParams(hash.slice(qIndex + 1));
  return params.get('token') ?? undefined;
}

export function VerifyEmailPage() {
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = getTokenFromHash();
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token. Use the link from your email.');
      return;
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((e: Error) => {
        setStatus('error');
        setMessage(e.message);
      });
  }, [verifyEmail]);

  return (
    <AuthLayout>
      <div className="space-y-6 text-center">
        {status === 'verifying' && (
          <>
            <div className="mx-auto size-12 rounded-full bg-primary/15 text-primary grid place-items-center">
              <Loader2 className="size-6 animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Verifying your email…</h2>
            <p className="text-sm text-muted-foreground">This should only take a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto size-12 rounded-full bg-emerald-500/15 text-emerald-500 grid place-items-center">
              <CheckCircle2 className="size-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Email verified!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account is now active. You can sign in and start analyzing financial documents.
            </p>
            <Link to="/">
              <Button className="w-full h-11">Continue to sign in</Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto size-12 rounded-full bg-destructive/15 text-destructive grid place-items-center">
              <MailX className="size-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Verification failed</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
            <Link to="/">
              <Button variant="outline" className="w-full h-11">Go to sign in</Button>
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
