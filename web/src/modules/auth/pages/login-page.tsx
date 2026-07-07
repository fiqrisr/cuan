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
import { useState } from 'react';
import { AuthFormField } from '../components/auth-form-field';
import { useLoginMutation } from '../hooks/use-login-mutation';

export function LoginPage() {
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
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle className="headline-sm text-foreground tracking-tight">
              Login to Cuan
            </CardTitle>
            <CardDescription className="label-caps text-muted-foreground mt-1">
              Enter your email below to login to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
            )}
            <AuthFormField
              id="email"
              label="Email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={setEmail}
              required
            />
            <AuthFormField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              required
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="underline underline-offset-4 hover:text-primary">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
