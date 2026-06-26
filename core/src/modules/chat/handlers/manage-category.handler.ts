import type { Pino as Logger } from 'logixlysia';
import type { z } from 'zod';
import { categoryService } from '../../category/category.service';

export type ManageCategoryParams = {
  action: 'create_category' | 'rename_category' | 'list_categories';
  name?: string;
  newName?: string;
};

export async function handleManageCategory(
  params: ManageCategoryParams,
  userId: string,
  log: Logger,
) {
  log.info(
    { event: 'handle_manage_category', action: params.action, categoryName: params.name },
    'processing manage category intent',
  );

  switch (params.action) {
    case 'create_category':
      return createCategory(params, userId, log);
    case 'rename_category':
      return renameCategory(params, userId, log);
    case 'list_categories':
      return listCategories(userId, log);
    default:
      throw new Error('Aksi tidak dikenali.');
  }
}

async function createCategory(params: ManageCategoryParams, userId: string, log: Logger) {
  if (!params.name) {
    throw new Error('Nama kategori diperlukan untuk membuat kategori baru.');
  }

  // Check if it already exists
  const existing = await categoryService.getByName(params.name, userId);
  if (existing) {
    throw new Error(`Kategori '${params.name}' sudah ada.`);
  }

  const label = params.name.charAt(0).toUpperCase() + params.name.slice(1);
  const created = await categoryService.create({
    userId,
    name: params.name.toLowerCase().replace(/\s+/g, '-'),
    label,
  });

  log.info({ event: 'category_created', categoryId: created.id }, 'custom category created');

  return { category: created };
}

async function renameCategory(params: ManageCategoryParams, userId: string, log: Logger) {
  if (!params.name || !params.newName) {
    throw new Error('Nama lama dan nama baru diperlukan untuk mengubah kategori.');
  }

  const existing = await categoryService.getByName(params.name, userId);
  if (!existing) {
    throw new Error(`Kategori '${params.name}' tidak ditemukan.`);
  }

  if (existing.userId === null) {
    throw new Error('Kategori default bawaan sistem tidak dapat diubah.');
  }

  const label = params.newName.charAt(0).toUpperCase() + params.newName.slice(1);
  const newNameIdentifier = params.newName.toLowerCase().replace(/\s+/g, '-');

  const updated = await categoryService.update(existing.id, userId, {
    name: newNameIdentifier,
    label,
  });

  log.info({ event: 'category_renamed', categoryId: updated.id }, 'custom category renamed');

  return { category: updated };
}

async function listCategories(userId: string, log: Logger) {
  const categories = await categoryService.getUserCategories(userId);
  return { categories };
}
