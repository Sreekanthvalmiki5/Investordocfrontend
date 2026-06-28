import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/api';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const requestReset = authService.requestPasswordReset;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await requestReset(email);
    setLoading(false);
    setSent(true);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="size-3.5" /> Back to sign in
        </Link>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Reset your password</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we’ll send a reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 p-4 rounded-lg bg-success/10 border border-success/30">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 text-success" />
              <p className="text-sm font-medium text-foreground">Check your inbox</p>
            </div>
            <p className="text-xs text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>, a reset link is on its way.
            </p>
            <Button onClick={() => navigate({ to: '/' })} className="w-full h-10">Back to sign in</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Send reset link
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
