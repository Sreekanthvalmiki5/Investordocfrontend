import { Link } from '@tanstack/react-router';
import { Moon, Sun, Bell, Cpu, Building2, User, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/store/ui.store';
import { MODELS, COMPANIES } from '@/services/mockData';

export function SettingsPage() {
  const { theme, toggleTheme, notifications, setNotification, defaultModel, defaultCompanyId, setDefaultModel, setDefaultCompany } = useUIStore();

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 min-h-0 scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
          <PageHeader title="Settings" description="Manage your preferences, theme, and default workspace." />

          <div className="space-y-4 mt-6">
            <SettingsCard icon={<Sun className="size-4" />} title="Appearance" description="Switch between dark and light themes.">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  {theme === 'dark' ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-warning" />}
                  <div>
                    <p className="text-sm font-medium">Dark mode</p>
                    <p className="text-xs text-muted-foreground">Easier on the eyes for long sessions.</p>
                  </div>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>
            </SettingsCard>

            <SettingsCard icon={<Bell className="size-4" />} title="Notifications" description="Choose what you want to be notified about.">
              <div className="divide-y divide-border">
                <NotificationRow title="New reports" description="When a new filing is indexed for your companies." checked={notifications.newReports} onChange={(v) => setNotification('newReports', v)} />
                <NotificationRow title="AI insights" description="When fresh insights are generated." checked={notifications.aiInsights} onChange={(v) => setNotification('aiInsights', v)} />
                <NotificationRow title="Mentions" description="When you’re @mentioned in a shared workspace." checked={notifications.mentions} onChange={(v) => setNotification('mentions', v)} />
              </div>
            </SettingsCard>

            <SettingsCard icon={<Cpu className="size-4" />} title="Default Model" description="Pre-select the AI model for new conversations.">
              <Select value={defaultModel} onValueChange={setDefaultModel}>
                <SelectTrigger className="w-full h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label} · {m.vendor}</SelectItem>)}
                </SelectContent>
              </Select>
            </SettingsCard>

            <SettingsCard icon={<Building2 className="size-4" />} title="Default Company" description="Pre-select a company context for the dashboard.">
              <Select value={defaultCompanyId} onValueChange={setDefaultCompany}>
                <SelectTrigger className="w-full h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </SettingsCard>

            <SettingsCard icon={<User className="size-4" />} title="Account" description="Manage your profile and subscription.">
              <Button asChild variant="outline" className="gap-1.5">
                <Link to="/profile"><ArrowLeft className="size-3.5 rotate-180" /> Open profile</Link>
              </Button>
            </SettingsCard>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function SettingsCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start gap-3 mb-3">
        <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Separator className="mb-3" />
      {children}
    </Card>
  );
}

function NotificationRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="pr-3">
        <Label className="text-sm font-medium cursor-pointer">{title}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
