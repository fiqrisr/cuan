import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Bot, History, LayoutDashboard, Leaf, User, Wallet } from 'lucide-react';
import { authClient } from '@/core/auth';

export const Route = createRootRoute({
  component: function RootComponent() {
    const { data: session } = authClient.useSession();
    const showNav = !!session;

    return (
      <div className="flex flex-col lg:flex-row h-dvh overflow-hidden bg-background text-foreground">
        {/* Desktop sidebar */}
        {showNav && (
          <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/20 bg-background/50 backdrop-blur-md">
            <div className="px-6 pt-6 pb-4 flex items-center gap-2">
              <Leaf size={18} className="text-primary" />
              <span className="font-serif font-bold text-lg tracking-tight text-foreground">
                Cuan
              </span>
            </div>
            <nav className="flex-1 px-4 py-4 flex flex-col gap-1.5">
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3.5 rounded text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
              >
                <LayoutDashboard size={19} />
                Dashboard
              </Link>
              <Link
                to="/chat"
                className="flex items-center gap-3 px-4 py-3.5 rounded text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
              >
                <Bot size={19} />
                Assistant
              </Link>
              <Link
                to="/transactions"
                className="flex items-center gap-3 px-4 py-3.5 rounded text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
              >
                <History size={19} />
                Activity
              </Link>
              <Link
                to="/accounts"
                className="flex items-center gap-3 px-4 py-3.5 rounded text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
              >
                <Wallet size={19} />
                Accounts
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-3.5 rounded text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
              >
                <User size={19} />
                Profile
              </Link>
            </nav>
          </aside>
        )}

        {/* Content area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main
            className={`flex-1 flex flex-col min-h-0 overflow-hidden ${showNav ? 'pb-[92px] lg:pb-0' : ''}`}
          >
            <Outlet />
          </main>

          {/* Mobile bottom nav */}
          {showNav && (
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border/20 flex justify-around items-center pb-6 pt-3 px-2 z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
              <Link
                to="/"
                className="flex flex-col items-center justify-center p-3.5 text-muted-foreground transition-colors hover:text-foreground active:scale-95 w-[76px] h-14 relative"
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute inset-0 bg-primary/10 rounded-xl z-0" />}
                    <LayoutDashboard
                      size={22}
                      className={`relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <span
                      className={`label-caps text-[9px] mt-1 relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      Dashboard
                    </span>
                  </>
                )}
              </Link>
              <Link
                to="/chat"
                className="flex flex-col items-center justify-center p-3.5 text-muted-foreground transition-colors hover:text-foreground active:scale-95 w-[76px] h-14 relative"
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute inset-0 bg-primary/10 rounded-xl z-0" />}
                    <Bot
                      size={22}
                      className={`relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <span
                      className={`label-caps text-[9px] mt-1 relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      Assistant
                    </span>
                  </>
                )}
              </Link>
              <Link
                to="/transactions"
                className="flex flex-col items-center justify-center p-3.5 text-muted-foreground transition-colors hover:text-foreground active:scale-95 w-[76px] h-14 relative"
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute inset-0 bg-primary/10 rounded-xl z-0" />}
                    <History
                      size={22}
                      className={`relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <span
                      className={`label-caps text-[9px] mt-1 relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      Activity
                    </span>
                  </>
                )}
              </Link>
              <Link
                to="/accounts"
                className="flex flex-col items-center justify-center p-3.5 text-muted-foreground transition-colors hover:text-foreground active:scale-95 w-[76px] h-14 relative"
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute inset-0 bg-primary/10 rounded-xl z-0" />}
                    <Wallet
                      size={22}
                      className={`relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <span
                      className={`label-caps text-[9px] mt-1 relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      Accounts
                    </span>
                  </>
                )}
              </Link>
              <Link
                to="/profile"
                className="flex flex-col items-center justify-center p-3.5 text-muted-foreground transition-colors hover:text-foreground active:scale-95 w-[76px] h-14 relative"
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute inset-0 bg-primary/10 rounded-xl z-0" />}
                    <User
                      size={22}
                      className={`relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <span
                      className={`label-caps text-[9px] mt-1 relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      Profile
                    </span>
                  </>
                )}
              </Link>
            </nav>
          )}
        </div>

        <TanStackRouterDevtools position="bottom-right" />
      </div>
    );
  },
});
