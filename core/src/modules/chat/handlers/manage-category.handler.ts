import { BadRequestError } from '@/lib/error';
import { logger } from '@/middleware/logger';
import { categoryService } from '@/modules/category/category.service';

export type ManageCategoryParams = {
  action: 'create_category' | 'rename_category' | 'list_categories';
  name?: string;
  newName?: string;
};

export async function handleManageCategory(params: ManageCategoryParams, userId: string) {
  logger.info(
    { event: 'handle_manage_category', action: params.action, categoryName: params.name },
    'processing manage category intent',
  );

  switch (params.action) {
    case 'create_category':
      return createCategory(params, userId);
    case 'rename_category':
      return renameCategory(params, userId);
    case 'list_categories':
      return listCategories(userId);
    default:
      throw new BadRequestError('Action not recognized.');
  }
}

async function createCategory(params: ManageCategoryParams, userId: string) {
  if (!params.name) {
    throw new BadRequestError('Category name is required to create a new category.');
  }

  // Check if it already exists
  const existing = await categoryService.getByName(params.name, userId);
  if (existing) {
    throw new BadRequestError(`Category '${params.name}' already exists.`);
  }

  const label = params.name.charAt(0).toUpperCase() + params.name.slice(1);
  const created = await categoryService.create({
    userId,
    name: params.name.toLowerCase().replace(/\s+/g, '-'),
    label,
  });

  logger.info({ event: 'category_created', categoryId: created.id }, 'custom category created');

  return { category: created };
}

async function renameCategory(params: ManageCategoryParams, userId: string) {
  if (!params.name || !params.newName) {
    throw new BadRequestError('Old name and new name are required to rename a category.');
  }

  const existing = await categoryService.getByName(params.name, userId);
  if (!existing) {
    throw new BadRequestError(`Category '${params.name}' not found.`);
  }

  if (existing.userId === null) {
    throw new BadRequestError('System default categories cannot be modified.');
  }

  const label = params.newName.charAt(0).toUpperCase() + params.newName.slice(1);
  const newNameIdentifier = params.newName.toLowerCase().replace(/\s+/g, '-');

  const updated = await categoryService.update(existing.id, userId, {
    name: newNameIdentifier,
    label,
  });

  logger.info({ event: 'category_renamed', categoryId: updated.id }, 'custom category renamed');

  return { category: updated };
}

async function listCategories(userId: string) {
  const categories = await categoryService.getUserCategories(userId);
  return { categories };
}
