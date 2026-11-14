"""Render the original Lunar Outpost score and cues to mono WAV (Python 3)."""
import math
import sys
import wave
from array import array
from pathlib import Path

RATE = 22_050
BEAT = .75
LENGTH = BEAT * 64
out = Path(sys.argv[1] if len(sys.argv) > 1 else "public/audio")
out.mkdir(parents=True, exist_ok=True)


def tone(track, start, duration, midi, volume, timbre="bell"):
    first, count = round(start * RATE), round(duration * RATE)
    omega = math.tau * 440 * 2 ** ((midi - 69) / 12) / RATE
    attack, release = {"pad": (.72, 1.33), "pulse": (.025, .18), "bell": (.035, .46)}[timbre]
    for i in range(count):
        t = i / RATE
        envelope = min(1, t / attack, (duration - t) / release)
        phase = omega * i
        if timbre == "pad":
            sample = .70 * math.sin(phase) + .15 * math.sin(phase * 2) + .15 * math.sin(phase * 1.003)
        elif timbre == "pulse":
            sample = (.86 * math.sin(phase) + .14 * math.sin(phase * 2)) * math.exp(-t * 5)
        else:
            sample = .83 * math.sin(phase) + .17 * math.sin(phase * 3.01) * math.exp(-t * 8)
        track[(first + i) % len(track)] += volume * envelope * sample


def save(name, track):
    samples = array("h", (round(max(-1, min(1, val)) * 32767) for val in track))
    if sys.byteorder != "little":
        samples.byteswap()
    with wave.open(str(out / f"{name}.wav"), "wb") as target:
        target.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        target.writeframes(samples.tobytes())


pad, pulse, peak = ([0.] * round(LENGTH * RATE) for _ in range(3))
# Eight two-bar phrases, moving between D major, B minor, G major and A sus.
chords = [(50, 57, 62, 66), (47, 54, 57, 62), (43, 55, 59, 62), (45, 57, 62, 64),
          (50, 57, 61, 66), (47, 54, 59, 62), (43, 55, 59, 66), (45, 57, 62, 64)]
for bar, (root, fifth, middle, high) in enumerate(chords):
    start = bar * 8 * BEAT
    for note, volume in zip((root, fifth, middle, high), (.125, .079, .053, .045)):
        tone(pad, start - .45, 8 * BEAT + 1.18, note, volume, "pad")
    for beat, note in [(0, root), (2, fifth), (3.5, middle), (5, root), (6.5, fifth)]:
        tone(pulse, start + beat * BEAT, .52, note, .23, "pulse")
    for beat, note in [(1.5, high + 12), (3, middle + 12), (5.5, fifth + 12), (7, middle + 12)]:
        tone(peak, start + beat * BEAT, .78, note, .14, "bell")
    tone(peak, start - .25, 8 * BEAT + .85, root - 12, .17, "pad")

motif = [(0, 62), (.39, 66), (.82, 69), (1.28, 73), (1.97, 74)]
for time, note in motif:
    for offset, amplitude in [(0, .12), (.29, .02)]:
        tone(pad, time + offset + .75, .95, note, amplitude)
        tone(pad, time + offset + 24.75, .95, note, amplitude)
for name, track in [("foundation", pad), ("pulse", pulse), ("peak", peak)]:
    save(name, track)

cues = {
    "arrival": motif,
    "interface": [(0, 69), (.08, 74)],
    "warning": [(0, 69), (.22, 65), (.46, 69)],
    "forecast": [(0, 74), (.15, 81), (.29, 78)],
    "shelter": [(0, 50), (.12, 62), (.27, 69)],
    "allocation": [(0, 57), (.16, 62), (.31, 66)],
    "harvest": motif + [(2.16, 66), (2.33, 69)],
    "delayed": [(0, 62), (.4, 66), (.8, 69), (1.34, 64)],
    "interrupted": [(0, 62), (.39, 65), (.82, 57)],
}
for name, notes in cues.items():
    track = [0.] * round((notes[-1][0] + 1.15) * RATE)
    for start, note in notes:
        tone(track, start, 1., note, .29)
        tone(track, start + .11, .76, note - 12, .06, "pad")
    save(name, track)
