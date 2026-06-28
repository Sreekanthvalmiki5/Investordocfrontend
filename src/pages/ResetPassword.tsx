import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

import { authService } from '@/services/api';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ResetPasswordPage() {
  const navigate = useNavigate();

 
 const hash = window.location.hash;

 const query = hash.includes("?")
  ? hash.substring(hash.indexOf("?") + 1)
  : "";

const token = new URLSearchParams(query).get("token") ?? "";

console.log("Extracted token:", token);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
        'Unable to reset password.'
      );
    }

    setLoading(false);
  };

  return (
    <AuthLayout>

      <div className="space-y-6">

        <div>
          <h2 className="text-2xl font-semibold">
            Reset Password
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            Enter your new password.
          </p>
        </div>

        {success ? (
          <div className="space-y-4">

            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500" />
              <span>Password updated successfully.</span>
            </div>

            <Button
              className="w-full"
              onClick={() => navigate({ to: "/" })}
            >
              Go to Login
            </Button>

          </div>
        ) : (

          <form onSubmit={submit} className="space-y-4">

            <div>

              <Label>New Password</Label>

              <div className="relative">

                <Lock className="absolute left-3 top-3 size-4 text-muted-foreground"/>

                <Input
                  type="password"
                  className="pl-9"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                />

              </div>

            </div>

            <div>

              <Label>Confirm Password</Label>

              <div className="relative">

                <Lock className="absolute left-3 top-3 size-4 text-muted-foreground"/>

                <Input
                  type="password"
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e)=>setConfirmPassword(e.target.value)}
                />

              </div>

            </div>

            {error && (
              <p className="text-red-500 text-sm">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="mr-2 size-4 animate-spin"/>
              )}

              Reset Password

            </Button>

          </form>

        )}

      </div>

    </AuthLayout>
  );
}