import { createFileRoute } from '@tanstack/react-router';
import { LoginModule } from '@/modules/auth/login';

export const Route = createFileRoute('/login')({
  component: LoginModule,
});
