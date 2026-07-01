import { Link, Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { CreditCard, Home, Leaf, List, MessageSquare } from 'lucide-react';

export const Route = createRootRoute({
  component: () => (
    <div className='lg:flex lg:h-dvh lg:overflow-hidden bg-background text-foreground'>
      {/* Desktop sidebar */}
      <aside className='hidden lg:flex flex-col w-56 shrink-0 border-r border-border/50 bg-background'>
        <div className='px-4 pt-5 pb-4 flex items-center gap-2'>
          <Leaf size={20} className='text-primary' />
          <span className='font-bold text-lg tracking-tight'>Cuan</span>
        </div>
        <nav className='flex-1 px-3 py-2 flex flex-col gap-1'>
          <Link
            to='/'
            className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary'
          >
            <Home size={18} />
            Home
          </Link>
          <Link
            to='/transactions'
            className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary'
          >
            <List size={18} />
            History
          </Link>
          <Link
            to='/chat'
            className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary'
          >
            <MessageSquare size={18} />
            Chat
          </Link>
          <Link
            to='/accounts'
            className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary'
          >
            <CreditCard size={18} />
            Accounts
          </Link>
        </nav>
      </aside>

      {/* Content area */}
      <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
        <main className='flex-1 flex flex-col min-h-0 overflow-hidden pb-16 lg:pb-0'>
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className='lg:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border/50 flex justify-around items-center py-2 px-4 z-50'>
          <Link to='/' className='flex flex-col items-center gap-1 text-muted-foreground [&.active]:text-primary'>
            <Home size={20} />
            <span className='text-[10px] font-medium'>Home</span>
          </Link>
          <Link
            to='/transactions'
            className='flex flex-col items-center gap-1 text-muted-foreground [&.active]:text-primary'
          >
            <List size={20} />
            <span className='text-[10px] font-medium'>History</span>
          </Link>
          <Link to='/chat' className='flex flex-col items-center gap-1 text-muted-foreground [&.active]:text-primary'>
            <div className='bg-primary text-primary-foreground p-3 rounded-full -mt-5 shadow-md'>
              <MessageSquare size={24} />
            </div>
            <span className='text-[10px] font-medium'>Chat</span>
          </Link>
          <Link
            to='/accounts'
            className='flex flex-col items-center gap-1 text-muted-foreground [&.active]:text-primary'
          >
            <CreditCard size={20} />
            <span className='text-[10px] font-medium'>Accounts</span>
          </Link>
        </nav>
      </div>

      <TanStackRouterDevtools position='bottom-right' />
    </div>
  ),
});
