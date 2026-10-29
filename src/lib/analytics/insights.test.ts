import { describe, it, expect } from 'vitest';
import { generateInsights } from './insights';
import { generateDeterministicDemoData } from '../data/demoData';

describe('Deterministic Insights Engine', () => {
  it('generates rich rule-based insights from demo data without LLM dependence', () => {
    const { campaigns, creatives, observations } = generateDeterministicDemoData();
    const insights = generateInsights(campaigns, creatives, observations);

    expect(insights.length).toBeGreaterThan(2);

    const categories = new Set(insights.map((i) => i.category));
    expect(categories.has('CREATIVE_WINNER') || categories.has('BUDGET_EFFICIENCY')).toBe(true);

    insights.forEach((ins) => {
      expect(ins.title.length).toBeGreaterThan(5);
      expect(ins.explanation.length).toBeGreaterThan(15);
      expect(ins.supportingValue.length).toBeGreaterThan(0);
      expect(['INFO', 'POSITIVE', 'WARNING', 'CRITICAL']).toContain(ins.severity);
    });
  });

  it('handles empty datasets safely without exceptions', () => {
    const insights = generateInsights([], [], []);
    expect(insights).toEqual([]);
  });
});
