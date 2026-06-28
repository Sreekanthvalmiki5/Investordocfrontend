import { useState } from 'react';
import {
  Brain,
  Database,
  Globe,
  Shield,
  Bell,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    embeddingModel: 'text-embedding-3-large',
    completionModel: 'gpt-5',
    maxTokens: '8096',
    temperature: '0.7',
    chunkSize: '512',
    chunkOverlap: '50',
    enableNotifications: true,
    enableAnalytics: true,
    maintenanceMode: false,
    allowRegistration: true,
    defaultPlan: 'free',
  });

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your configuration has been updated successfully.',
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure platform settings and AI models.
        </p>
      </div>

      {/* AI Model Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="size-4" />
            AI Model Configuration
          </CardTitle>
          <CardDescription>
            Configure the AI models used for embeddings and completions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Embedding Model</Label>
              <Select
                value={settings.embeddingModel}
                onValueChange={(v) => setSettings({ ...settings, embeddingModel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                  <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                  <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Completion Model</Label>
              <Select
                value={settings.completionModel}
                onValueChange={(v) => setSettings({ ...settings, completionModel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-5">GPT-5</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={settings.maxTokens}
                onChange={(e) => setSettings({ ...settings, maxTokens: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RAG Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="size-4" />
            RAG Configuration
          </CardTitle>
          <CardDescription>
            Document chunking and retrieval settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chunk Size</Label>
              <Input
                type="number"
                value={settings.chunkSize}
                onChange={(e) => setSettings({ ...settings, chunkSize: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Number of tokens per chunk
              </p>
            </div>
            <div className="space-y-2">
              <Label>Chunk Overlap</Label>
              <Input
                type="number"
                value={settings.chunkOverlap}
                onChange={(e) => setSettings({ ...settings, chunkOverlap: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Overlap between chunks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4" />
            Platform Settings
          </CardTitle>
          <CardDescription>
            General platform configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow User Registration</Label>
              <p className="text-xs text-muted-foreground">
                Allow new users to create accounts
              </p>
            </div>
            <Switch
              checked={settings.allowRegistration}
              onCheckedChange={(v) => setSettings({ ...settings, allowRegistration: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Analytics</Label>
              <p className="text-xs text-muted-foreground">
                Collect usage analytics for insights
              </p>
            </div>
            <Switch
              checked={settings.enableAnalytics}
              onCheckedChange={(v) => setSettings({ ...settings, enableAnalytics: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">
                Temporarily disable user access
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="size-4" />
            Notifications
          </CardTitle>
          <CardDescription>
            Admin notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive alerts for system events
              </p>
            </div>
            <Switch
              checked={settings.enableNotifications}
              onCheckedChange={(v) => setSettings({ ...settings, enableNotifications: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Default Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="size-4" />
            User Defaults
          </CardTitle>
          <CardDescription>
            Default settings for new users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Default Plan</Label>
            <Select
              value={settings.defaultPlan}
              onValueChange={(v) => setSettings({ ...settings, defaultPlan: v })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="size-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
