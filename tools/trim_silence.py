import os
from pydub import AudioSegment

# Pad to the folder with MP3s
FOLDER = r"C:\\Users\\Gebruiker\\Documents\\GitHub\\kerstknallers\\soundeffects"

# Silence threshold in dBFS and minimum silence duration
SILENCE_THRESH = -40  # adjust if needed
MIN_SILENCE_LEN_MS = 200  # minimum silence considered at start or end

def detect_leading_silence(sound, silence_threshold=SILENCE_THRESH, chunk_size=10):
    '''Returns duration of silence at the beginning in ms.'''
    trim_ms = 0

    while trim_ms < len(sound) and sound[trim_ms:trim_ms+chunk_size].dBFS < silence_threshold:
        trim_ms += chunk_size
    return trim_ms

def detect_trailing_silence(sound, silence_threshold=SILENCE_THRESH, chunk_size=10):
    '''Returns duration of silence at the end in ms.'''
    trim_ms = 0

    while trim_ms < len(sound) and sound[-(trim_ms+chunk_size): -trim_ms if trim_ms != 0 else None].dBFS < silence_threshold:
        trim_ms += chunk_size
    return trim_ms


def trim_silence(file_path):
    audio = AudioSegment.from_mp3(file_path)

    start_silence = detect_leading_silence(audio)
    end_silence = detect_trailing_silence(audio)

    trimmed = audio[start_silence: len(audio) - end_silence]

    # Overwrite original file
    trimmed.export(file_path, format="mp3")
    print(f"Trimmed: {os.path.basename(file_path)}")


def main():
    for file in os.listdir(FOLDER):
        if file.lower().endswith(".mp3"):
            full_path = os.path.join(FOLDER, file)
            trim_silence(full_path)


if __name__ == "__main__":
    main()
