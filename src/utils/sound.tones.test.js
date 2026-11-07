// sound.test.js covers the mute switch. This file covers the sound generation itself:
// what playTone asks the Web Audio API to do. jsdom has no audio device, so a fake
// AudioContext records every call. The module caches its audio context, so every test
// loads a fresh copy of it.

const presetNames = Object.keys(require('./sound').sounds);

let created;
function installFakeAudio({ state = 'running', globalName = 'AudioContext' } = {}) {
  created = { contexts: [], oscillators: [], gains: [] };
  class FakeAudioContext {
    constructor() {
      this.state = state;
      this.currentTime = 10;
      this.destination = { name: 'destination' };
      this.resume = jest.fn();
      created.contexts.push(this);
    }
    createOscillator() {
      const osc = {
        type: '',
        frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
        connect: jest.fn(), start: jest.fn(), stop: jest.fn(),
      };
      created.oscillators.push(osc);
      return osc;
    }
    createGain() {
      const gain = {
        gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
        connect: jest.fn(),
      };
      created.gains.push(gain);
      return gain;
    }
  }
  window[globalName] = FakeAudioContext;
}

function loadSound({ muted = false } = {}) {
  localStorage.setItem('rg_muted', String(muted));
  jest.resetModules();
  return require('./sound');
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  delete window.AudioContext;
  delete window.webkitAudioContext;
  localStorage.clear();
  jest.useRealTimers();
});

describe('what one tone asks the audio API to do', () => {
  test('eat: a short square beep, wired oscillator -> gain -> speakers, then stopped', () => {
    installFakeAudio();
    const { sounds } = loadSound();
    sounds.eat();

    const [osc] = created.oscillators;
    const [gain] = created.gains;
    const { destination } = created.contexts[0];

    expect(osc.type).toBe('square');
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(440, 10);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.12, 10);
    // the volume fades to near-silence over the tone's duration (0.08s)
    const [fadeTo, fadeAt] = gain.gain.exponentialRampToValueAtTime.mock.calls[0];
    expect(fadeTo).toBe(0.001);
    expect(fadeAt).toBeCloseTo(10.08);
    expect(osc.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(destination);
    expect(osc.start).toHaveBeenCalledTimes(1);
    expect(osc.stop.mock.calls[0][0]).toBeCloseTo(10.08);
  });

  test('a tone without a sweep leaves the pitch alone', () => {
    installFakeAudio();
    loadSound().sounds.eat();
    expect(created.oscillators[0].frequency.exponentialRampToValueAtTime).not.toHaveBeenCalled();
  });

  test('a sweeping tone glides the pitch to its target over its duration', () => {
    installFakeAudio();
    loadSound().sounds.gameOver(); // 300Hz sliding down to 80Hz over 0.4s
    const osc = created.oscillators[0];
    expect(osc.type).toBe('sawtooth');
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(300, 10);
    const [target, at] = osc.frequency.exponentialRampToValueAtTime.mock.calls[0];
    expect(target).toBe(80);
    expect(at).toBeCloseTo(10.4);
  });
});

describe('the audio context', () => {
  test('a suspended context (browser autoplay policy) is resumed before playing', () => {
    installFakeAudio({ state: 'suspended' });
    loadSound().sounds.eat();
    expect(created.contexts[0].resume).toHaveBeenCalledTimes(1);
  });

  test('a running context is left alone', () => {
    installFakeAudio({ state: 'running' });
    loadSound().sounds.eat();
    expect(created.contexts[0].resume).not.toHaveBeenCalled();
  });

  test('one context is created and reused for every sound', () => {
    installFakeAudio();
    const { sounds } = loadSound();
    sounds.eat();
    sounds.move();
    sounds.eat();
    expect(created.contexts).toHaveLength(1);
    expect(created.oscillators).toHaveLength(3);
  });

  test('falls back to the prefixed webkitAudioContext on older browsers', () => {
    installFakeAudio({ globalName: 'webkitAudioContext' });
    loadSound().sounds.eat();
    expect(created.oscillators).toHaveLength(1);
  });

  test('with no audio support at all, playing a sound does nothing and does not throw', () => {
    created = { contexts: [], oscillators: [], gains: [] };
    const { sounds } = loadSound();
    expect(() => sounds.eat()).not.toThrow();
    expect(created.oscillators).toHaveLength(0);
  });
});

describe('muting', () => {
  test('while muted nothing is played and no audio context is even created', () => {
    installFakeAudio();
    loadSound({ muted: true }).sounds.eat();
    expect(created.contexts).toHaveLength(0);
    expect(created.oscillators).toHaveLength(0);
  });

  test('muting and unmuting mid-session takes effect on the next sound', () => {
    installFakeAudio();
    const { sounds, setMuted } = loadSound();
    sounds.eat();
    expect(created.oscillators).toHaveLength(1);
    setMuted(true);
    sounds.eat();
    expect(created.oscillators).toHaveLength(1); // silent
    setMuted(false);
    sounds.eat();
    expect(created.oscillators).toHaveLength(2);
  });
});

describe('multi-note sounds', () => {
  test('milestone plays a chime, then a higher one 90ms later', () => {
    installFakeAudio();
    loadSound().sounds.milestone();
    expect(created.oscillators).toHaveLength(1);
    expect(created.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(700, 10);
    jest.advanceTimersByTime(89);
    expect(created.oscillators).toHaveLength(1); // not yet
    jest.advanceTimersByTime(1);
    expect(created.oscillators).toHaveLength(2);
    expect(created.oscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(1000, 10);
  });

  test('pongWin plays three rising notes', () => {
    installFakeAudio();
    loadSound().sounds.pongWin();
    jest.advanceTimersByTime(1000);
    const pitches = created.oscillators.map(o => o.frequency.setValueAtTime.mock.calls[0][0]);
    expect(pitches).toEqual([523, 659, 784]);
  });
});

describe('every sound preset', () => {
  test('the preset list is what the games rely on (guards against a silent rename)', () => {
    expect(presetNames).toEqual(expect.arrayContaining([
      'eat', 'milestone', 'move', 'gameOver', 'paddleHit', 'wallBounce',
      'pongScore', 'matchPoint', 'pongWin', 'pongLose',
    ]));
  });

  test.each(presetNames)('%s plays at least one tone without throwing', (name) => {
    installFakeAudio();
    const { sounds } = loadSound();
    expect(() => { sounds[name](); jest.advanceTimersByTime(2000); }).not.toThrow();
    expect(created.oscillators.length).toBeGreaterThanOrEqual(1);
  });

  test.each(presetNames)('%s is silent while muted', (name) => {
    installFakeAudio();
    const { sounds } = loadSound({ muted: true });
    sounds[name]();
    jest.advanceTimersByTime(2000);
    expect(created.oscillators).toHaveLength(0);
  });
});
