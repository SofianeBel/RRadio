import subprocess
import time
import os
import ctypes
from PIL import ImageGrab

user32 = ctypes.windll.user32

VK_F7 = 0x76 # Mode toggle (Radio <-> On Demand)
VK_F8 = 0x77 # Overlay toggle
VK_RETURN = 0x0D
VK_D = 0x44
VK_A = 0x41

KEYEVENTF_KEYUP = 0x0002

def press_key(vk, delay=0.7):
    scan = user32.MapVirtualKeyW(vk, 0)
    user32.keybd_event(vk, scan, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(vk, scan, KEYEVENTF_KEYUP, 0)
    time.sleep(delay)

def main():
    print("=== TESTING YOUTUBE MUSIC HUD & PLAYLISTS ===")
    os.makedirs("extracted_frames/test_results/ytm_hud", exist_ok=True)

    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.8)

    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    proc = subprocess.Popen([exe_path])
    time.sleep(3.0)

    try:
        # Step 1: Open Overlay (F8)
        print("[STEP 1] Pressing F8 (Toggle Overlay)...")
        press_key(VK_F8, delay=1.0)

        # Step 2: Switch to ON DEMAND Mode (F7)
        print("[STEP 2] Pressing F7 (On Demand Mode)...")
        press_key(VK_F7, delay=1.2)

        # Step 3: Slide to SPOTIFY (D)
        print("[STEP 3] Sliding to SPOTIFY (D)...")
        press_key(VK_D, delay=0.8)

        # Step 4: Slide to YOUTUBE MUSIC (D)
        print("[STEP 4] Sliding to YOUTUBE MUSIC (D)...")
        press_key(VK_D, delay=1.0)

        img_ytm_provider = ImageGrab.grab()
        path_ytm_p = "extracted_frames/test_results/ytm_hud/1_ytm_provider_focused.png"
        img_ytm_provider.save(path_ytm_p)
        print(f"Captured YTM Provider: {path_ytm_p}")

        # Step 5: Enter YOUTUBE MUSIC (Enter -> Level 2 Playlists)
        print("[STEP 5] Entering YOUTUBE MUSIC (Enter)...")
        press_key(VK_RETURN, delay=1.2)

        img_ytm_playlists = ImageGrab.grab()
        path_ytm_pl = "extracted_frames/test_results/ytm_hud/2_ytm_playlists_level2.png"
        img_ytm_playlists.save(path_ytm_pl)
        print(f"Captured YTM Level 2: {path_ytm_pl}")

        # Step 6: Enter Supermix (Enter -> Level 3 Queue)
        print("[STEP 6] Entering Mon Supermix Années 80 (Enter)...")
        press_key(VK_RETURN, delay=1.2)

        img_ytm_queue = ImageGrab.grab()
        path_ytm_q = "extracted_frames/test_results/ytm_hud/3_ytm_queue_level3.png"
        img_ytm_queue.save(path_ytm_q)
        print(f"Captured YTM Level 3 Queue: {path_ytm_q}")

        # Step 7: Step to next song in Supermix (D)
        print("[STEP 7] Stepping to next song in Supermix (D)...")
        press_key(VK_D, delay=0.9)

        img_ytm_song2 = ImageGrab.grab()
        path_ytm_s2 = "extracted_frames/test_results/ytm_hud/4_ytm_second_song_level3.png"
        img_ytm_song2.save(path_ytm_s2)
        print(f"Captured YTM Second Song: {path_ytm_s2}")

        print("=== YTM HUD TEST COMPLETED SUCCESSFULLY ===")

    finally:
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
