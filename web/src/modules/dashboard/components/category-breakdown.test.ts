import { describe, expect, test } from 'bun:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import '@/core/i18n';
import i18n from '@/core/i18n';
import { CategoryBreakdown } from './category-breakdown';

describe('CategoryBreakdown', () => {
  const mockCategories = [
    { id: 1, label: 'Food & Dining', amount: 1500000, percentage: 60 },
    { id: 2, label: 'Transportation', amount: 1000000, percentage: 40 },
  ];

  test('renders without crashing with category data', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(
      React.createElement(CategoryBreakdown, { categories: mockCategories }),
    );
    expect(html).toContain('Category breakdown');
    expect(html).toContain('Food &amp; Dining');
    expect(html).toContain('Transportation');
    expect(html).toContain('1.500.000');
    expect(html).toContain('60.0');
    expect(html).toContain('Total expenses');
    expect(html).toContain('2.500.000');
  });

  test('renders empty state when categories are empty', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(React.createElement(CategoryBreakdown, { categories: [] }));
    expect(html).toContain('Category breakdown');
    expect(html).toContain('No results');
  });
});
