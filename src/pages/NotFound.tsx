import { Link } from '@tanstack/react-router';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-background p-6 text-center">
      <div>
        <div className="size-14 rounded-xl bg-primary/10 text-primary grid place-items-center mx-auto mb-4">
          <Compass className="size-7" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          The page you’re looking for doesn’t exist or has moved.
        </p>
        <Button asChild className="mt-5">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
