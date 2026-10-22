import { describe, expect, it } from 'vitest';
import { coinBalance, levelCoins, newCoins, profileCoins } from './coins';

describe('coins', () => {
  it('pays 30 / 40 / 50 for ★1 / ★2 / ★3', () => {
    expect(levelCoins(0)).toBe(0);
    expect(levelCoins(1)).toBe(30);
    expect(levelCoins(2)).toBe(40);
    expect(levelCoins(3)).toBe(50);
  });

  it('pays only the difference when a level is improved, and nothing for a plain replay', () => {
    expect(newCoins(0, 1)).toBe(30);
    expect(newCoins(1, 3)).toBe(20);
    expect(newCoins(3, 3)).toBe(0);
    expect(newCoins(3, 1)).toBe(0);
  });

  it('adds up every level of a profile', () => {
    expect(profileCoins(undefined)).toBe(0);
    expect(profileCoins({ 1: { stars: 3, bestSlots: 2 }, 2: { stars: 1, bestSlots: 5 } })).toBe(80);
  });

  it('subtracts what was spent from what was earned', () => {
    expect(coinBalance(400, { 'mizu-no-michi': 300 })).toBe(100);
    expect(coinBalance(120, undefined)).toBe(120);
  });
});
