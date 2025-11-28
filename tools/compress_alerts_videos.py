import os
import subprocess

# Pad naar je map
directory = r"C:\Users\Gebruiker\Documents\GitHub\kerstknallers\alerts"

# Video extensies
video_ext = ('.mp4', '.webm', '.mov', '.mkv')

# Audio extensies
audio_ext = ('.mp3', '.wav', '.ogg', '.m4a')

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

    command = [
        "ffmpeg",
        "-i", input_path,
        "-c:a", "libmp3lame",
        "-b:a", "96k",
        "-y",
        temp_path
    ]

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
