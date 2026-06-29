import { Link, Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { CreditCard, Home, List, MessageSquare } from 'lucide-react';

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 w-full max-w-md mx-auto relative flex flex-col pb-16">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background/80 backdrop-blur-lg border-t border-border/50 flex justify-around items-center p-3 z-50">
        <Link to="/" className="flex flex-col items-center gap-1 text-muted-foreground [&.active]:text-primary">
          <Home size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/transactions" className="flex flex-col items-center gap-1 text-muted-foreground [&.active]:text-primary">
          <List size={20} />
          <span className="text-[10px] font-medium">History</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center gap-1 text-muted-foreground [&.active]:text-primary">
          <div className="bg-primary text-primary-foreground p-3 rounded-full -mt-6 shadow-lg">
            <MessageSquare size={24} />
          </div>
          <span className="text-[10px] font-medium">Chat</span>
        </Link>
        <Link to="/accounts" className="flex flex-col items-center gap-1 text-muted-foreground [&.active]:text-primary">
          <CreditCard size={20} />
          <span className="text-[10px] font-medium">Accounts</span>
        </Link>
      </nav>

      <TanStackRouterDevtools position="bottom-right" />
    </div>
  ),
});
