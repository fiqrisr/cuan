import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@cuan/ui';
import { Link, useRouter } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthFormField } from '../components/auth-form-field';
import { AuthLayout } from '../components/auth-layout';
import { useLoginMutation } from '../hooks/use-login-mutation';

export function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutateAsync, isPending } = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await mutateAsync({ email, password });
      router.navigate({ to: '/chat' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      className="lg:max-w-5xl"
    >
      <Card className="w-full max-w-sm bg-card/80 backdrop-blur-xl border-border/10 shadow-tint-lg">
        <form onSubmit={handleLogin}>
          <CardHeader className="space-y-1">
            <CardTitle className="headline-sm text-foreground">{t('auth.signIn')}</CardTitle>
            <CardDescription className="body-md text-muted-foreground">
              {t('auth.loginSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {error && (
              <div
                role="alert"
                className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/10"
              >
                {error}
              </div>
            )}
            <AuthFormField
              id="email"
              label={t('auth.email')}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              required
            />
            <AuthFormField
              id="password"
              label={t('auth.password')}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              required
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.signIn')
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline underline-offset-4 transition-colors"
              >
                {t('auth.signUp')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
