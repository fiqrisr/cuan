import { useState } from 'react';
import { useRouter, Link } from '@tanstack/react-router';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@cuan/ui';
import { useLoginMutation } from '../hooks/use-login-mutation';
import { AuthFormField } from '../components/auth-form-field';

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
    <div className='flex flex-1 items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle className='text-2xl'>Login to Cuan</CardTitle>
            <CardDescription>Enter your email below to login to your account.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4'>
            {error && <div className='text-sm text-destructive'>{error}</div>}
            <AuthFormField
              id='email'
              label='Email'
              type='email'
              placeholder='m@example.com'
              value={email}
              onChange={setEmail}
              required
            />
            <AuthFormField
              id='password'
              label='Password'
              type='password'
              value={password}
              onChange={setPassword}
              required
            />
          </CardContent>
          <CardFooter className='flex flex-col gap-4'>
            <Button className='w-full' type='submit' disabled={isPending}>
              {isPending ? 'Logging in...' : 'Login'}
            </Button>
            <div className='text-center text-sm text-muted-foreground'>
              Don't have an account?{' '}
              <Link to='/register' className='underline underline-offset-4 hover:text-primary'>
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
