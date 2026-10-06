import { describe, expect, mock, test } from 'bun:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import '@/core/i18n';
import i18n from '@/core/i18n';
import { ActivityPagination } from './activity-pagination';

describe('ActivityPagination', () => {
  test('returns null when totalItems is 0', async () => {
    const html = renderToString(
      React.createElement(ActivityPagination, {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageSize: 20,
        onPageChange: () => {},
        onPageSizeChange: () => {},
      }),
    );

    expect(html).toBe('');
  });

  test('renders item ranges and page size selector correctly', async () => {
    await i18n.changeLanguage('en');
    const onPageChange = mock(() => {});
    const onPageSizeChange = mock(() => {});

    const html = renderToString(
      React.createElement(ActivityPagination, {
        currentPage: 2,
        totalPages: 5,
        totalItems: 95,
        pageSize: 20,
        onPageChange,
        onPageSizeChange,
      }),
    );

    expect(html).toContain('Showing');
    expect(html).toContain('21'); // startItem
    expect(html).toContain('40'); // endItem
    expect(html).toContain('95'); // totalItems
    expect(html).toContain('Per page');
    expect(html).toContain('aria-label="Pagination Navigation"');
    expect(html).toContain('aria-current="page"');
  });

  test('renders ellipsis when totalPages > 7', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(
      React.createElement(ActivityPagination, {
        currentPage: 5,
        totalPages: 10,
        totalItems: 200,
        pageSize: 20,
        onPageChange: () => {},
        onPageSizeChange: () => {},
      }),
    );

    expect(html).toContain('…');
    expect(html).toContain('10');
  });
});
