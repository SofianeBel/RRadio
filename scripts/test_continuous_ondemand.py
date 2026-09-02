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

def press_key(vk, delay=0.6):
    scan = user32.MapVirtualKeyW(vk, 0)
    user32.keybd_event(vk, scan, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(vk, scan, KEYEVENTF_KEYUP, 0)
    time.sleep(delay)

def main():
    print("=== STARTING CONTINUOUS ON DEMAND & STATIONS TEST ===")
    os.makedirs("extracted_frames/test_results/continuous", exist_ok=True)

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

        # Capture Level 1: Providers (STATIONS VICE CITY is center)
        img_lvl1 = ImageGrab.grab()
        path_lvl1 = "extracted_frames/test_results/continuous/1_level1_stations_vice_city.png"
        img_lvl1.save(path_lvl1)
        print(f"Captured Level 1 (STATIONS VICE CITY): {path_lvl1}")

        # Step 3: Browse smoothly to Spotify (D)
        print("[STEP 3] Continuous slide to Spotify (D)...")
        press_key(VK_D, delay=0.9)

        img_spotify = ImageGrab.grab()
        path_spotify = "extracted_frames/test_results/continuous/2_level1_spotify_slide.png"
        img_spotify.save(path_spotify)
        print(f"Captured Level 1 (Spotify Slide): {path_spotify}")

        # Step 4: Slide back to STATIONS VICE CITY (A)
        print("[STEP 4] Continuous slide back to STATIONS VICE CITY (A)...")
        press_key(VK_A, delay=0.9)

        # Step 5: Press Enter on STATIONS VICE CITY -> Elevator UP to Level 2 (Station Playlists)
        print("[STEP 5] Pressing Enter on STATIONS VICE CITY (Elevator UP to Level 2)...")
        press_key(VK_RETURN, delay=1.0)

        img_lvl2 = ImageGrab.grab()
        path_lvl2 = "extracted_frames/test_results/continuous/3_level2_station_playlists.png"
        img_lvl2.save(path_lvl2)
        print(f"Captured Level 2 (Station Playlists): {path_lvl2}")

        # Step 6: Slide continuously through Station Playlists (D to Wave 103, D to V-Rock)
        print("[STEP 6] Continuous slide to Wave 103 (D)...")
        press_key(VK_D, delay=0.8)
        print("Continuous slide to V-Rock (D)...")
        press_key(VK_D, delay=0.9)

        img_vrock_pl = ImageGrab.grab()
        path_vrock_pl = "extracted_frames/test_results/continuous/4_level2_vrock_focused.png"
        img_vrock_pl.save(path_vrock_pl)
        print(f"Captured Level 2 (V-Rock Focused): {path_vrock_pl}")

        # Step 7: Press Enter on V-Rock -> Elevator UP to Level 3 (V-Rock Tracks Queue)
        print("[STEP 7] Pressing Enter on V-Rock (Elevator UP to Level 3: Queue)...")
        press_key(VK_RETURN, delay=1.0)

        img_lvl3 = ImageGrab.grab()
        path_lvl3 = "extracted_frames/test_results/continuous/5_level3_vrock_tracks_queue.png"
        img_lvl3.save(path_lvl3)
        print(f"Captured Level 3 (V-Rock Tracks Queue): {path_lvl3}")

        # Step 8: Continuous slide to next song in queue (D)
        print("[STEP 8] Continuous slide to next track in queue (D)...")
        press_key(VK_D, delay=0.9)

        img_lvl3_next = ImageGrab.grab()
        path_lvl3_next = "extracted_frames/test_results/continuous/6_level3_vrock_second_track.png"
        img_lvl3_next.save(path_lvl3_next)
        print(f"Captured Level 3 (Second Track): {path_lvl3_next}")

        # Step 9: Press Escape -> Elevator DOWN to Level 2 (Playlists)
        print("[STEP 9] Pressing Escape (Elevator DOWN to Level 2)...")
        press_key(VK_ESCAPE, delay=1.0)

        img_back_lvl2 = ImageGrab.grab()
        path_back_lvl2 = "extracted_frames/test_results/continuous/7_back_to_station_playlists.png"
        img_back_lvl2.save(path_back_lvl2)
        print(f"Captured Back to Level 2: {path_back_lvl2}")

        # Step 10: Press Escape -> Elevator DOWN to Level 1 (Providers)
        print("[STEP 10] Pressing Escape (Elevator DOWN to Level 1)...")
        press_key(VK_ESCAPE, delay=1.0)

        img_back_lvl1 = ImageGrab.grab()
        path_back_lvl1 = "extracted_frames/test_results/continuous/8_back_to_providers.png"
        img_back_lvl1.save(path_back_lvl1)
        print(f"Captured Back to Level 1: {path_back_lvl1}")

        print("=== CONTINUOUS ON DEMAND SUITE COMPLETED SUCCESSFULLY ===")

    finally:
        print("Stopping rradio.exe...")
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
