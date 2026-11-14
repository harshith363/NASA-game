import { hasParticleRisk } from '../mission/dailyMission';
import type { MissionEvent } from '../mission/presentation';

const settingsKey = 'lunar-outpost-audio-v1';
const layers = ['foundation', 'pulse', 'peak'] as const;
const cues = ['arrival', 'interface', 'warning', 'forecast', 'shelter', 'allocation', 'harvest', 'delayed', 'interrupted'] as const;
type Cue = (typeof cues)[number];
type Mix = [number, number, number];

function loadSettings() {
  const defaults = { enabled: false, music: .30, effects: .35 };
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) ?? 'null');
    const level = (value: unknown, fallback: number) =>
      typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
    return saved ? {
      enabled: saved.enabled === true, music: level(saved.music, defaults.music),
      effects: level(saved.effects, defaults.effects),
    } : defaults;
  } catch {
    return defaults;
  }
}

export function mountMissionAudio() {
  const mute = document.querySelector<HTMLButtonElement>('#mute')!;
  const music = document.querySelector<HTMLInputElement>('#music-volume')!;
  const effects = document.querySelector<HTMLInputElement>('#effects-volume')!;
  const status = document.querySelector<HTMLElement>('#sound-status')!;
  const settings = loadSettings();
  const preferred = document.querySelector(settings.enabled ? '#start-sound' : '#start-muted')!;
  preferred.classList.add('preferred-audio');
  music.value = String(settings.music * 100);
  effects.value = String(settings.effects * 100);
  let context: AudioContext | undefined;
  let musicBus: GainNode;
  let effectsBus: GainNode;
  let buffers: Promise<AudioBuffer | undefined>[] = [];
  const cueBuffers = new Map<Cue, Promise<AudioBuffer | undefined>>();
  let mix: Mix = [.78, 0, 0];
  let loopNodes: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
  let generation = 0;
  let launched = false;
  let activation = 0;
  let cueEpoch = 0;
  const playing = new Map<Cue, AudioBufferSourceNode>();
  const timers = new Set<number>();
  const seen = new Set<string>();

  function remember() {
    try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch { /* Private storage. */ }
  }

  function updateLevels() {
    mute.setAttribute('aria-pressed', String(!settings.enabled));
    mute.textContent = settings.enabled ? 'Mute' : 'Unmute';
    if (!context) return;
    musicBus.gain.setTargetAtTime(settings.music, context.currentTime, .04);
    effectsBus.gain.setTargetAtTime(settings.effects, context.currentTime, .04);
  }

  function setMix(next: Mix, seconds = 1.35) {
    mix = next;
    if (!context) return;
    const now = context.currentTime;
    loopNodes.forEach(({ gain }, index) => {
      gain.gain.cancelAndHoldAtTime(now);
      gain.gain.linearRampToValueAtTime(next[index], now + seconds);
    });
  }

  async function load(ctx: AudioContext, name: string) {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}audio/${name}.wav`);
      return response.ok ? await ctx.decodeAudioData(await response.arrayBuffer()) : undefined;
    } catch {
      return undefined;
    }
  }

  function initialize() {
    const ctx = context = new AudioContext();
    musicBus = ctx.createGain();
    effectsBus = ctx.createGain();
    musicBus.connect(ctx.destination);
    effectsBus.connect(ctx.destination);
    musicBus.gain.value = settings.music;
    effectsBus.gain.value = settings.effects;
    buffers = layers.map((name) => load(ctx, name));
    void Promise.all(buffers).then((decoded) => {
      if (decoded.some((buffer) => !buffer)) status.textContent = 'Some sounds could not load. You can still play.';
    });
    for (const name of cues) cueBuffers.set(name, load(ctx, name));
    void Promise.all(cueBuffers.values()).then((decoded) => {
      if (decoded.some((buffer) => !buffer)) status.textContent = 'Some sounds could not load. You can still play.';
    });
    return ctx;
  }

  async function startLoop() {
    if (!context || !settings.enabled || document.hidden || loopNodes.length) return;
    const run = generation;
    const decoded = await Promise.all(buffers);
    if (!context || run !== generation || !settings.enabled || document.hidden || loopNodes.length) return;
    const ctx = context;
    const startAt = ctx.currentTime + .05;
    // Keep the stem indexes stable even if an individual file is unavailable.
    loopNodes = decoded.map((buffer, index) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer ?? ctx.createBuffer(1, 1, ctx.sampleRate);
      source.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = buffer ? mix[index] : 0;
      source.connect(gain).connect(musicBus);
      source.start(startAt);
      return { source, gain };
    });
  }

  function stopCues() {
    cueEpoch++;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    for (const source of playing.values()) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    playing.clear();
  }

  async function updatePlayback() {
    if (!launched) return;
    const attempt = ++activation;
    try {
      if (!settings.enabled || document.hidden) {
        stopCues();
        if (context?.state === 'running') await context.suspend();
        return;
      }
      const ctx = context ?? initialize();
      // A blocked resume may never settle. Mission progression never waits on it.
      const timeout = window.setTimeout(() => {
        if (attempt === activation && ctx.state !== 'running') status.textContent = 'Sound is unavailable. You can still play.';
      }, 1300);
      try { await ctx.resume(); } finally { clearTimeout(timeout); }
      if (attempt !== activation || !settings.enabled || document.hidden) return;
      await startLoop();
    } catch {
      if (attempt === activation) status.textContent = 'Sound is unavailable. You can still play.';
    }
  }

  function start(enabled: boolean) {
    launched = true;
    settings.enabled = enabled;
    remember();
    updateLevels();
    void updatePlayback();
  }

  async function cue(name: Cue) {
    const ctx = context;
    const epoch = cueEpoch;
    const startedAt = performance.now();
    if (!ctx || document.hidden || !settings.enabled) return;
    const buffer = await cueBuffers.get(name);
    if (epoch !== cueEpoch || performance.now() - startedAt > 1200 || ctx.state !== 'running'
      || !buffer || document.hidden || !settings.enabled || playing.has(name)) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(effectsBus);
    playing.set(name, source);
    source.onended = () => { playing.delete(name); source.disconnect(); };
    source.start();
  }

  function later(name: Cue, ms: number) {
    if (!settings.enabled || document.hidden) return;
    const timer = window.setTimeout(() => { timers.delete(timer); cue(name); }, ms);
    timers.add(timer);
  }

  function once(key: string, name: Cue) {
    if (seen.has(key)) return;
    seen.add(key);
    cue(name);
  }

  function present(event: MissionEvent) {
    switch (event.type) {
      case 'arrival':
        setMix([.88, 0, 0]);
        once('arrival', 'arrival');
        break;
      case 'warning':
        if (!seen.has('warning')) {
          stopCues();
          setMix([.72, .24, 0]);
          once('warning', 'warning');
        }
        break;
      case 'forecast':
        cue('forecast');
        break;
      case 'day': {
        const { phase, next } = event.result;
        setMix(phase === 'peak' ? [.7, .76, .64] : hasParticleRisk(phase) ? [.72, .64, .17] : [.88, .08, 0]);
        cue('interface');
        if (event.duration) {
          later('allocation', 650);
          if (hasParticleRisk(phase) && next.outcome !== 'interrupted') later('shelter', 1350);
        }
        break;
      }
      case 'settled':
        if (timers.size) stopCues();
        setMix(hasParticleRisk(event.phase) ? [.64, .29, .26] : [.88, .08, 0]);
        break;
      case 'debrief':
        stopCues();
        if (event.state.outcome === 'ready') setMix([.88, .08, 0]);
        else if (event.state.outcome === 'shortfall') cue('delayed');
        else { setMix([.46, 0, 0]); cue('interrupted'); }
        break;
      case 'reset':
        generation++;
        stopCues();
        seen.clear();
        for (const { source, gain } of loopNodes) { source.stop(); source.disconnect(); gain.disconnect(); }
        loopNodes = [];
        setMix([.88, .08, 0]);
        void startLoop();
        break;
    }
  }

  mute.addEventListener('click', () => start(!settings.enabled));
  for (const [input, key] of [[music, 'music'], [effects, 'effects']] as const) {
    input.addEventListener('input', () => {
      settings[key] = Number(input.value) / 100;
      remember();
      updateLevels();
    });
  }
  document.addEventListener('visibilitychange', () => void updatePlayback());
  updateLevels();
  return { start, resume: () => start(settings.enabled), present };
}
