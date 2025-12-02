import os
import subprocess

# Pad naar je map
directory = r"C:\Users\Gebruiker\Documents\GitHub\kerstknallers\alerts"

# Video extensies
video_ext = ('.mp4', '.webm', '.mov', '.mkv')

# Audio extensies
audio_ext = ('.mp3', '.wav', '.ogg', '.m4a')

# Audio-only compression settings (less aggressive than before)
# Adjust these values if you want different tradeoff between size and quality.
# Examples: '192k', '256k'
AUDIO_BITRATE = "192k"
# If set to an integer 0-9 for libmp3lame VBR quality, use QMODE = True and set AUDIO_QUALITY
# Lower numbers mean better quality for VBR (0 best, 9 worst). If QMODE is True, -q:a is used.
QMODE = False
AUDIO_QUALITY = 2

def compress_video(input_path):
    temp_path = input_path + ".tmp.mp4"

    command = [
        "ffmpeg",
        "-i", input_path,

        # Video lager schalen voor extra compressie
        "-vf", "scale=-2:240",

        # Sterkere compressie
        "-c:v", "libx264",
        "-crf", "30",
        "-preset", "medium",

        # Audio wél comprimeren
        "-c:a", "libopus",
        "-b:a", "64k",

        "-y",
        temp_path
    ]

    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        os.replace(temp_path, input_path)
        print(f"🎬 Video gecomprimeerd: {os.path.basename(input_path)}")
    except subprocess.CalledProcessError:
        print(f"⚠️ Fout bij video: {input_path}")
        if os.path.exists(temp_path):
            os.remove(temp_path)


def compress_audio(input_path):
    temp_path = input_path + ".tmp.mp3"

    # For audio-only files we use a higher bitrate / quality to avoid
    # over-compressing voice/sfx. Default uses CBR via -b:a, but can be
    # switched to VBR (libmp3lame -q:a) by setting QMODE = True above.
    command = [
        "ffmpeg",
        "-i", input_path,
        "-c:a", "libmp3lame",
    ]

    if QMODE:
        command += ["-q:a", str(AUDIO_QUALITY)]
    else:
        command += ["-b:a", AUDIO_BITRATE]

    command += ["-y", temp_path]

    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        os.replace(temp_path, input_path)
        print(f"🎵 Audio gecomprimeerd: {os.path.basename(input_path)}")
    except subprocess.CalledProcessError:
        print(f"⚠️ Fout bij audio: {input_path}")
        if os.path.exists(temp_path):
            os.remove(temp_path)



# Bestanden doorlopen
for root, dirs, files in os.walk(directory):
    for file in files:
        full_path = os.path.join(root, file)
        low = file.lower()

        if low.endswith(video_ext):
            compress_video(full_path)

        elif low.endswith(audio_ext):
            compress_audio(full_path)

print("\n✅ Alles is verwerkt.")
