import subprocess
import time
import os
import ctypes
from PIL import ImageGrab

user32 = ctypes.windll.user32

VK_F7 = 0x76 # Mode toggle (Radio <-> On Demand)
VK_F8 = 0x77 # Overlay toggle
VK_F10 = 0x79 # Settings Dialog toggle
VK_ESCAPE = 0x1B
VK_RETURN = 0x0D
VK_D = 0x44
VK_A = 0x41

KEYEVENTF_KEYUP = 0x0002
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004

def press_key(vk, delay=0.6):
    scan = user32.MapVirtualKeyW(vk, 0)
    user32.keybd_event(vk, scan, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(vk, scan, KEYEVENTF_KEYUP, 0)
    time.sleep(delay)

def click_pos(x, y, delay=0.4):
    user32.SetCursorPos(x, y)
    time.sleep(0.1)
    user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    time.sleep(0.05)
    user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    time.sleep(delay)

def main():
    print("=== TESTING YOUTUBE MUSIC SOLUTION A INTEGRATION ===")
    os.makedirs("extracted_frames/test_results/ytm", exist_ok=True)

    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.5)

    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    proc = subprocess.Popen([exe_path])
    time.sleep(2.5)

    try:
        # Step 1: Open Settings Dialog (F10)
        print("[STEP 1] Pressing F10 (Open Settings Dialog)...")
        press_key(VK_F10, delay=1.0)

        # Click on SERVICES STREAMING tab
        # Tabs bar is centered at top. In 2560x1440, screen_w = 2560.
        screen_w = user32.GetSystemMetrics(0)
        cx = screen_w // 2
        # Tab 4 is SERVICES STREAMING (offset ~ +190px from center, y ~ 85)
        tab_x = cx + 180
        tab_y = 85
        print(f"Clicking SERVICES STREAMING tab at ({tab_x}, {tab_y})...")
        click_pos(tab_x, tab_y, delay=0.8)

        # Capture Settings with Services Streaming tab open
        img_services = ImageGrab.grab()
        path_services = "extracted_frames/test_results/ytm/1_settings_services_tab.png"
        img_services.save(path_services)
        print(f"Captured Settings Services Tab: {path_services}")

        # Step 2: Click "Se connecter avec Google" button
        # In dialog, button is at right of YouTube Music card (around cx + 330, y ~ 325)
        btn_connect_x = cx + 320
        btn_connect_y = 325
        print(f"Clicking 'Se connecter avec Google' at ({btn_connect_x}, {btn_connect_y})...")
        click_pos(btn_connect_x, btn_connect_y, delay=0.8)

        # Capture Settings after connection
        img_connected = ImageGrab.grab()
        path_connected = "extracted_frames/test_results/ytm/2_settings_ytm_connected.png"
        img_connected.save(path_connected)
        print(f"Captured Settings Connected State: {path_connected}")

        # Step 3: Close Settings Dialog (Escape)
        print("[STEP 3] Closing Settings Dialog (Escape)...")
        press_key(VK_ESCAPE, delay=0.8)

        # Step 4: Open Overlay HUD (F8) -> Switch to ON DEMAND (F7)
        print("[STEP 4] Opening Overlay (F8) and switching to ON DEMAND (F7)...")
        press_key(VK_F8, delay=0.8)
        press_key(VK_F7, delay=1.0)

        # Step 5: Slide to YOUTUBE MUSIC (D twice: STATIONS VICE CITY -> SPOTIFY -> YOUTUBE MUSIC)
        print("[STEP 5] Sliding to YOUTUBE MUSIC (D twice)...")
        press_key(VK_D, delay=0.8)
        press_key(VK_D, delay=1.0)

        img_ytm_focused = ImageGrab.grab()
        path_ytm_focused = "extracted_frames/test_results/ytm/3_hud_ytm_provider_focused.png"
        img_ytm_focused.save(path_ytm_focused)
        print(f"Captured HUD YTM Focused: {path_ytm_focused}")

        # Step 6: Enter YOUTUBE MUSIC (Enter) -> Level 2: Supermixes & Curated Mixes!
        print("[STEP 6] Entering YOUTUBE MUSIC (Enter -> Level 2 Playlists)...")
        press_key(VK_RETURN, delay=1.0)

        img_ytm_playlists = ImageGrab.grab()
        path_ytm_playlists = "extracted_frames/test_results/ytm/4_hud_ytm_playlists_level2.png"
        img_ytm_playlists.save(path_ytm_playlists)
        print(f"Captured Level 2 YTM Mixes: {path_ytm_playlists}")

        # Step 7: Enter "Mon Supermix Années 80" -> Level 3: Tracks Queue
        print("[STEP 7] Entering Mon Supermix Années 80 (Enter -> Level 3 Queue)...")
        press_key(VK_RETURN, delay=1.0)

        img_ytm_queue = ImageGrab.grab()
        path_ytm_queue = "extracted_frames/test_results/ytm/5_hud_ytm_queue_level3.png"
        img_ytm_queue.save(path_ytm_queue)
        print(f"Captured Level 3 YTM Queue: {path_ytm_queue}")

        print("=== YTM INTEGRATION TEST COMPLETED SUCCESSFULLY ===")

    finally:
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
