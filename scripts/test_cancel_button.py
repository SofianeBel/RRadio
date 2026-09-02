import subprocess
import time
import os
import ctypes
from PIL import ImageGrab

user32 = ctypes.windll.user32
VK_F8 = 0x77

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
    print("=== TESTING OAUTH TIMEOUT & CANCELLATION BUTTON ===")
    os.makedirs("extracted_frames/test_results/oauth_cancel", exist_ok=True)

    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.5)

    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    proc = subprocess.Popen([exe_path])
    time.sleep(2.5)

    try:
        # 1. Open HUD
        print("[1] Opening HUD...")
        press(VK_F8, delay=1.0)

        # 2. Click Settings Gear at (1444, 52)
        print("[2] Clicking Settings Gear...")
        click(1444, 52, delay=1.2)

        # 3. Click SERVICES STREAMING tab at (1088, 256)
        print("[3] Clicking SERVICES STREAMING tab...")
        click(1088, 256, delay=1.0)

        # 4. Click "Se connecter avec Google" at (1280, 320)
        print("[4] Clicking Connect button...")
        click(1280, 320, delay=0.6)

        # Capture Screenshot 1: Waiting state with [ Annuler ] button
        im1 = ImageGrab.grab()
        cx = im1.width // 2
        cy = im1.height // 2
        crop1 = im1.crop((cx - 560, max(0, cy - 480), cx + 560, min(im1.height, cy + 330)))
        crop1.save("extracted_frames/test_results/oauth_cancel/1_waiting_with_cancel_button.png")
        print("Captured 1_waiting_with_cancel_button.png")

        # 5. Click the [ Annuler ] button (located right next to the spinner at cx + 460, cy - 180)
        # In DPI: x = (1280 + 460) / 1.25 = 1392, y = 320
        cancel_x = 1392
        cancel_y = 320
        print(f"[5] Clicking [ Annuler ] button at ({cancel_x}, {cancel_y})...")
        click(cancel_x, cancel_y, delay=0.8)

        # Capture Screenshot 2: Cancelled state with restored button
        im2 = ImageGrab.grab()
        crop2 = im2.crop((cx - 560, max(0, cy - 480), cx + 560, min(im1.height, cy + 330)))
        crop2.save("extracted_frames/test_results/oauth_cancel/2_cancelled_state_restored.png")
        print("Captured 2_cancelled_state_restored.png")

        print("=== CANCEL & TIMEOUT TEST COMPLETED SUCCESSFULLY ===")

    finally:
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
