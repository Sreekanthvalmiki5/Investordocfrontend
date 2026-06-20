import { Outlet, Link } from '@tanstack/react-router';
import { BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';

export function AuthLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0B1437] via-[#0F172A] to-[#111827]">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,#2563EB40,transparent_40%),radial-gradient(circle_at_80%_70%,#10B98135,transparent_45%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary grid place-items-center shadow-lg shadow-primary/30">
              <BarChart3 className="size-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-white tracking-tight">InvestorDocs AI</span>
          </Link>

          <div className="space-y-8">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Financial document intelligence, distilled.
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-md">
              Upload earnings reports, annual filings and transcripts. Ask any question and get answers backed by
              exact page citations.
            </p>
            <div className="space-y-4">
              <Feature icon={<TrendingUp className="size-4" />} title="Quarterly analysis in seconds" desc="Revenue, margin, and growth extracted instantly." />
              <Feature icon={<ShieldCheck className="size-4" />} title="Sourced answers" desc="Every claim links back to the exact PDF page." />
            </div>
          </div>

          <p className="text-white/40 text-xs">Trusted by analysts at leading buy-side firms.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {children ?? <Outlet />}
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-md bg-white/10 grid place-items-center text-primary">{icon}</div>
      <div>
        <p className="text-white font-medium text-sm">{title}</p>
        <p className="text-white/60 text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
