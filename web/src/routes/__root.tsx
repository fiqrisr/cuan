import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Bot, History, LayoutDashboard, Leaf, Moon, Sun, User, Wallet } from 'lucide-react';
import { Footer } from '@/components/footer';
import { NotFound } from '@/components/not-found';
import { authClient } from '@/core/auth';
import { useTheme } from '@/core/theme-context';

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  component: function RootComponent() {
    const { data: session } = authClient.useSession();
    const showNav = !!session;
    const { resolvedTheme, setTheme } = useTheme();

    const navItems = [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/chat', icon: Bot, label: 'Assistant' },
      { to: '/transactions', icon: History, label: 'Activity' },
      { to: '/accounts', icon: Wallet, label: 'Accounts' },
      { to: '/profile', icon: User, label: 'Profile' },
    ] as const;

    return (
      <div className="flex flex-col lg:flex-row h-dvh overflow-hidden bg-background text-foreground grain">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        {/* Desktop sidebar */}
        {showNav && (
          <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border/10 bg-background/60 backdrop-blur-xl">
            <div className="px-6 pt-7 pb-6 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg glass-panel border-primary/20 text-primary">
                <Leaf size={16} strokeWidth={2} />
              </div>
              <span className="font-serif logo-weight text-xl tracking-tight text-foreground">
                Cuan
              </span>
            </div>
            <nav aria-label="Main" className="flex-1 px-3 py-2 flex flex-col gap-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground [&.active]:bg-primary/[0.08] [&.active]:text-primary"
                  activeProps={{ className: 'active' }}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.75}
                    className="transition-transform group-hover:scale-105"
                  />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4 border-t border-border/10 flex items-center justify-between mt-auto">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Theme
              </span>
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer active:scale-95"
                title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>
          </aside>
        )}

        {/* Content area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main
            id="main-content"
            className={`flex-1 flex flex-col min-h-0 overflow-hidden ${showNav ? 'pb-[92px] lg:pb-0' : ''}`}
          >
            <Outlet />
          </main>

          {showNav && <Footer />}

          {/* Mobile bottom nav */}
          {showNav && (
            <nav
              aria-label="Mobile"
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/10 flex justify-around items-center pb-6 pt-3 px-2 z-50 shadow-tint-lg"
            >
              {navItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center justify-center p-3 text-muted-foreground transition-all hover:text-foreground active:scale-95 w-16 h-14 relative"
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute inset-1 bg-primary/[0.08] rounded-xl z-0" />
                      )}
                      <Icon
                        size={21}
                        strokeWidth={1.75}
                        className={`relative z-10 transition-transform ${isActive ? 'text-primary scale-105' : 'text-muted-foreground'}`}
                      />
                      <span
                        className={`label-caps text-[9px] mt-1 relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                      >
                        {label}
                      </span>
                    </>
                  )}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <TanStackRouterDevtools position="bottom-right" />
      </div>
    );
  },
});
