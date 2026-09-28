import { describe, expect, mock, test } from 'bun:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import '@/core/i18n';
import i18n from '@/core/i18n';
import { SummaryCards } from './summary-cards';

describe('SummaryCards', () => {
  test('renders all 4 metric cards correctly', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(
      React.createElement(SummaryCards, {
        totalBalance: 10000000,
        totalIncome: 5000000,
        totalExpense: 2000000,
        netSavings: 3000000,
        savingsRate: 60,
      }),
    );

    expect(html).toContain('Total balance');
    expect(html).toContain('Income this month');
    expect(html).toContain('Spending this month');
    expect(html).toContain('Net this month');
    expect(html).toContain('10.000.000');
    expect(html).toContain('5.000.000');
    expect(html).toContain('2.000.000');
    expect(html).toContain('3.000.000');
  });

  test('shows active filter badge when income is active', async () => {
    await i18n.changeLanguage('en');
    const onFilterChange = mock(() => {});
    const html = renderToString(
      React.createElement(SummaryCards, {
        totalBalance: 10000000,
        totalIncome: 5000000,
        totalExpense: 2000000,
        netSavings: 3000000,
        savingsRate: 60,
        activeFilter: 'income',
        onFilterChange,
      }),
    );

    expect(html).toContain('Filtered');
    expect(html).toContain('Click to clear filter');
  });

  test('shows active filter badge when expense is active', async () => {
    await i18n.changeLanguage('en');
    const onFilterChange = mock(() => {});
    const html = renderToString(
      React.createElement(SummaryCards, {
        totalBalance: 10000000,
        totalIncome: 5000000,
        totalExpense: 2000000,
        netSavings: 3000000,
        savingsRate: 60,
        activeFilter: 'expense',
        onFilterChange,
      }),
    );

    expect(html).toContain('Filtered');
    expect(html).toContain('Click to clear filter');
  });
});
