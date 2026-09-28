import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { Bot, History, LayoutDashboard, Moon, Sun, User, Wallet } from 'lucide-react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from '@/components/footer';
import { NotFound } from '@/components/not-found';
import { RootErrorFallback } from '@/components/root-error-fallback';
import { authClient } from '@/core/http';
import { useTheme } from '@/core/theme-context';

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null // Render nothing in production
  : lazy(() =>
      import('@tanstack/router-devtools').then(res => ({
        default: res.TanStackRouterDevtools,
      })),
    );

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  errorComponent: RootErrorFallback,
  component: function RootComponent() {
    const { data: session } = authClient.useSession();
    const showNav = !!session;
    const { resolvedTheme, setTheme } = useTheme();
    const { t } = useTranslation();

    const navItems: {
      to: string;
      icon: React.ComponentType<{
        size?: number | string;
        strokeWidth?: number | string;
        className?: string;
      }>;
      label: string;
      isPrimary?: boolean;
    }[] = [
      { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
      { to: '/transactions', icon: History, label: t('nav.activity') },
      { to: '/chat', icon: Bot, label: t('nav.assistant'), isPrimary: true },
      { to: '/accounts', icon: Wallet, label: t('nav.accounts') },
      { to: '/profile', icon: User, label: t('nav.profile') },
    ];

    return (
      <div className="flex flex-col lg:flex-row h-dvh overflow-hidden bg-background text-foreground grain lg:p-2 lg:gap-2">
        <a href="#main-content" className="skip-link">
          {t('common.skipToContent')}
        </a>

        {/* Desktop sidebar - Borderless rail on canvas */}
        {showNav && (
          <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-transparent text-sidebar-foreground z-10 select-none py-1">
            <div className="px-6 pt-7 pb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 text-primary shadow-sm">
                <Bot size={18} strokeWidth={2} />
              </div>
              <span className="font-serif logo-weight text-xl tracking-tight text-foreground">
                Cuan
              </span>
            </div>
            <nav aria-label="Main" className="flex-1 px-3 py-2 flex flex-col gap-1.5">
              {navItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-muted/70 hover:text-foreground [&.active]:bg-primary/12 [&.active]:text-primary [&.active]:font-semibold"
                  activeProps={{ className: 'active' }}
                >
                  <span className="hidden group-[.active]:block absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-primary" />
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className="transition-transform group-hover:scale-105 shrink-0"
                  />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between mt-auto">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t('profile.theme')}
              </span>
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer active:scale-95"
                title={`Switch to ${resolvedTheme === 'dark' ? t('nav.themeLight') : t('nav.themeDark')}`}
              >
                {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>
          </aside>
        )}

        {/* Inset Content / Workspace area */}
        <div
          className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
            showNav
              ? 'lg:rounded-2xl lg:border lg:border-border bg-workspace text-foreground shadow-sm card-inner-highlight'
              : 'bg-background'
          }`}
        >
          <main
            id="main-content"
            className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-0"
          >
            <Outlet />
          </main>

          {showNav && <Footer />}

          {/* Mobile bottom nav - Floating Dock */}
          {showNav && (
            <div className="lg:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
              <nav
                aria-label="Mobile"
                className="pointer-events-auto bg-card/95 backdrop-blur-2xl border border-border shadow-2xl flex justify-between items-center px-2 py-2 rounded-full w-full max-w-[400px] relative card-inner-highlight"
              >
                {navItems.map(({ to, icon: Icon, label, isPrimary }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex flex-col items-center justify-center p-2 transition-all active:scale-95 flex-1 relative min-w-0 rounded-full ${
                      isPrimary
                        ? 'text-primary-foreground -mt-5 bg-primary shadow-lg shadow-primary/30 h-14 w-14 flex-none'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !isPrimary && (
                          <div className="absolute inset-0 bg-primary/10 rounded-full z-0" />
                        )}
                        <Icon
                          size={isPrimary ? 24 : 20}
                          strokeWidth={isPrimary ? 2.5 : 2}
                          className={`relative z-10 transition-transform ${
                            isActive && !isPrimary ? 'text-primary scale-110' : ''
                          } ${isPrimary && isActive ? 'scale-110' : ''}`}
                        />
                        <span className="sr-only">{label}</span>
                      </>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>

        <TanStackRouterDevtools position="bottom-right" />
      </div>
    );
  },
});
