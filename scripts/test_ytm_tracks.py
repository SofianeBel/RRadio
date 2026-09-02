import subprocess
import time
import os
import ctypes
from PIL import ImageGrab

user32 = ctypes.windll.user32
VK_F8 = 0x77
VK_F9 = 0x78
VK_RETURN = 0x0D

def press(vk, delay=0.8):
    scan = user32.MapVirtualKeyW(vk, 0)
    user32.keybd_event(vk, scan, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(vk, scan, 2, 0)
    time.sleep(delay)

def click(x, y, delay=0.8):
    user32.SetCursorPos(x, y)
    time.sleep(0.1)
    user32.mouse_event(2, 0, 0, 0, 0)
    time.sleep(0.05)
    user32.mouse_event(4, 0, 0, 0, 0)
    time.sleep(delay)

def main():
    print("=== TESTING YOUTUBE MUSIC PLAYLISTS & TRACKS ===")
    os.makedirs("extracted_frames/test_results/ytm_tracks", exist_ok=True)

    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.5)

    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    proc = subprocess.Popen([exe_path])
    time.sleep(2.5)

    try:
        # 1. Open HUD
        print("[1] Opening HUD (F8)...")
        press(VK_F8, delay=1.0)

        # 2. Switch to On Demand mode by clicking the toggle at (668, 52)
        print("[2] Switching to On Demand mode (clicking toggle)...")
        click(668, 52, delay=1.2)
        # 3. Click YT MUSIC card directly at (1241, 41)
        print("[3] Clicking YT MUSIC provider at (1241, 41)...")
        click(1241, 41, delay=1.2)

        im1 = ImageGrab.grab()
        cx = im1.width // 2
        crop1 = im1.crop((cx - 560, 0, cx + 560, 360))
        crop1.save("extracted_frames/test_results/ytm_tracks/1_ytm_provider_level1.png")
        print("Captured 1_ytm_provider_level1.png")

        # 4. Enter Level 2: Playlists (Press Enter)
        print("[4] Entering Level 2: Playlists (Enter)...")
        press(VK_RETURN, delay=1.5)

        im2 = ImageGrab.grab()
        crop2 = im2.crop((cx - 560, 0, cx + 560, 360))
        crop2.save("extracted_frames/test_results/ytm_tracks/2_ytm_playlists_level2.png")
        print("Captured 2_ytm_playlists_level2.png")

        # 5. Enter Level 3: Tracks / Queue (Press Enter)
        print("[5] Entering Level 3: Tracks / Queue (Enter)...")
        press(VK_RETURN, delay=1.8)

        im3 = ImageGrab.grab()
        crop3 = im3.crop((cx - 560, 0, cx + 560, 360))
        crop3.save("extracted_frames/test_results/ytm_tracks/3_ytm_tracks_level3.png")
        print("Captured 3_ytm_tracks_level3.png")

        print("=== TEST COMPLETED SUCCESSFULLY ===")

    finally:
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
