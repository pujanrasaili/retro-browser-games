import { isMuted, setMuted, toggleMuted } from './sound';

// `muted` is module-level state, initialized once from localStorage at import
// time and shared across every test in this file (Jest doesn't reset modules
// between individual test() calls). Resetting explicitly via setMuted() in
// beforeEach avoids one test's mute state leaking into the next.
describe('sound mute state', () => {
  beforeEach(() => {
    setMuted(false);
  });

  test('isMuted reflects the current muted state', () => {
    expect(isMuted()).toBe(false);
    setMuted(true);
    expect(isMuted()).toBe(true);
  });

  test('setMuted persists the value to localStorage as a string', () => {
    setMuted(true);
    expect(localStorage.getItem('rg_muted')).toBe('true');
    setMuted(false);
    expect(localStorage.getItem('rg_muted')).toBe('false');
  });

  test('toggleMuted flips the state and returns the new value', () => {
    setMuted(false);
    const result = toggleMuted();
    expect(result).toBe(true);
    expect(isMuted()).toBe(true);

    const result2 = toggleMuted();
    expect(result2).toBe(false);
    expect(isMuted()).toBe(false);
  });

  test('initializes muted state from localStorage on module load', () => {
    // This specific case can't use the already-imported module (its `muted`
    // variable was already initialized before this test ran), so force a
    // fresh module evaluation after setting localStorage first.
    localStorage.setItem('rg_muted', 'true');
    jest.resetModules();
    const fresh = require('./sound');
    expect(fresh.isMuted()).toBe(true);
  });

  test('defaults to unmuted when localStorage has no stored value', () => {
    localStorage.clear();
    jest.resetModules();
    const fresh = require('./sound');
    expect(fresh.isMuted()).toBe(false);
  });
});
