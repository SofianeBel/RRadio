import subprocess
import time
import os
import ctypes
from PIL import ImageGrab

user32 = ctypes.windll.user32

VK_F7 = 0x76 # Mode toggle (Radio <-> On Demand)
VK_F8 = 0x77 # Overlay toggle
VK_F10 = 0x79 # Settings Dialog
VK_RETURN = 0x0D
VK_D = 0x44
VK_A = 0x41
VK_ESCAPE = 0x1B

KEYEVENTF_KEYUP = 0x0002
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004

def press(vk, delay=0.7):
    scan = user32.MapVirtualKeyW(vk, 0)
    user32.keybd_event(vk, scan, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(vk, scan, KEYEVENTF_KEYUP, 0)
    time.sleep(delay)

def click(x, y, delay=0.4):
    user32.SetCursorPos(x, y)
    time.sleep(0.1)
    user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    time.sleep(0.05)
    user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    time.sleep(delay)

def main():
    print("=== TESTING YOUTUBE MUSIC INTEGRATION & SETTINGS ===")
    os.makedirs("extracted_frames/test_results/ytm_final", exist_ok=True)

    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.5)

    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    proc = subprocess.Popen([exe_path])
    time.sleep(2.5)

    try:
        # Part 1: HUD Navigation into YouTube Music
        print("[1] Opening HUD (F8)...")
        press(VK_F8, delay=1.0)

        print("[2] Switching to ON DEMAND (F7)...")
        press(VK_F7, delay=1.0)

        print("[3] Sliding to Spotify (D)...")
        press(VK_D, delay=0.8)

        print("[4] Sliding to YouTube Music (D)...")
        press(VK_D, delay=1.0)

        im1 = ImageGrab.grab()
        im1.save("extracted_frames/test_results/ytm_final/1_ytm_provider_centered.png")
        print("Captured 1_ytm_provider_centered.png")

        print("[5] Entering YouTube Music (Enter -> Level 2 Playlists)...")
        press(VK_RETURN, delay=1.2)

        im2 = ImageGrab.grab()
        im2.save("extracted_frames/test_results/ytm_final/2_ytm_playlists_level2.png")
        print("Captured 2_ytm_playlists_level2.png")

        print("[6] Entering Mon Supermix Années 80 (Enter -> Level 3 Queue)...")
        press(VK_RETURN, delay=1.2)

        im3 = ImageGrab.grab()
        im3.save("extracted_frames/test_results/ytm_final/3_ytm_supermix_queue_level3.png")
        print("Captured 3_ytm_supermix_queue_level3.png")

        print("[7] Stepping to second track (D)...")
        press(VK_D, delay=1.0)

        im4 = ImageGrab.grab()
        im4.save("extracted_frames/test_results/ytm_final/4_ytm_second_track.png")
        print("Captured 4_ytm_second_track.png")

        # Part 2: Open Settings & Services Tab
        print("[8] Opening Settings (F10)...")
        press(VK_F10, delay=1.2)

        screen_w = user32.GetSystemMetrics(0)
        cx = screen_w // 2

        # Click SERVICES STREAMING tab (around cx + 180, y ~ 85)
        print(f"Clicking SERVICES STREAMING tab at ({cx + 180}, 85)...")
        click(cx + 180, 85, delay=0.8)

        im5 = ImageGrab.grab()
        im5.save("extracted_frames/test_results/ytm_final/5_settings_services_tab.png")
        print("Captured 5_settings_services_tab.png")

        print("=== ALL YTM TESTS COMPLETED SUCCESSFULLY ===")

    finally:
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
