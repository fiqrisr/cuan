import { describe, expect, it } from 'bun:test';
import { getSystemPrompt } from '@/modules/chat/chat.prompt';

describe('getSystemPrompt - Domain Scope & Security Guardrails', () => {
  it('enforces strict domain boundary to personal finance in Cuan', () => {
    const prompt = getSystemPrompt();
    expect(prompt).toContain('personal finance assistant');
    expect(prompt.toLowerCase()).toContain('strictly');
    expect(prompt.toLowerCase()).toContain('cuan');
    expect(prompt.toLowerCase()).toContain('allowed topics');
  });

  it('explicitly lists forbidden off-topic subjects', () => {
    const prompt = getSystemPrompt();
    const lower = prompt.toLowerCase();
    expect(lower).toContain('forbidden');
    expect(lower).toContain('coding');
    expect(lower).toContain('general knowledge');
    expect(lower).toContain('creative writing');
    expect(lower).toContain('homework');
  });

  it('specifies an out-of-scope refusal protocol with redirection to financial features', () => {
    const promptId = getSystemPrompt('', 'id');
    const lowerId = promptId.toLowerCase();
    expect(lowerId).toContain('refusal protocol');
    expect(lowerId).toContain('do not call any tool');
    // Must guide user with financial examples
    expect(lowerId).toContain('contoh');

    const promptEn = getSystemPrompt('', 'en');
    const lowerEn = promptEn.toLowerCase();
    expect(lowerEn).toContain('refusal protocol');
    expect(lowerEn).toContain('example');
  });

  it('includes anti-jailbreak and prompt integrity protections', () => {
    const prompt = getSystemPrompt();
    const lower = prompt.toLowerCase();
    expect(lower).toContain('jailbreak');
    expect(lower).toContain('ignore previous instructions');
    expect(lower).toContain('never reveal');
  });

  it('preserves essential finance assistant invariants', () => {
    const prompt = getSystemPrompt('- food-beverage (Makanan & Minuman)');
    expect(prompt).toContain('No Financial Advice');
    expect(prompt).toContain('Data Privacy');
    expect(prompt).toContain('add_transaction');
    expect(prompt).toContain('transfer_funds');
    expect(prompt).toContain('query');
    expect(prompt).toContain('food-beverage');
  });
});
