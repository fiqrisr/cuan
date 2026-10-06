import { describe, expect, test } from 'bun:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import '@/core/i18n';
import i18n from '@/core/i18n';
import { ActivitySummaryBar } from './activity-summary-bar';

describe('ActivitySummaryBar', () => {
  test('renders all-time financial metrics clearly when unfiltered', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(
      React.createElement(ActivitySummaryBar, {
        metrics: {
          totalCount: 42,
          totalIncome: 15000000,
          totalExpense: 6500000,
          netCashflow: 8500000,
          isFiltered: false,
        },
      }),
    );

    expect(html).toContain('All-Time Total');
    expect(html).toContain('Cumulative totals across all recorded transactions');
    expect(html).toContain('Total Records');
    expect(html).toContain('All-time total');
    expect(html).toContain('42');
    expect(html).toContain('All-Time Income');
    expect(html).toContain('All-time inflow');
    expect(html).toContain('15.000.000');
    expect(html).toContain('All-Time Expenses');
    expect(html).toContain('All-time outflow');
    expect(html).toContain('6.500.000');
    expect(html).toContain('Net Balance');
    expect(html).toContain('+');
    expect(html).toContain('8.500.000');
  });

  test('renders filtered scope labels and subtext when isFiltered is true', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(
      React.createElement(ActivitySummaryBar, {
        metrics: {
          totalCount: 12,
          totalIncome: 2000000,
          totalExpense: 500000,
          netCashflow: 1500000,
          isFiltered: true,
        },
      }),
    );

    expect(html).toContain('Filtered Selection');
    expect(html).toContain('Totals aggregated for matching records in active filter');
    expect(html).toContain('Matching Records');
    expect(html).toContain('In active filter');
    expect(html).toContain('12');
    expect(html).toContain('Filtered Income');
    expect(html).toContain('Filtered Expenses');
    expect(html).toContain('Filtered Net Flow');
  });

  test('renders negative net flow properly', async () => {
    await i18n.changeLanguage('en');
    const html = renderToString(
      React.createElement(ActivitySummaryBar, {
        metrics: {
          totalCount: 5,
          totalIncome: 1000000,
          totalExpense: 3000000,
          netCashflow: -2000000,
          isFiltered: false,
        },
      }),
    );

    expect(html).toContain('Net Balance');
    expect(html).toContain('2.000.000');
  });
});
