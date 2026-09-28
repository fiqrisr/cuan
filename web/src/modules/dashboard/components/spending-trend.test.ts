import { describe, expect, test } from 'bun:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import '@/core/i18n';
import i18n from '@/core/i18n';
import { type DailyItem, SpendingTrend } from './spending-trend';

const mockDaily: DailyItem[] = [
  { date: '2026-09-01', income: 1000000, expense: 300000 },
  { date: '2026-09-02', income: 500000, expense: 200000 },
  { date: '2026-09-03', income: 0, expense: 150000 },
];

describe('SpendingTrend', () => {
  test('renders without crashing with daily data and formats currency', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(React.createElement(SpendingTrend, { daily: mockDaily }));
    expect(html).toBeDefined();
    expect(html).toContain('Spending trend');
    expect(html).toContain('1.500.000'); // total income
    expect(html).toContain('650.000'); // total expense
  });

  test('renders empty state when daily is empty', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(React.createElement(SpendingTrend, { daily: [] }));
    expect(html).toBeDefined();
    expect(html).toContain('Spending trend');
  });

  test('renders with income filter and calculates average and peak', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(
      React.createElement(SpendingTrend, {
        daily: mockDaily,
        filter: 'income',
      }),
    );
    expect(html).toBeDefined();
    expect(html).toContain('Total income');
    expect(html).toContain('1.500.000');
    expect(html).toContain('Daily average');
    expect(html).toContain('500.000'); // 1,500,000 / 3
  });

  test('renders with expense filter and calculates average and peak', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(
      React.createElement(SpendingTrend, {
        daily: mockDaily,
        filter: 'expense',
      }),
    );
    expect(html).toBeDefined();
    expect(html).toContain('Total expense');
    expect(html).toContain('650.000');
    expect(html).toContain('Daily average');
  });

  test('renders no-data fallback when filtered to income with 0 income', async () => {
    await i18n.changeLanguage('en');
    const zeroIncomeDaily: DailyItem[] = [
      { date: '2026-09-01', income: 0, expense: 300000 },
      { date: '2026-09-02', income: 0, expense: 200000 },
    ];
    const html = renderToString(
      React.createElement(SpendingTrend, {
        daily: zeroIncomeDaily,
        filter: 'income',
      }),
    );
    expect(html).toBeDefined();
    expect(html).toContain('No income recorded in this period');
    expect(html).toContain('Reset filter');
  });

  test('renders no-data fallback when filtered to expense with 0 expense', async () => {
    await i18n.changeLanguage('en');
    const zeroExpenseDaily: DailyItem[] = [
      { date: '2026-09-01', income: 500000, expense: 0 },
      { date: '2026-09-02', income: 200000, expense: 0 },
    ];
    const html = renderToString(
      React.createElement(SpendingTrend, {
        daily: zeroExpenseDaily,
        filter: 'expense',
      }),
    );
    expect(html).toBeDefined();
    expect(html).toContain('No expense recorded in this period');
    expect(html).toContain('Reset filter');
  });

  test('renders in net area trend view mode', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(
      React.createElement(SpendingTrend, {
        daily: mockDaily,
        view: 'net',
      }),
    );
    expect(html).toBeDefined();
    expect(html).toContain('Net this month');
  });

  test('renders localized in Indonesian (id)', async () => {
    await i18n.changeLanguage('id');
    const html = renderToString(React.createElement(SpendingTrend, { daily: mockDaily }));
    expect(html).toBeDefined();
    expect(html).toContain('Tren pengeluaran');
    expect(html).toContain('Pemasukan vs pengeluaran');
  });
});
