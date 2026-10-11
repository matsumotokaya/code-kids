import { describe, expect, it } from 'vitest';
import { migrateProgress } from './progress';
import { userForPassword } from './session';

describe('userForPassword', () => {
  it('accepts each child password regardless of case and surrounding spaces', () => {
    expect(userForPassword('SEIGEN')).toBe('seigen');
    expect(userForPassword('Seigen')).toBe('seigen');
    expect(userForPassword(' amane ')).toBe('amane');
  });

  it('rejects anything else', () => {
    expect(userForPassword('')).toBeNull();
    expect(userForPassword('SEIGE')).toBeNull();
    expect(userForPassword('AMANE1')).toBeNull();
  });
});

describe('migrateProgress', () => {
  it('gives both children the per-character progress saved before login existed', () => {
    const v1 = {
      character: 'neko',
      soundOn: false,
      profiles: { robo: { 1: { stars: 3, bestSlots: 2 } }, neko: { 1: { stars: 1, bestSlots: 4 } }, usagi: {} },
    };
    const v2 = migrateProgress(v1, 1);
    expect(v2.soundOn).toBe(false);
    for (const user of ['seigen', 'amane'] as const) {
      expect(v2.users[user].character).toBe('neko');
      expect(v2.users[user].profiles.robo[1]).toEqual({ stars: 3, bestSlots: 2 });
      expect(v2.users[user].profiles.neko[1]).toEqual({ stars: 1, bestSlots: 4 });
    }
    expect(v2.users.seigen.profiles).not.toBe(v2.users.amane.profiles);
  });

  it('starts empty when nothing was saved', () => {
    const v2 = migrateProgress(undefined, 0);
    expect(v2.soundOn).toBe(true);
    expect(v2.users.amane).toEqual({ character: null, profiles: { robo: {}, neko: {}, usagi: {} } });
  });
});
