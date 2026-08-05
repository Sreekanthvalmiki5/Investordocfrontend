import { useState } from 'react';
import { Mail, User, Star, Calendar, Shield, Loader2, LogOut } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from '@tanstack/react-router';
import { authService } from '@/services/api';
import { toast } from 'sonner';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, signOut } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const initials = (user?.fullName ?? 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const save = async () => {
    setSaving(true);
    await updateProfile({ firstName, lastName, email });
    setSaving(false);
  };

  const logout = async () => {
    await signOut();
    navigate({ to: '/' });
  };

  const changePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setChangingPw(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password updated successfully.');
      setChangePwOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(
        (err as any)?.response?.data?.detail ||
          (err as Error)?.message ||
          'Could not change password'
      );
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 min-h-0 scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
          <PageHeader title="Profile" description="Manage your personal information and subscription." />

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {/* Profile summary */}
            <Card className="p-5 flex flex-col items-center text-center bg-card border-border">
              <Avatar className="size-20 border-2 border-primary/30">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="size-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary/15 text-primary text-xl font-semibold">{initials}</AvatarFallback>
                )}
              </Avatar>
              <h2 className="text-base font-semibold mt-3">{user?.fullName ?? 'Investor'}</h2>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-1.5 flex-wrap justify-center mt-2">
                <Badge className="uppercase tracking-wide bg-primary/15 text-primary border-primary/20">{user?.plan ?? 'pro'} plan</Badge>
                <Badge variant="secondary" className="uppercase tracking-wide">
                  {user?.authProvider === 'google' ? 'Google' : 'Email'}
                </Badge>
                {user?.emailVerified === false && (
                  <Badge className="uppercase tracking-wide bg-amber-500/15 text-amber-600 border-amber-500/30">
                    Unverified
                  </Badge>
                )}
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-3 w-full text-center">
                <Stat label="Role" value={user?.role ?? 'analyst'} />
                <Stat label="Member since" value={new Date(user?.createdAt ?? Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} />
                <Stat
                  label="Last login"
                  value={user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                />
              </div>
            </Card>

            {/* Edit form */}
            <Card className="p-5 md:col-span-2 bg-card border-border">
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-2"><User className="size-4" /> Personal Information</h3>
              <p className="text-xs text-muted-foreground mb-4">Update how your name appears across the workspace.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pf-first">First name</Label>
                  <Input id="pf-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-last">Last name</Label>
                  <Input id="pf-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pf-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 pl-9" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={save} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </div>

              <Separator className="my-5" />

              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Shield className="size-4" /> Security</h3>
              <div className="space-y-2">
                <RowItem
                  icon={<Shield className="size-4" />}
                  label="Password"
                  value="••••••••"
                  action={
                    <Button variant="outline" size="sm" onClick={() => setChangePwOpen((v) => !v)}>
                      {changePwOpen ? 'Cancel' : 'Change'}
                    </Button>
                  }
                />
                {changePwOpen && (
                  <div className="rounded-lg border border-border p-3 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pw-current">Current password</Label>
                      <Input id="pw-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-10" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="pw-new">New password</Label>
                        <Input id="pw-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pw-confirm">Confirm new password</Label>
                        <Input id="pw-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-10" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setChangePwOpen(false)}>Cancel</Button>
                      <Button size="sm" onClick={changePassword} disabled={changingPw} className="gap-2">
                        {changingPw ? <Loader2 className="size-4 animate-spin" /> : null}
                        Update password
                      </Button>
                    </div>
                  </div>
                )}
                <RowItem icon={<Star className="size-4" />} label="Two-factor auth" value="Not enabled" action={<Button variant="outline" size="sm">Enable</Button>} />
                <RowItem icon={<Calendar className="size-4" />} label="Plan" value={`${user?.plan ?? 'pro'} · billed annually`} action={<Button variant="outline" size="sm">Manage</Button>} />
              </div>

              <Separator className="my-5" />

              <Button variant="outline" onClick={logout} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="size-4" /> Sign out
              </Button>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xs font-medium capitalize mt-0.5">{value}</p>
    </div>
  );
}

function RowItem({ icon, label, value, action }: { icon: React.ReactNode; label: string; value: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/40 transition">
      <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{value}</p>
      </div>
      {action}
    </div>
  );
}
