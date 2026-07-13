import { Link } from '@tanstack/react-router';
import { Wallet } from 'lucide-react';

export function AccountEmptyState() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center py-16 gap-3 text-center"
    >
      <div className="p-4 rounded-2xl bg-muted/30 text-muted-foreground">
        <Wallet size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">No accounts yet</h3>
        <p className="text-sm text-muted-foreground mt-1 prose-short">
          Tell the assistant to create an account, and it will show up here.
        </p>
      </div>
      <Link
        to="/chat"
        className="mt-1 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
      >
        Create account in chat
      </Link>
    </div>
  );
}
