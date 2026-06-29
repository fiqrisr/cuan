import { t } from 'elysia';

export const CategoryDto = t.Object({
  id: t.Number(),
  name: t.String(),
  label: t.String(),
  userId: t.Union([t.String(), t.Null()]),
});

export const CreateCategoryRequestDto = t.Object({
  name: t.String(),
  label: t.String(),
});

export const UpdateCategoryRequestDto = t.Partial(
  t.Object({
    name: t.String(),
    label: t.String(),
  }),
);
