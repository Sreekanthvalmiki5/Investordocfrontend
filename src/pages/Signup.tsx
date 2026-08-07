import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Mail, Lock, User, Loader2, ArrowRight, MailCheck, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle, resendVerification, loading, error, clearError } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Email/password accounts must verify their address before they can sign in.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUpWithEmail(email, password, firstName, lastName);
    const user = useAuthStore.getState().user;

    if (user && user.emailVerified === false) {
      // Show the verification prompt instead of auto-logging in. The backend
      // returns a JWT on register, but unverified users cannot sign in, so
      // drop the local session to keep the guest-only guard consistent.
      useAuthStore.getState().signOut().catch(() => {});
      setPendingEmail(user.email);
      return;
    }

    if (user) {
      // console.log(user.role);
      if (user.role === 'admin') {
        navigate({ to: '/admin' });
      } else {
        navigate({ to: '/dashboard' });
      }
    }
  };

  const resend = async () => {
    if (!pendingEmail) return;
    setResending(true);
    setResent(false);
    try {
      await resendVerification(pendingEmail);
      setResent(true);
    } catch {
      toast.error('Could not resend the verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // ── Verification prompt screen ──────────────────────────────────────────────
  if (pendingEmail) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="mx-auto size-12 rounded-full bg-primary/15 text-primary grid place-items-center">
            <MailCheck className="size-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Check your email</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              We sent a verification link to <strong className="text-foreground">{pendingEmail}</strong>.
              Click the link to activate your account, then sign in. The link expires in 24 hours.
            </p>
          </div>

          <div className="space-y-2">
            {resent ? (
              <p className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Verification email sent — check your inbox.
              </p>
            ) : (
              <Button variant="outline" className="w-full h-11 gap-2" onClick={resend} disabled={resending}>
                {resending ? <Loader2 className="size-4 animate-spin" /> : <MailCheck className="size-4" />}
                Resend verification email
              </Button>
            )}
            <Link to="/" className="block w-full h-11 grid place-items-center text-sm text-muted-foreground hover:text-foreground transition">
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }


  const google = async () => {
    await signInWithGoogle();
    const user = useAuthStore.getState().user;
    if (user) {
      if (user.role === 'admin') {
        navigate({ to: '/admin' });
      } else {
        navigate({ to: '/dashboard' });
      }
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
          <p className="text-sm text-muted-foreground mt-1">Start analyzing financial documents with AI in minutes.</p>
        </div>

        <Button type="button" variant="outline" onClick={google} disabled={loading} className="w-full h-11 gap-2.5 font-medium">
          <GoogleIcon /> Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[11px] uppercase text-muted-foreground/70">or</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-9 h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="email" type="email" required value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} className="pl-9 h-11" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} className="pl-9 h-11" />
            </div>
            <p className="text-[11px] text-muted-foreground">At least 6 characters.</p>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full h-11 gap-2">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Create account
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Already have an account?{' '}
          <Link to="/" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  );
}
