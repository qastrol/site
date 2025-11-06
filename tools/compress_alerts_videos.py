import os
import subprocess

# Pad naar je map
directory = r"C:\Users\Gebruiker\Documents\GitHub\kerstknallers\alerts"

# Toegestane extensies
extensions = ('.mp4', '.webm')

# FFmpeg compressie parameters
# -vf scale: beperkt de hoogte tot 360 pixels, breedte wordt automatisch berekend (aspect ratio blijft behouden)
# -crf 28: bepaalt de kwaliteit (lager = beter, maar grotere bestanden)
# -preset medium: balans tussen snelheid en compressie
# -c:a copy: audio wordt niet opnieuw geëncodeerd
def compress_video(input_path):
    temp_path = input_path + ".tmp.mp4"

    command = [
        "ffmpeg",
        "-i", input_path,
        "-vf", "scale=-2:360",
        "-c:v", "libx264",
        "-crf", "28",
        "-preset", "medium",
        "-c:a", "copy",
        "-y",
        temp_path
    ]

    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        os.replace(temp_path, input_path)
        print(f"✅ Gecomprimeerd: {os.path.basename(input_path)}")
    except subprocess.CalledProcessError:
        print(f"⚠️ Fout bij het verwerken van: {input_path}")
        if os.path.exists(temp_path):
            os.remove(temp_path)


# Loop door de map en bewerk alle video's
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.lower().endswith(extensions):
            full_path = os.path.join(root, file)
            compress_video(full_path)

print("\n🎬 Alle video's zijn verwerkt.")
