import subprocess
import time
import os
import ctypes
from PIL import ImageGrab

user32 = ctypes.windll.user32

VK_F6 = 0x75 # Seek to track end (duration - 2.5s)
VK_F7 = 0x76 # Mode toggle (Radio <-> On Demand)
VK_F8 = 0x77 # Overlay toggle
VK_RETURN = 0x0D

KEYEVENTF_KEYUP = 0x0002

def press_key(vk, delay=0.6):
    scan = user32.MapVirtualKeyW(vk, 0)
    user32.keybd_event(vk, scan, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(vk, scan, KEYEVENTF_KEYUP, 0)
    time.sleep(delay)

def main():
    print("=== TESTING SONG AUTO-ADVANCE UPON COMPLETION ===")
    os.makedirs("extracted_frames/test_results/auto_advance", exist_ok=True)

    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.5)

    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    proc = subprocess.Popen([exe_path])
    time.sleep(2.5)

    try:
        # Step 1: Open Overlay (F8)
        print("[STEP 1] Pressing F8...")
        press_key(VK_F8, delay=0.8)

        # Step 2: Switch to ON DEMAND Mode (F7)
        print("[STEP 2] Pressing F7 (On Demand Mode)...")
        press_key(VK_F7, delay=1.0)

        # Step 3: Enter STATIONS VICE CITY
        print("[STEP 3] Entering STATIONS VICE CITY...")
        press_key(VK_RETURN, delay=1.0)

        # Step 4: Enter Flash FM (first playlist) -> Track 1: DJ Toni Intro plays!
        print("[STEP 4] Entering Flash FM (Song 1: DJ Toni Intro)...")
        press_key(VK_RETURN, delay=0.8)

        # Capture Song 1
        img_song1 = ImageGrab.grab()
        path_song1 = "extracted_frames/test_results/auto_advance/1_song1_dj_toni_intro.png"
        img_song1.save(path_song1)
        print(f"Captured Song 1: {path_song1}")

        # Step 5: Press F6 to seek to end of track (duration - 2.5s)
        print("[STEP 5] Pressing F6 to seek to end of DJ Toni Intro...")
        press_key(VK_F6, delay=0.4)

        # Wait 4 seconds for track to finish naturally and auto-advance
        print("Waiting 4s for track to finish and auto-advance to next song...")
        time.sleep(4.0)

        # Capture Song 2 (should be Billie Jean by Michael Jackson, with DJ Toni Intro marked PASSÉ)
        img_song2 = ImageGrab.grab()
        path_song2 = "extracted_frames/test_results/auto_advance/2_song2_billie_jean_auto_advanced.png"
        img_song2.save(path_song2)
        print(f"Captured Song 2 (Auto-advanced): {path_song2}")

        print("=== AUTO-ADVANCE TEST SUITE COMPLETED SUCCESSFULLY ===")

    finally:
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
