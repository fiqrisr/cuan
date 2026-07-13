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
      title="Start tracking"
      subtitle="Create an account and turn your everyday messages into a clear picture of your money."
    >
      <Card className="w-full max-w-sm bg-card/80 backdrop-blur-xl border-border/10 shadow-tint-lg">
        <form onSubmit={handleRegister}>
          <CardHeader className="space-y-1">
            <CardTitle className="headline-sm text-foreground">Create your account</CardTitle>
            <CardDescription className="body-md text-muted-foreground">
              Enter your details to get started.
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
              label="Name"
              type="text"
              placeholder="Siti Rahayu"
              value={name}
              onChange={setName}
              required
            />
            <AuthFormField
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              required
            />
            <AuthFormField
              id="password"
              label="Password"
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline underline-offset-4 transition-colors"
              >
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
