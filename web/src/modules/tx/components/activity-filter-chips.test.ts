import { describe, expect, mock, test } from 'bun:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import '@/core/i18n';
import i18n from '@/core/i18n';
import { ActivityFilterChips } from './activity-filter-chips';

describe('ActivityFilterChips', () => {
  test('returns null when no active filters', () => {
    const html = renderToString(
      React.createElement(ActivityFilterChips, {
        filters: { page: 1, limit: 20, datePreset: 'all', sort: 'date', order: 'desc' },
        onFilterChange: () => {},
        onResetFilters: () => {},
      }),
    );

    expect(html).toBe('');
  });

  test('renders chips for search, type, and date presets', async () => {
    await i18n.changeLanguage('en');
    const onFilterChange = mock(() => {});
    const onResetFilters = mock(() => {});

    const html = renderToString(
      React.createElement(ActivityFilterChips, {
        filters: {
          search: 'coffee',
          type: 'expense',
          datePreset: 'this_month',
          sort: 'date',
          order: 'desc',
        },
        onFilterChange,
        onResetFilters,
      }),
    );

    expect(html).toContain('Search');
    expect(html).toContain('coffee');
    expect(html).toContain('Expense');
    expect(html).toContain('This Month');
    expect(html).toContain('Clear All');
  });

  test('renders chips for account and category', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(
      React.createElement(ActivityFilterChips, {
        filters: {
          accountId: 'acct-1',
          categoryId: 10,
          datePreset: 'all',
          sort: 'date',
          order: 'desc',
        },
        accounts: [{ id: 'acct-1', name: 'BCA Main' }],
        categories: [{ id: 10, name: 'food', label: 'Food & Dining', userId: null }],
        onFilterChange: () => {},
        onResetFilters: () => {},
      }),
    );

    expect(html).toContain('Account');
    expect(html).toContain('BCA Main');
    expect(html).toContain('Category');
    expect(html).toContain('Food &amp; Dining');
  });
});
