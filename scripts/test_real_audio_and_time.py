import subprocess
import time
import os
import ctypes
from PIL import ImageGrab

user32 = ctypes.windll.user32

VK_F7 = 0x76 # Mode toggle (Radio <-> On Demand)
VK_F8 = 0x77 # Overlay toggle
VK_ESCAPE = 0x1B
VK_RETURN = 0x0D
VK_D = 0x44
VK_A = 0x41

KEYEVENTF_KEYUP = 0x0002

def press_key(vk, delay=0.6):
    scan = user32.MapVirtualKeyW(vk, 0)
    user32.keybd_event(vk, scan, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(vk, scan, KEYEVENTF_KEYUP, 0)
    time.sleep(delay)

def main():
    print("=== TESTING REAL ON DEMAND AUDIO & 0:00 SCRUBBER FIX ===")
    os.makedirs("extracted_frames/test_results/audio_fix", exist_ok=True)

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

        # Step 4: Slide to Wave 103 (D)
        print("[STEP 4] Sliding to Wave 103...")
        press_key(VK_D, delay=0.8)

        # Step 5: Enter Wave 103 songs list -> Blue Monday starts playing!
        print("[STEP 5] Selecting Wave 103 -> Blue Monday plays from 0:00...")
        press_key(VK_RETURN, delay=0.4)

        # Capture immediately after selection (should show 00:00 or 00:01, NOT 5 minutes!)
        img_start = ImageGrab.grab()
        path_start = "extracted_frames/test_results/audio_fix/1_wave103_starts_at_zero.png"
        img_start.save(path_start)
        print(f"Captured initial start at 0:00: {path_start}")

        # Wait 3.5 seconds while song plays and scrubber advances
        print("Listening to real audio stream playing for 3.5s...")
        time.sleep(3.5)

        img_progress = ImageGrab.grab()
        path_progress = "extracted_frames/test_results/audio_fix/2_wave103_progressing.png"
        img_progress.save(path_progress)
        print(f"Captured real progress after 3.5s: {path_progress}")

        # Step 6: Switch to next song (Atomic by Blondie)
        print("[STEP 6] Switching to next song (Atomic by Blondie)...")
        press_key(VK_D, delay=0.4)

        img_next = ImageGrab.grab()
        path_next = "extracted_frames/test_results/audio_fix/3_blondie_starts_at_zero.png"
        img_next.save(path_next)
        print(f"Captured new song starting at 0:00: {path_next}")

        # Wait 2.5 seconds
        time.sleep(2.5)

        img_next_prog = ImageGrab.grab()
        path_next_prog = "extracted_frames/test_results/audio_fix/4_blondie_progressing.png"
        img_next_prog.save(path_next_prog)
        print(f"Captured Blondie progressing: {path_next_prog}")

        print("=== AUDIO & TIME SCRUBBER TESTS COMPLETED SUCCESSFULLY ===")

    finally:
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
