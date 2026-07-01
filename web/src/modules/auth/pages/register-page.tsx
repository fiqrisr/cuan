import { useState } from 'react';
import { useRouter, Link } from '@tanstack/react-router';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@cuan/ui';
import { useRegisterMutation } from '../hooks/use-register-mutation';
import { AuthFormField } from '../components/auth-form-field';

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
    <div className='flex flex-1 items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <form onSubmit={handleRegister}>
          <CardHeader>
            <CardTitle className='text-2xl'>Create an account</CardTitle>
            <CardDescription>Enter your details to get started.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4'>
            {error && <div className='text-sm text-destructive'>{error}</div>}
            <AuthFormField
              id='name'
              label='Name'
              type='text'
              placeholder='John Doe'
              value={name}
              onChange={setName}
              required
            />
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
              {isPending ? 'Registering...' : 'Register'}
            </Button>
            <div className='text-center text-sm text-muted-foreground'>
              Already have an account?{' '}
              <Link to='/login' className='underline underline-offset-4 hover:text-primary'>
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
