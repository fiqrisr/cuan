import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@cuan/ui';
import { LogOut, User } from 'lucide-react';
import { authClient } from '@/core/auth';
import { useLogoutMutation } from '../hooks/use-logout-mutation';

export function ProfilePage() {
  const { data, isPending } = authClient.useSession();
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogoutMutation();

  const user = data?.user;

  return (
    <div className='flex flex-col flex-1 min-h-0 overflow-y-auto'>
      <div className='p-4 lg:p-8 max-w-2xl mx-auto w-full flex flex-col gap-6'>
        <h1 className='text-2xl font-semibold tracking-tight'>Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-6'>
            {isPending ? (
              <div className='flex items-center gap-4'>
                <Skeleton className='h-12 w-12 rounded-full shrink-0' />
                <div className='space-y-2 flex-1'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-4 w-48' />
                </div>
              </div>
            ) : (
              <div className='flex items-center gap-4'>
                <div className='flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary shrink-0'>
                  <User size={24} />
                </div>
                <div>
                  <p className='font-medium text-body-strong'>{user?.name || 'User'}</p>
                  <p className='text-sm text-muted-foreground'>{user?.email}</p>
                </div>
              </div>
            )}
            
            <div className='pt-6 mt-2 border-t border-border/50'>
              <Button 
                variant='destructive' 
                className='w-full sm:w-auto flex items-center gap-2'
                onClick={() => logout()}
                disabled={isLoggingOut}
              >
                <LogOut size={16} />
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
