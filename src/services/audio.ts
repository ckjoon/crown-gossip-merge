// audio.ts — WebAudio 신시사이저 효과음 (v2 SoundEngine 이전)

type Wave = OscillatorType;

export class SoundEngine {
  enabled = true;
  private ctx: AudioContext | null = null;

  private init(): void {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  private tone(freq: number, dur = 0.1, type: Wave = "sine", vol = 0.12, delay = 0): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  tap(): void {
    this.tone(560, 0.06, "triangle", 0.08);
  }
  spawn(): void {
    this.tone(440, 0.07, "sine", 0.1, 0);
    this.tone(660, 0.09, "sine", 0.12, 0.04);
  }
  merge(lv = 2, sparkle = false): void {
    const base = 360 + lv * 55;
    this.tone(base, 0.1, "triangle", 0.14, 0);
    this.tone(base * 1.25, 0.14, "sine", 0.16, 0.06);
    if (sparkle || lv >= 5) this.tone(base * 1.5, 0.22, "triangle", 0.18, 0.12);
  }
  serve(): void {
    this.tone(523.25, 0.1, "sine", 0.14, 0);
    this.tone(659.25, 0.1, "sine", 0.14, 0.07);
    this.tone(783.99, 0.12, "sine", 0.15, 0.14);
    this.tone(1046.5, 0.25, "triangle", 0.18, 0.21);
  }
  reward(): void {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.18, "triangle", 0.15, i * 0.08));
  }
  warn(): void {
    this.tone(190, 0.14, "sawtooth", 0.08, 0);
  }
}
