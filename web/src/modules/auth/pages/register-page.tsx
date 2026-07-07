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
import { useRegisterMutation } from '../hooks/use-register-mutation';

export function RegisterPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useRegisterMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await mutateAsync({ name, email, password });
      router.navigate({ to: '/chat' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleRegister}>
          <CardHeader>
            <CardTitle className="headline-sm text-foreground tracking-tight">
              Create an account
            </CardTitle>
            <CardDescription className="label-caps text-muted-foreground mt-1">
              Enter your details to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
            )}
            <AuthFormField
              id="name"
              label="Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={setName}
              required
            />
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
              {isPending ? 'Registering...' : 'Register'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
