import { createFileRoute } from '@tanstack/react-router';
import { RegisterModule } from '@/modules/auth/register';

export const Route = createFileRoute('/register')({
  component: RegisterModule,
});
