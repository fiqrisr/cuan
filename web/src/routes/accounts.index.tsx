import { createFileRoute } from '@tanstack/react-router';
import { AccountsPage } from '@/modules/account';

export const Route = createFileRoute('/accounts/')({
  component: AccountsPage,
});
