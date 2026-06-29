import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@cuan/ui';
import { Wallet, CheckCircle2 } from 'lucide-react';

export function AccountsModule() {
  const { data, isLoading } = useQuery({
    queryKey: ['financial-accounts'],
    queryFn: async () => {
      const res = await api.api['financial-accounts'].get();
      if (res.error) throw res.error;
      return res.data;
    },
  });

  return (
    <div className="flex flex-col flex-1 p-4">
      <h1 className="text-2xl font-bold mb-4">Accounts</h1>
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading accounts...</div>
        ) : data?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No accounts found.</div>
        ) : (
          data?.map((acc: any) => (
            <Card
              key={acc.id}
              className={`overflow-hidden transition-all ${acc.isDefault ? 'border-primary/50 shadow-sm' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <Wallet size={20} />
                    </div>
                    <CardTitle className="text-lg">{acc.name}</CardTitle>
                  </div>
                  {acc.isDefault && (
                    <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      <CheckCircle2 size={12} />
                      Default
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-body-strong">${acc.balance}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
