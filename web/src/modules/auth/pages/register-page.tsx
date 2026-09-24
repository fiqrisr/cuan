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
import { useRegisterMutation } from '../hooks/use-register-mutation';

function validateRegistration({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  if (!name.trim()) return 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutateAsync, isPending } = useRegisterMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateRegistration({ name, email, password });
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    try {
      await mutateAsync({ name, email, password });
      router.navigate({ to: '/chat' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <AuthLayout
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      className="lg:max-w-5xl"
    >
      <Card className="w-full max-w-sm bg-card/80 backdrop-blur-xl border-border/10 shadow-tint-lg">
        <form onSubmit={handleRegister}>
          <CardHeader className="space-y-1">
            <CardTitle className="headline-sm text-foreground">{t('auth.signUp')}</CardTitle>
            <CardDescription className="body-md text-muted-foreground">
              {t('auth.registerSubtitle')}
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
              id="name"
              label={t('auth.displayName')}
              type="text"
              placeholder="Siti Rahayu"
              value={name}
              onChange={setName}
              required
            />
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
            <p className="text-xs text-muted-foreground">
              By registering, you agree to our{' '}
              <Link
                to="/"
                className="underline underline-offset-2 hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/"
                className="underline underline-offset-2 hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.signUp')
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {t('auth.hasAccount')}{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline underline-offset-4 transition-colors"
              >
                {t('auth.signIn')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
