# voice.py - voices every beat in script.json with Kokoro (kokoro-onnx), loading the model ONCE.
# `hyperframes tts` reloads the ~300 MB model for every call; this batches all beats in one process.
# It uses the same model, voices file and settings as `hyperframes tts`, so results are identical.
# Raw clips go to assets/voice/raw/ (make-voice.mjs then loudness-normalises them into assets/voice/).
# Existing raw clips are kept (delete one to re-voice it).   Run from presentation/demo-video.
import inspect, json, os, sys
import kokoro_onnx
import soundfile as sf

base = os.path.join(os.path.expanduser("~"), ".cache", "hyperframes", "tts")
model = kokoro_onnx.Kokoro(
    os.path.join(base, "models", "kokoro-v1.0.onnx"),
    os.path.join(base, "voices", "voices-v1.0.bin"),
)
script = json.load(open("script.json", encoding="utf8"))
voice, speed = script["voice"], float(script["speed"])
kwargs = {"voice": voice, "speed": speed}
if "lang" in inspect.signature(model.create).parameters:
    kwargs["lang"] = "en-us"

os.makedirs("assets/voice/raw", exist_ok=True)
for scene in script["scenes"]:
    for beat in scene["beats"]:
        out = f"assets/voice/raw/{beat['id']}.wav"
        if os.path.exists(out) and os.path.getsize(out) > 20000:
            print("keep ", beat["id"], flush=True)
            continue
        samples, rate = model.create(beat["say"], **kwargs)
        sf.write(out, samples, rate)
        print("voice", beat["id"], round(len(samples) / rate, 2), "s", flush=True)
