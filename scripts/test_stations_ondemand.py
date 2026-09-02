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
    print("=== TESTING STATIONS VICE CITY ON DEMAND DRILL-DOWN ===")
    os.makedirs("extracted_frames/test_results/stations_ondemand", exist_ok=True)

    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.5)

    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    proc = subprocess.Popen([exe_path])
    time.sleep(2.5)

    try:
        # Step 1: Open Overlay (F8)
        print("[STEP 1] Pressing F8...")
        press_key(VK_F8, delay=0.8)

        # Step 2: Switch to ON DEMAND (F7) -> starts on STATIONS VICE CITY
        print("[STEP 2] Pressing F7...")
        press_key(VK_F7, delay=1.0)

        # Step 3: Enter directly into STATIONS VICE CITY
        print("[STEP 3] Pressing Enter on STATIONS VICE CITY...")
        press_key(VK_RETURN, delay=1.0)

        img_stations_l2 = ImageGrab.grab()
        path_l2 = "extracted_frames/test_results/stations_ondemand/1_station_logos_level2.png"
        img_stations_l2.save(path_l2)
        print(f"Captured Station Logos Level 2: {path_l2}")

        # Step 4: Slide to Wave 103 (D)
        print("[STEP 4] Continuous slide to Wave 103 (D)...")
        press_key(VK_D, delay=0.8)

        img_wave_l2 = ImageGrab.grab()
        path_wave = "extracted_frames/test_results/stations_ondemand/2_wave103_level2.png"
        img_wave_l2.save(path_wave)
        print(f"Captured Wave 103 Level 2: {path_wave}")

        # Step 5: Enter into Wave 103 -> Level 3: All Wave 103 tracks!
        print("[STEP 5] Pressing Enter on Wave 103...")
        press_key(VK_RETURN, delay=1.0)

        img_wave_songs = ImageGrab.grab()
        path_songs = "extracted_frames/test_results/stations_ondemand/3_wave103_all_songs_level3.png"
        img_wave_songs.save(path_songs)
        print(f"Captured Wave 103 Songs: {path_songs}")

        # Step 6: Step through songs (D)
        print("[STEP 6] Stepping to second song in Wave 103 (D)...")
        press_key(VK_D, delay=0.8)

        img_wave_song2 = ImageGrab.grab()
        path_song2 = "extracted_frames/test_results/stations_ondemand/4_wave103_second_song_level3.png"
        img_wave_song2.save(path_song2)
        print(f"Captured Wave 103 Second Song: {path_song2}")

        print("=== STATIONS VICE CITY TESTS COMPLETED SUCCESSFULLY ===")

    finally:
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
