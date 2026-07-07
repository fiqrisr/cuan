import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@cuan/ui';
import { LogOut, Monitor, Moon, Sun, User } from 'lucide-react';
import { authClient } from '@/core/auth';
import { useTheme } from '@/core/theme-context';
import { useLogoutMutation } from '../hooks/use-logout-mutation';

export function ProfilePage() {
  const { data, isPending } = authClient.useSession();
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogoutMutation();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const user = data?.user;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="px-5 py-12 sm:px-16 max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-border/10">
          <div>
            <h1 className="headline-md text-foreground tracking-tight">Profile</h1>
            <p className="body-md text-muted-foreground mt-1">
              Manage your private account preferences
            </p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="label-caps text-muted-foreground">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {isPending ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full glass-panel border-primary/20 text-primary shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-semibold text-base text-foreground">{user?.name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            )}

            <div className="pt-6 mt-2 border-t border-border/20">
              <Button
                variant="destructive"
                className="w-full sm:w-auto flex items-center gap-2"
                onClick={() => logout()}
                disabled={isLoggingOut}
              >
                <LogOut size={14} />
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl mt-4">
          <CardHeader>
            <CardTitle className="label-caps text-muted-foreground">Theme Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="font-semibold text-base text-foreground">Visual Theme</p>
              <p className="text-sm text-muted-foreground mt-1">
                Customize how Cuan looks on your device. Persisted to local storage.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 py-6 h-auto"
                onClick={() => setTheme('light')}
              >
                <Sun size={20} />
                <span className="text-xs font-semibold">Light</span>
              </Button>

              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 py-6 h-auto"
                onClick={() => setTheme('dark')}
              >
                <Moon size={20} />
                <span className="text-xs font-semibold">Dark</span>
              </Button>

              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 py-6 h-auto"
                onClick={() => setTheme('system')}
              >
                <Monitor size={20} />
                <span className="text-xs font-semibold">
                  System {theme === 'system' && `(${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
