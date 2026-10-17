/**
 * silenceDetector — Voice activity detection from the raw microphone signal.
 *
 * Why this exists: Web Speech tells us *what* was said, but it is a terrible
 * clock for *when* the speaker stopped. Its `onresult` cadence is whatever
 * Google's servers happen to return, which varies with network load and speech
 * rate. Using "time since the last result" as a silence proxy therefore fails
 * in both directions at once — slow results cut a turn mid-word, while stale
 * results trickling during a real pause keep resetting the timer so the turn
 * never ends. No pause threshold fixes both, because both are the same
 * measurement being misused.
 *
 * So this measures what actually matters: microphone energy. An AnalyserNode
 * runs alongside Web Speech and reports genuine sustained silence.
 * Transcription still comes from Web Speech; only the stop decision moves here.
 *
 * Costs nothing: the same getUserMedia stream, a few ms of arithmetic per frame,
 * entirely local and free.
 */

/** Tuned for a laptop mic in a normal room. */
const SILENCE_RMS = 0.012;
/** Frames sampled per second. 20Hz is ~50ms of resolution — plenty for speech. */
const ANALYSIS_HZ = 20;
/** Above this the room is noisy enough that energy-based cutting is unsafe. */
const NOISY_RMS = 0.16;
/** Guard: never treat a gap shorter than this as a pause between turns. */
const MIN_SILENCE_MS = 250;

export interface SilenceDetector {
  /** Start analysing. Resolves false when the mic could not be opened. */
  start(): Promise<boolean>;
  stop(): void;
  /** Fired once per silence episode, after `silenceMs` of genuine quiet. */
  onSilence(cb: () => void): void;
  /** True when background noise makes energy-based detection unreliable. */
  isNoisy(): boolean;
}

export function createSilenceDetector(silenceMs: number): SilenceDetector {
  const windowFrames = Math.max(
    Math.round((silenceMs / 1000) * ANALYSIS_HZ),
    Math.ceil((MIN_SILENCE_MS / 1000) * ANALYSIS_HZ),
  );

  let ctx: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let analyser: AnalyserNode | null = null;
  let buffer: Float32Array<ArrayBuffer> | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  let callback: (() => void) | null = null;

  /** One entry per analysed frame; true means "this frame was silent". */
  const frames: boolean[] = [];
  /** Fires once per silence episode, not once per frame. */
  let fired = false;
  let noisy = false;

  const teardown = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    frames.length = 0;
    fired = false;
    noisy = false;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (ctx && ctx.state !== "closed") void ctx.close().catch(() => undefined);
    ctx = null;
    analyser = null;
    buffer = null;
  };

  const sample = () => {
    if (!analyser || !buffer) return;
    analyser.getFloatTimeDomainData(buffer);

    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    const rms = Math.sqrt(sum / buffer.length);

    if (rms > NOISY_RMS) {
      // Too loud to judge silence from energy. Say so and let the caller fall
      // back to its original result-driven timing rather than cutting on noise.
      noisy = true;
      frames.length = 0;
      fired = false;
      return;
    }
    noisy = false;

    const silent = rms <= SILENCE_RMS;
    frames.push(silent);
    if (frames.length > windowFrames) frames.shift();

    if (silent) {
      if (!fired && frames.length >= windowFrames) {
        fired = true;
        callback?.();
      }
    } else {
      // Speech resumed: a new pause must be able to end the next turn.
      fired = false;
    }
  };

  return {
    isNoisy: () => noisy,

    onSilence(cb) {
      callback = cb;
    },

    async start() {
      if (typeof window === "undefined") return false;
      if (!navigator.mediaDevices?.getUserMedia) return false;
      if (analyser) return true; // already running — a restart, not a session

      try {
        // Raw signal, deliberately unprocessed. This stream exists only to
        // measure energy, and the DSP filters are actively harmful here:
        // echoCancellation is designed to suppress the near-end speaker, so on
        // this stream it can cancel the very voice we are trying to detect —
        // the VAD would read silence while the user is plainly talking. The
        // filters that matter for clarity are already applied on Web Speech's
        // own capture stream.
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });

        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) {
          teardown();
          return false;
        }
        ctx = new Ctor();
        // Autoplay policies can hand back a suspended context.
        if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);

        const source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        buffer = new Float32Array(analyser.fftSize);

        frames.length = 0;
        fired = false;
        interval = setInterval(sample, 1000 / ANALYSIS_HZ);
        return true;
      } catch {
        // No mic permission, or another app holds the device. The caller keeps
        // working through its original result-driven timing.
        teardown();
        return false;
      }
    },

    stop() {
      teardown();
    },
  };
}