import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Skeleton } from '@cuan/ui';
import { Check, LogOut, Monitor, Moon, Pencil, Sun, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';
import { authClient } from '@/core/auth';
import { useTheme } from '@/core/theme-context';
import { useCreateCategoryMutation } from '../hooks/use-create-category-mutation';
import { useDeleteCategoryMutation } from '../hooks/use-delete-category-mutation';
import { useGetCategoriesQuery } from '../hooks/use-get-categories-query';
import { useLogoutMutation } from '../hooks/use-logout-mutation';
import { useUpdateCategoryMutation } from '../hooks/use-update-category-mutation';

export function ProfilePage() {
  const { data, isPending } = authClient.useSession();
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogoutMutation();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { mutateAsync: createCategory, isPending: isCreatingCat } = useCreateCategoryMutation();
  const { mutateAsync: updateCategory, isPending: isUpdatingCat } = useUpdateCategoryMutation();
  const { mutateAsync: deleteCategory, isPending: isDeletingCat } = useDeleteCategoryMutation();

  const categories = categoriesData?.data ?? [];

  const handleCreate = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const name = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    try {
      setCreateError(null);
      await createCategory({
        label,
        name,
      });
      setIsCreating(false);
      setNewLabel('');
    } catch (err) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleUpdate = async (id: number) => {
    const label = editingLabel.trim();
    if (!label) return;
    const name = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    try {
      setUpdateError(null);
      await updateCategory({
        id,
        label,
        name,
      });
      setEditingId(null);
      setEditingLabel('');
    } catch (err) {
      console.error(err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
    } catch (err) {
      console.error(err);
    }
  };

  const user = data?.user;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="px-5 py-12 sm:px-16 max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-border/10">
          <div>
            <h1 className="headline-md text-foreground tracking-tight">Profile</h1>
            <p className="body-md text-muted-foreground mt-1">
              Manage your private account preferences
            </p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="label-caps text-muted-foreground">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {isPending ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full glass-panel border-primary/20 text-primary shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-semibold text-base text-foreground">{user?.name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            )}

            <div className="pt-6 mt-2 border-t border-border/20">
              <Button
                variant="destructive"
                className="w-full sm:w-auto flex items-center gap-2"
                onClick={() => logout()}
                disabled={isLoggingOut}
              >
                <LogOut size={14} />
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl mt-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="label-caps text-muted-foreground">Category Management</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreating(true)}
              className="h-7 px-3 text-xs min-w-0 font-medium"
              disabled={isCreating}
            >
              + Add Category
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isCreating && (
              <div className="border border-border/20 rounded p-4 flex flex-col gap-3 bg-muted/10">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="new-category-label"
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Category Label
                  </label>
                  <Input
                    id="new-category-label"
                    placeholder="e.g. Subscriptions"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {createError && (
                  <p className="text-xs text-destructive font-semibold">{createError}</p>
                )}
                <div className="flex justify-end gap-2 mt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreating(false);
                      setNewLabel('');
                      setCreateError(null);
                    }}
                    className="h-7 text-xs min-w-0 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={isCreatingCat}
                    className="h-7 text-xs min-w-0 px-3 font-semibold"
                  >
                    {isCreatingCat ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            )}

            {categoriesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No categories found.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border/10 max-h-[350px] overflow-y-auto pr-1">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4"
                  >
                    {editingId === category.id ? (
                      <div className="flex flex-col gap-1.5 flex-1 w-full">
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={editingLabel}
                            onChange={e => setEditingLabel(e.target.value)}
                            className="h-8 text-xs py-0.5 flex-1"
                            placeholder="Category Label"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleUpdate(category.id);
                              if (e.key === 'Escape') {
                                setEditingId(null);
                                setUpdateError(null);
                              }
                            }}
                          />
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleUpdate(category.id)}
                              disabled={isUpdatingCat}
                              className="h-8 w-8 text-success"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(null);
                                setUpdateError(null);
                              }}
                              className="h-8 w-8 text-destructive"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                        {updateError && (
                          <p className="text-xs text-destructive font-semibold">{updateError}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {category.label}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {category.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {category.userId === null ? (
                            <Badge
                              variant="secondary"
                              className="bg-muted/40 text-muted-foreground border-border/10 font-normal py-0.5 px-2 font-mono"
                            >
                              System
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingId(category.id);
                                  setEditingLabel(category.label);
                                  setUpdateError(null);
                                }}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                                title="Edit category"
                              >
                                <Pencil size={12} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(category.id)}
                                disabled={isDeletingCat}
                                className="h-7 w-7 text-destructive hover:text-destructive/80 shrink-0"
                                title="Delete category"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="max-w-2xl mt-4">
          <CardHeader>
            <CardTitle className="label-caps text-muted-foreground">Theme Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="font-semibold text-base text-foreground">Visual Theme</p>
              <p className="text-sm text-muted-foreground mt-1">
                Customize how Cuan looks on your device. Persisted to local storage.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 py-6 h-auto"
                onClick={() => setTheme('light')}
              >
                <Sun size={20} />
                <span className="text-xs font-semibold">Light</span>
              </Button>

              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 py-6 h-auto"
                onClick={() => setTheme('dark')}
              >
                <Moon size={20} />
                <span className="text-xs font-semibold">Dark</span>
              </Button>

              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 py-6 h-auto"
                onClick={() => setTheme('system')}
              >
                <Monitor size={20} />
                <span className="text-xs font-semibold">
                  System {theme === 'system' && `(${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
