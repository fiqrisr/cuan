import { describe, expect, mock, test } from 'bun:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import '@/core/i18n';
import { Calendar } from '@cuan/ui';
import i18n from '@/core/i18n';
import { DateRangePicker } from './date-range-picker';

describe('DateRangePicker', () => {
  test('renders placeholder when no range is selected', async () => {
    await i18n.changeLanguage('en');
    const onSelectRange = mock(() => {});

    const html = renderToString(
      React.createElement(DateRangePicker, {
        onSelectRange,
        placeholder: 'Select range',
      }),
    );
    expect(html).toContain('Select range');
    expect(html).toContain('<svg');
  });

  test('renders formatted date range when from and to are provided', async () => {
    await i18n.changeLanguage('en');
    const onSelectRange = mock(() => {});

    const html = renderToString(
      React.createElement(DateRangePicker, {
        from: '2026-09-01T00:00:00.000Z',
        to: '2026-09-15T23:59:59.999Z',
        onSelectRange,
      }),
    );
    expect(html).toContain('Sep 1, 2026');
    expect(html).toContain('Sep 15, 2026');
    expect(html).toContain('Clear date range');
  });

  test('renders single date when only from is provided', async () => {
    await i18n.changeLanguage('en');
    const onSelectRange = mock(() => {});

    const html = renderToString(
      React.createElement(DateRangePicker, {
        from: '2026-10-01T00:00:00.000Z',
        onSelectRange,
      }),
    );
    // Single dates are no longer shown as active committed ranges
    // due to how `committed` requires both `from` and `to`
    expect(html).toContain('Pick date range');
  });
  test('renders with custom numberOfMonths prop', async () => {
    await i18n.changeLanguage('en');
    const onSelectRange = mock(() => {});

    const html = renderToString(
      React.createElement(DateRangePicker, {
        onSelectRange,
        numberOfMonths: 2,
      }),
    );
    expect(html).toContain('<svg');
  });

  test('renders Calendar month and day grid', () => {
    const html = renderToString(
      React.createElement(Calendar, {
        mode: 'range',
        defaultMonth: new Date(2026, 8, 1),
      }),
    );

    expect(html).toContain('September 2026');
    expect(html).toContain('rdp-weekdays');
  });
});
