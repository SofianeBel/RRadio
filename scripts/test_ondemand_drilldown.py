import subprocess
import time
import os
import ctypes
from PIL import ImageGrab

user32 = ctypes.windll.user32

# Virtual key codes
VK_F7 = 0x76 # Mode toggle (Radio <-> On Demand)
VK_F8 = 0x77 # Overlay toggle
VK_ESCAPE = 0x1B
VK_RETURN = 0x0D
VK_D = 0x44
VK_A = 0x41

KEYEVENTF_KEYUP = 0x0002

def press_key(vk, delay=0.35):
    user32.keybd_event(vk, 0, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(vk, 0, KEYEVENTF_KEYUP, 0)
    time.sleep(delay)

def main():
    print("=== STARTING ON DEMAND 3-LEVEL DRILL-DOWN TEST ===")
    os.makedirs("extracted_frames/test_results/ondemand", exist_ok=True)

    # 1. Kill any prior instance
    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.5)

    # 2. Launch native rradio.exe
    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    print("Launching:", exe_path)
    proc = subprocess.Popen([exe_path])
    time.sleep(2.5)

    try:
        # Step 1: Open Overlay (F8)
        print("[STEP 1] Pressing F8 (Toggle Overlay)...")
        press_key(VK_F8, delay=0.8)

        # Step 2: Switch to ON DEMAND Mode via F7
        print("[STEP 2] Pressing F7 (Switch to ON DEMAND Mode)...")
        press_key(VK_F7, delay=1.0)

        # Capture Level 1: Providers (Spotify in center)
        img_lvl1 = ImageGrab.grab()
        path_lvl1 = "extracted_frames/test_results/ondemand/1_level_providers.png"
        img_lvl1.save(path_lvl1)
        print(f"Captured Level 1 (Providers): {path_lvl1}")

        # Step 3: Browse to inspect Apple Music (Press 'D' 3 times)
        print("[STEP 3] Browsing right to Apple Music...")
        press_key(VK_D, delay=0.45)
        press_key(VK_D, delay=0.45)
        press_key(VK_D, delay=0.8)

        img_apple = ImageGrab.grab()
        path_apple = "extracted_frames/test_results/ondemand/1b_apple_music_coming_soon.png"
        img_apple.save(path_apple)
        print(f"Captured Apple Music (Coming Soon): {path_apple}")

        # Return to Spotify (Press 'A' 3 times)
        print("Browsing back left to Spotify...")
        press_key(VK_A, delay=0.4)
        press_key(VK_A, delay=0.4)
        press_key(VK_A, delay=0.6)

        # Step 4: Select Spotify -> Drill Down to Level 2 (Playlists)
        print("[STEP 4] Pressing Enter on Spotify (Drill down to Level 2: Playlists)...")
        press_key(VK_RETURN, delay=1.0)

        img_lvl2 = ImageGrab.grab()
        path_lvl2 = "extracted_frames/test_results/ondemand/2_level_playlists.png"
        img_lvl2.save(path_lvl2)
        print(f"Captured Level 2 (Playlists): {path_lvl2}")

        # Step 5: Select Playlist -> Drill Down to Level 3 (Queue)
        print("[STEP 5] Pressing Enter on Playlist (Drill down to Level 3: Queue)...")
        press_key(VK_RETURN, delay=1.0)

        img_lvl3 = ImageGrab.grab()
        path_lvl3 = "extracted_frames/test_results/ondemand/3_level_queue.png"
        img_lvl3.save(path_lvl3)
        print(f"Captured Level 3 (Queue Ribbon): {path_lvl3}")

        # Step 6: Step to next track in queue (D)
        print("[STEP 6] Moving to next track in queue (D)...")
        press_key(VK_D, delay=0.9)

        img_lvl3_next = ImageGrab.grab()
        path_lvl3_next = "extracted_frames/test_results/ondemand/3b_level_queue_next_track.png"
        img_lvl3_next.save(path_lvl3_next)
        print(f"Captured Level 3 after next track: {path_lvl3_next}")

        # Step 7: Press Escape -> Go back UP to Level 2 (Playlists)
        print("[STEP 7] Pressing Escape (Back up to Level 2: Playlists)...")
        press_key(VK_ESCAPE, delay=1.0)

        img_back_lvl2 = ImageGrab.grab()
        path_back_lvl2 = "extracted_frames/test_results/ondemand/4_back_level_playlists.png"
        img_back_lvl2.save(path_back_lvl2)
        print(f"Captured Back to Level 2: {path_back_lvl2}")

        # Step 8: Press Escape -> Go back UP to Level 1 (Providers)
        print("[STEP 8] Pressing Escape (Back up to Level 1: Providers)...")
        press_key(VK_ESCAPE, delay=1.0)

        img_back_lvl1 = ImageGrab.grab()
        path_back_lvl1 = "extracted_frames/test_results/ondemand/5_back_level_providers.png"
        img_back_lvl1.save(path_back_lvl1)
        print(f"Captured Back to Level 1: {path_back_lvl1}")

        print("=== ON DEMAND AUTOMATION SUITE COMPLETED SUCCESSFULLY ===")

    finally:
        print("Stopping rradio.exe...")
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
