import mido

MIDI_PATH = "wozzeck_1970_manual.mid"


def main():
    mid = mido.MidiFile(MIDI_PATH)
    ticks_per_beat = mid.ticks_per_beat

    for track in mid.tracks:
        tempo = 500000  # default 120 BPM, in microseconds per beat
        ticks = 0
        ms = 0.0
        act = 1
        it = 1
        data = {"1": {}, "2": {}, "3": {}}
        for msg in track:
            delta_ms = mido.tick2second(msg.time, ticks_per_beat, tempo) * 1000
            ms += delta_ms
            ticks += msg.time

            if msg.type == "set_tempo":
                tempo = msg.tempo
            elif msg.type == "note_on" and msg.velocity > 0:
                if (msg.note == 16):
                    it = 1
                    act += 1
                print(f"{it}\t{ms:.2f} ms\tpitch {msg.note}")
                data[str(act)][str(it)] = ms / 1000
                it += 1
    print(data)


if __name__ == "__main__":
    main()
