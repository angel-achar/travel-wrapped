import Navbar from "@/components/layout/Navbar";

type PageLayoutProps = {
  title: string;
  subtitle?: string;
  // Optional buttons shown to the right of the title (e.g. "New trip").
  actions?: React.ReactNode;
  children: React.ReactNode;
};

// The shared frame for every app page: navbar, page title, and content area.
export default function PageLayout({ title, subtitle, actions, children }: PageLayoutProps) {
  return (
    <main className="min-h-screen bg-purple-50 text-purple-950">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-purple-700">{subtitle}</p>}
          </div>
          {actions}
        </div>

        {children}
      </div>
    </main>
  );
}
