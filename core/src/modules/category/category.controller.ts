import Elysia, { t } from 'elysia';
import { BadRequestError, NotFoundError } from '@/lib/error';
import { logger } from '@/middleware/logger';
import { authGuard } from '../auth/auth-guard';
import { CategoryDto, CreateCategoryRequestDto, UpdateCategoryRequestDto } from './category.dto';
import { categoryService } from './category.service';

export const categoryController = new Elysia({ prefix: '/api/categories' })
  .use(authGuard)
  .get(
    '/',
    async ({ user }) => {
      logger.info({ event: 'get_categories' }, 'fetching user categories');
      const categories = await categoryService.getUserCategories(user.id);
      return { data: categories };
    },
    {
      auth: true,
      response: t.Object({
        data: t.Array(CategoryDto),
      }),
      detail: { tags: ['Category'] },
    },
  )
  .post(
    '/',
    async ({ user, body, set }) => {
      logger.info({ event: 'create_category', name: body.name }, 'creating category');

      const existing = await categoryService.getByName(body.name, user.id);
      if (existing) {
        throw new BadRequestError(`Category '${body.name}' already exists`);
      }

      const created = await categoryService.create({
        name: body.name.toLowerCase().replace(/\s+/g, '-'),
        label: body.label,
        userId: user.id,
      });

      set.status = 201;
      return { data: created };
    },
    {
      auth: true,
      body: CreateCategoryRequestDto,
      response: {
        201: t.Object({ data: CategoryDto }),
      },
      detail: { tags: ['Category'] },
    },
  )
  .get(
    '/:id',
    async ({ user, params: { id } }) => {
      logger.info({ event: 'get_category', categoryId: id }, 'fetching category details');
      const category = await categoryService.getById(id, user.id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }
      return { data: category };
    },
    {
      auth: true,
      params: t.Object({ id: t.Numeric() }),
      response: t.Object({ data: CategoryDto }),
      detail: { tags: ['Category'] },
    },
  )
  .patch(
    '/:id',
    async ({ user, params: { id }, body }) => {
      logger.info({ event: 'update_category', categoryId: id }, 'updating category');

      const existing = await categoryService.getById(id, user.id);
      if (!existing) {
        throw new NotFoundError('Category not found');
      }

      if (existing.userId === null) {
        throw new BadRequestError('System default categories cannot be modified.');
      }

      // Check if new name already exists
      if (body.name && body.name !== existing.name) {
        const nameConflict = await categoryService.getByName(body.name, user.id);
        if (nameConflict) {
          throw new BadRequestError(`Category '${body.name}' already exists`);
        }
      }

      const updates = {
        name: body.name ? body.name.toLowerCase().replace(/\s+/g, '-') : undefined,
        label: body.label,
      };

      const updated = await categoryService.update(id, user.id, updates);
      if (!updated) {
        throw new NotFoundError('Category not found');
      }

      return { data: updated };
    },
    {
      auth: true,
      params: t.Object({ id: t.Numeric() }),
      body: UpdateCategoryRequestDto,
      response: t.Object({ data: CategoryDto }),
      detail: { tags: ['Category'] },
    },
  )
  .delete(
    '/:id',
    async ({ user, params: { id }, set }) => {
      logger.info({ event: 'delete_category', categoryId: id }, 'deleting category');

      const existing = await categoryService.getById(id, user.id);
      if (!existing) {
        throw new NotFoundError('Category not found');
      }

      if (existing.userId === null) {
        throw new BadRequestError('System default categories cannot be deleted.');
      }

      const deleted = await categoryService.delete(id, user.id);
      if (!deleted) {
        throw new NotFoundError('Category not found');
      }

      set.status = 204;
    },
    {
      auth: true,
      params: t.Object({ id: t.Numeric() }),
      response: {
        204: t.Undefined(),
      },
      detail: { tags: ['Category'] },
    },
  );
