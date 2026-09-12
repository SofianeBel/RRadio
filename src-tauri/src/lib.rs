use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize, WebviewWindow};
pub mod oauth;
pub mod discord;
pub mod news;
mod news_window;

static IS_OVERLAY_OPEN: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Copy, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct HitRegion {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    shape: Option<HitRegionShape>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
enum HitRegionShape {
    Rect,
    Ellipse,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct NativeHitRect {
    left: i32,
    top: i32,
    right: i32,
    bottom: i32,
    shape: HitRegionShape,
}

fn ribbon_height_for_scale(scale_factor: f64) -> u32 {
    let safe_scale = if scale_factor.is_finite() && scale_factor > 0.0 {
        scale_factor
    } else {
        1.0
    };
    (340.0 * safe_scale)
        .round()
        .clamp(1.0, u32::MAX as f64) as u32
}

fn normalize_hit_regions(regions: &[HitRegion]) -> Result<Vec<NativeHitRect>, String> {
    const MAX_REGIONS: usize = 512;
    const MAX_COORDINATE: f64 = i32::MAX as f64;

    if regions.len() > MAX_REGIONS {
        return Err(format!("Too many hit regions: {}", regions.len()));
    }

    let mut normalized = Vec::with_capacity(regions.len());
    for (index, region) in regions.iter().enumerate() {
        if !region.x.is_finite()
            || !region.y.is_finite()
            || !region.width.is_finite()
            || !region.height.is_finite()
        {
            return Err(format!("Hit region {} contains a non-finite value", index));
        }
        if region.width <= 0.0 || region.height <= 0.0 {
            continue;
        }

        let raw_right = region.x + region.width;
        let raw_bottom = region.y + region.height;
        if !raw_right.is_finite() || !raw_bottom.is_finite() {
            return Err(format!("Hit region {} exceeds coordinate limits", index));
        }

        let left = region.x.floor().clamp(0.0, MAX_COORDINATE) as i32;
        let top = region.y.floor().clamp(0.0, MAX_COORDINATE) as i32;
        let right = raw_right.ceil().clamp(0.0, MAX_COORDINATE) as i32;
        let bottom = raw_bottom.ceil().clamp(0.0, MAX_COORDINATE) as i32;

        if right > left && bottom > top {
            normalized.push(NativeHitRect {
                left,
                top,
                right,
                bottom,
                shape: region.shape.unwrap_or(HitRegionShape::Rect),
            });
        }
    }

    Ok(normalized)
}

#[cfg(test)]
mod tests {
    use super::{
        normalize_hit_regions, ribbon_height_for_scale, HitRegion, HitRegionShape, NativeHitRect,
    };

    #[test]
    fn normalizes_physical_regions_and_skips_empty_rectangles() {
        let regions = normalize_hit_regions(&[
            HitRegion {
                x: 10.2,
                y: 20.8,
                width: 30.1,
                height: 40.1,
                shape: None,
            },
            HitRegion {
                x: 0.0,
                y: 0.0,
                width: 0.0,
                height: 12.0,
                shape: None,
            },
        ])
        .expect("finite rectangles should normalize");

        assert_eq!(
            regions,
            vec![NativeHitRect {
                left: 10,
                top: 20,
                right: 41,
                bottom: 61,
                shape: HitRegionShape::Rect,
            }]
        );
    }

    #[test]
    fn scales_ribbon_height_to_physical_pixels() {
        assert_eq!(ribbon_height_for_scale(1.25), 425);
        assert_eq!(ribbon_height_for_scale(f64::NAN), 340);
    }
}

#[cfg(target_os = "windows")]
fn apply_window_hit_regions(hwnd_raw: isize, regions: &[NativeHitRect]) -> Result<(), String> {
    use windows::Win32::Foundation::{BOOL, HWND};
    use windows::Win32::Graphics::Gdi::{
        CombineRgn, CreateEllipticRgn, CreateRectRgn, DeleteObject, SetWindowRgn, RGN_OR,
    };

    let hwnd = HWND(hwnd_raw as *mut _);
    // SAFETY: the HWND comes from the live Tauri window, and every GDI handle
    // is checked and released on failure before SetWindowRgn transfers ownership.
    unsafe {
        // A zero-sized region is intentionally used for an empty list. Passing
        // NULL to SetWindowRgn would restore the full window and intercept clicks.
        let combined = CreateRectRgn(0, 0, 0, 0);
        if combined.0.is_null() {
            return Err("CreateRectRgn failed for the hit region".to_string());
        }

        for rect in regions {
            let piece = match rect.shape {
                HitRegionShape::Rect => CreateRectRgn(rect.left, rect.top, rect.right, rect.bottom),
                HitRegionShape::Ellipse => {
                    CreateEllipticRgn(rect.left, rect.top, rect.right, rect.bottom)
                }
            };
            if piece.0.is_null() {
                let _ = DeleteObject(combined);
                return Err("CreateRectRgn failed for a hit region".to_string());
            }

            let combine_result = CombineRgn(combined, combined, piece, RGN_OR);
            let _ = DeleteObject(piece);
            if combine_result.0 == 0 {
                let _ = DeleteObject(combined);
                return Err("CombineRgn failed for the hit region".to_string());
            }
        }

        if SetWindowRgn(hwnd, combined, BOOL(1)) == 0 {
            let _ = DeleteObject(combined);
            return Err("SetWindowRgn failed".to_string());
        }
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn apply_window_hit_regions_on_owner_thread(
    window: &WebviewWindow,
    hwnd_raw: isize,
    regions: &[NativeHitRect],
) -> Result<(), String> {
    use std::sync::mpsc::sync_channel;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::Threading::GetCurrentThreadId;
    use windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId;

    let hwnd = HWND(hwnd_raw as *mut _);
    let owner_thread = unsafe { GetWindowThreadProcessId(hwnd, None) };
    let current_thread = unsafe { GetCurrentThreadId() };
    if owner_thread == current_thread {
        return apply_window_hit_regions(hwnd_raw, regions);
    }

    let regions = regions.to_vec();
    let (sender, receiver) = sync_channel(1);
    window
        .run_on_main_thread(move || {
            let _ = sender.send(apply_window_hit_regions(hwnd_raw, &regions));
        })
        .map_err(|error| format!("Could not schedule hit region update: {}", error))?;

    receiver
        .recv_timeout(std::time::Duration::from_secs(2))
        .map_err(|error| format!("Timed out waiting for hit region update: {}", error))?
}

#[cfg(not(target_os = "windows"))]
fn apply_window_hit_regions(_hwnd_raw: isize, _regions: &[NativeHitRect]) -> Result<(), String> {
    Ok(())
}

#[cfg(target_os = "windows")]
fn clear_window_hit_regions(window: &WebviewWindow) -> Result<(), String> {
    let hwnd = window.hwnd().map_err(|error| error.to_string())?;
    apply_window_hit_regions_on_owner_thread(window, hwnd.0 as isize, &[])
}

#[cfg(not(target_os = "windows"))]
fn clear_window_hit_regions(_window: &WebviewWindow) -> Result<(), String> {
    Ok(())
}

fn configure_pure_overlay_window(hwnd_raw: isize, enable_click_through: bool) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::Graphics::Dwm::DwmExtendFrameIntoClientArea;
    use windows::Win32::UI::Controls::MARGINS;
    use windows::Win32::UI::WindowsAndMessaging::{
        GetWindowLongW, SetWindowLongW, SetWindowPos,
        GWL_EXSTYLE, GWL_STYLE,
        HWND_TOPMOST, SWP_FRAMECHANGED, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE,
        WS_BORDER, WS_CAPTION, WS_EX_LAYERED, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW, WS_EX_TOPMOST, WS_EX_TRANSPARENT,
        WS_POPUP, WS_THICKFRAME,
    };

    let hwnd = HWND(hwnd_raw as *mut _);
    unsafe {
        let style = GetWindowLongW(hwnd, GWL_STYLE);
        let new_style = (style & !(WS_CAPTION.0 as i32 | WS_BORDER.0 as i32 | WS_THICKFRAME.0 as i32))
            | (WS_POPUP.0 as i32);
        SetWindowLongW(hwnd, GWL_STYLE, new_style);

        let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
        let mut new_ex_style = ex_style
            | (WS_EX_TOOLWINDOW.0 as i32)
            | (WS_EX_TOPMOST.0 as i32)
            | (WS_EX_LAYERED.0 as i32)
            | (WS_EX_NOACTIVATE.0 as i32);

        if enable_click_through {
            new_ex_style |= WS_EX_TRANSPARENT.0 as i32;
        } else {
            new_ex_style &= !(WS_EX_TRANSPARENT.0 as i32);
        }

        SetWindowLongW(hwnd, GWL_EXSTYLE, new_ex_style);

        let margins = MARGINS {
            cxLeftWidth: -1,
            cxRightWidth: -1,
            cyTopHeight: -1,
            cyBottomHeight: -1,
        };
        let _ = DwmExtendFrameIntoClientArea(hwnd, &margins);

        let _ = SetWindowPos(
            hwnd,
            HWND_TOPMOST,
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_FRAMECHANGED | SWP_NOACTIVATE,
        );
    }
}

#[tauri::command]
fn set_window_visibility(window: WebviewWindow, visible: bool) -> Result<(), String> {
    eprintln!("RUST: set_window_visibility visible={}", visible);
    if visible {
        clear_window_hit_regions(&window)?;
        let _ = window.show();
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_SHOWNOACTIVATE};
            if let Ok(hwnd_raw) = window.hwnd() {
                let hwnd = HWND(hwnd_raw.0 as *mut _);
                unsafe {
                    let _ = ShowWindow(hwnd, SW_SHOWNOACTIVATE);
                }
                configure_pure_overlay_window(hwnd_raw.0 as isize, false);
            }
        }
    } else {
        let _ = window.hide();
    }
    IS_OVERLAY_OPEN.store(visible, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
fn set_click_through(window: WebviewWindow, enable: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(enable)
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{GetWindowLongW, SetWindowLongW, GWL_EXSTYLE, WS_EX_TRANSPARENT};
        if let Ok(hwnd_raw) = window.hwnd() {
            let hwnd = HWND(hwnd_raw.0 as *mut _);
            unsafe {
                let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
                let new_ex = if enable {
                    ex_style | (WS_EX_TRANSPARENT.0 as i32)
                } else {
                    ex_style & !(WS_EX_TRANSPARENT.0 as i32)
                };
                SetWindowLongW(hwnd, GWL_EXSTYLE, new_ex);
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn set_window_hit_regions(window: WebviewWindow, regions: Vec<HitRegion>) -> Result<(), String> {
    let normalized = normalize_hit_regions(&regions)?;
    let hwnd = window
        .hwnd()
        .map_err(|error| format!("Could not get overlay window handle: {}", error))?;
    apply_window_hit_regions_on_owner_thread(&window, hwnd.0 as isize, &normalized)
}

#[tauri::command]
fn set_settings_window_mode(window: WebviewWindow, is_settings_open: bool, is_radio_open: bool, is_circular: bool) -> Result<(), String> {
    eprintln!("RUST: set_settings_window_mode is_settings={} is_radio={} is_circular={}", is_settings_open, is_radio_open, is_circular);
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let screen_size = monitor.size();
        if is_settings_open {
            clear_window_hit_regions(&window)?;
            let _ = window.set_size(PhysicalSize::new(screen_size.width, screen_size.height));
            let _ = window.set_position(PhysicalPosition::new(0, 0));
            let _ = window.show();
            let _ = window.set_ignore_cursor_events(false);
            #[cfg(target_os = "windows")]
            if let Ok(hwnd_raw) = window.hwnd() {
                configure_pure_overlay_window(hwnd_raw.0 as isize, false);
                use windows::Win32::Foundation::HWND;
                use windows::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_SHOWNOACTIVATE};
                unsafe { let _ = ShowWindow(HWND(hwnd_raw.0 as *mut _), SW_SHOWNOACTIVATE); }
            }
        } else if is_radio_open {
            clear_window_hit_regions(&window)?;
            let height = if is_circular {
                screen_size.height
            } else {
                ribbon_height_for_scale(window.scale_factor().unwrap_or(1.0))
            };
            let _ = window.set_size(PhysicalSize::new(screen_size.width, height));
            let _ = window.set_position(PhysicalPosition::new(0, 0));
            let _ = window.show();
            let _ = window.set_ignore_cursor_events(false);
            #[cfg(target_os = "windows")]
            if let Ok(hwnd_raw) = window.hwnd() {
                configure_pure_overlay_window(hwnd_raw.0 as isize, false);
                use windows::Win32::Foundation::HWND;
                use windows::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_SHOWNOACTIVATE};
                unsafe { let _ = ShowWindow(HWND(hwnd_raw.0 as *mut _), SW_SHOWNOACTIVATE); }
            }
        } else {
            let _ = window.hide();
            let _ = window.set_ignore_cursor_events(true);
        }
    }

    Ok(())
}

#[tauri::command]
fn start_google_oauth(
    app_handle: tauri::AppHandle,
    client_id: String,
    client_secret: Option<String>,
) -> Result<(), String> {
    oauth::start_oauth_flow(app_handle, client_id, client_secret)
}

#[tauri::command]
fn cancel_google_oauth(app_handle: tauri::AppHandle) -> Result<(), String> {
    oauth::cancel_oauth_flow(app_handle);
    Ok(())
}

#[tauri::command]
fn set_language(_app_handle: tauri::AppHandle, _language: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
fn restore_window_focus(app_handle: tauri::AppHandle) -> Result<(), String> {
    oauth::restore_window_after_oauth(&app_handle);
    Ok(())
}


pub fn run() {
    tauri::Builder::default()
        .manage(news_window::NewsAlert::default())
        .setup(|app| {
            // Initial window setup (starts hidden by default)
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let screen_size = monitor.size();
                    let scale_factor = window.scale_factor().unwrap_or(1.0);
                    let _ = window.set_size(PhysicalSize::new(
                        screen_size.width,
                        ribbon_height_for_scale(scale_factor),
                    ));
                    let _ = window.set_position(PhysicalPosition::new(0, 0));
                }

                let _ = window.set_ignore_cursor_events(true);
                let _ = window.hide();

                #[cfg(target_os = "windows")]
                {
                    if let Ok(hwnd_raw) = window.hwnd() {
                        clear_window_hit_regions(&window).map_err(std::io::Error::other)?;
                        configure_pure_overlay_window(hwnd_raw.0 as isize, true);
                    }
                }
            }

            // System Tray Icon with Menu
            let toggle_item = MenuItem::with_id(app, "toggle", "Afficher / Masquer (F8 / Alt+V)", true, None::<&str>)?;
            let mute_item = MenuItem::with_id(app, "mute", "Couper / Activer le son (F9 / Alt+M)", true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app, "settings", "Paramètres (Settings / F10)", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quitter GTA 6 Radio", true, None::<&str>)?;

            let tray_menu = Menu::with_items(app, &[&toggle_item, &mute_item, &settings_item, &quit_item])?;

            let tray_builder = if let Some(icon) = app.default_window_icon() {
                TrayIconBuilder::new().icon(icon.clone())
            } else {
                TrayIconBuilder::new()
            };

            let _tray = tray_builder
                .menu(&tray_menu)
                .tooltip("GTA 6 Radio Overlay (Vice City)")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "settings" => {
                            let _ = app.emit("global_open_settings", ());
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        "toggle" => {
                            let _ = app.emit("global_overlay_toggle", ());
                        }
                        "mute" => {
                            let _ = app.emit("global_mute_toggle", ());
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        let _ = app.emit("global_overlay_toggle", ());
                    }
                })
                .build(app)?;

            // Native Windows RegisterHotKey Thread
            #[cfg(target_os = "windows")]
            {
                let hotkey_handle = app.handle().clone();
                std::thread::spawn(move || {
                    use windows::Win32::Foundation::HWND;
                    use windows::Win32::UI::Input::KeyboardAndMouse::{
                        RegisterHotKey, MOD_NOREPEAT,
                        VK_F5, VK_F6, VK_F7, VK_F8, VK_F9, VK_F10,
                    };
                    use windows::Win32::UI::WindowsAndMessaging::{GetMessageW, ShowWindow, MSG, SW_SHOWNOACTIVATE, WM_HOTKEY};

                    const HOTKEY_F8: i32 = 101;
                    const HOTKEY_F9: i32 = 102;
                    const HOTKEY_ALTV: i32 = 103;
                    const HOTKEY_ALTM: i32 = 104;
                    const HOTKEY_F10: i32 = 105;
                    const HOTKEY_F7: i32 = 106;
                    const HOTKEY_ALTO: i32 = 107;
                    const HOTKEY_F6: i32 = 108;
                    const HOTKEY_F5: i32 = 109;
                    unsafe {
                        let r_f8 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F8, MOD_NOREPEAT, VK_F8.0 as u32);
                        let r_f9 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F9, MOD_NOREPEAT, VK_F9.0 as u32);
                        let r_f10 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F10, MOD_NOREPEAT, VK_F10.0 as u32);
                        let r_f7 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F7, MOD_NOREPEAT, VK_F7.0 as u32);
                        let r_f6 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F6, MOD_NOREPEAT, VK_F6.0 as u32);
                        let r_f5 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F5, MOD_NOREPEAT, VK_F5.0 as u32);
                        eprintln!("HOTKEYS: F5={:?}", r_f5);
                        eprintln!("HOTKEYS: F8={:?}, F9={:?}, F10={:?}, F7={:?}, F6={:?}", r_f8, r_f9, r_f10, r_f7, r_f6);
                        let mut msg = MSG::default();
                        while GetMessageW(&mut msg, HWND(std::ptr::null_mut()), 0, 0).as_bool() {
                            if msg.message == WM_HOTKEY {
                                eprintln!("WM_HOTKEY received: {}", msg.wParam.0);
                                match msg.wParam.0 as i32 {
                                    HOTKEY_F8 | HOTKEY_ALTV => {
                                    if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                        let is_open = IS_OVERLAY_OPEN.load(Ordering::SeqCst);
                                        if is_open {
                                            IS_OVERLAY_OPEN.store(false, Ordering::SeqCst);
                                            let _ = main_win.hide();
                                            let _ = main_win.emit("global_overlay_hide", ());
                                        } else {
                                            IS_OVERLAY_OPEN.store(true, Ordering::SeqCst);
                                            if let Err(error) = clear_window_hit_regions(&main_win) {
                                                eprintln!("Could not clear overlay hit regions: {}", error);
                                                continue;
                                            }
                                            let _ = main_win.show();
                                            #[cfg(target_os = "windows")]
                                            if let Ok(hwnd_raw) = main_win.hwnd() {
                                                configure_pure_overlay_window(hwnd_raw.0 as isize, false);
                                                let _ = ShowWindow(HWND(hwnd_raw.0 as *mut _), SW_SHOWNOACTIVATE);
                                            }
                                            let _ = main_win.emit("global_overlay_show", ());
                                        }
                                    }
                                }
                                HOTKEY_F9 | HOTKEY_ALTM => {
                                        if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                            let _ = main_win.emit("global_mute_toggle", ());
                                        }
                                    }
                                    HOTKEY_F10 => {
                                        if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                            if let Err(error) = clear_window_hit_regions(&main_win) {
                                                eprintln!("Could not clear overlay hit regions: {}", error);
                                                continue;
                                            }
                                            let _ = main_win.show();
                                            #[cfg(target_os = "windows")]
                                            if let Ok(hwnd_raw) = main_win.hwnd() {
                                                configure_pure_overlay_window(hwnd_raw.0 as isize, false);
                                                let _ = ShowWindow(HWND(hwnd_raw.0 as *mut _), SW_SHOWNOACTIVATE);
                                            }
                                            let _ = main_win.emit("global_open_settings", ());
                                        }
                                    }
                                    HOTKEY_F7 | HOTKEY_ALTO => {
                                        if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                            let _ = main_win.emit("global_mode_toggle", ());
                                        }
                                    }
                                    HOTKEY_F5 => {
                                        if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                            let _ = main_win.emit("global_phone_toggle", ());
                                        }
                                    }
                                    HOTKEY_F6 => {
                                        if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                            let _ = main_win.emit("global_seek_end", ());
                                        }
                                    }
                                    _ => {}
                                }
                            }
                        }
                    }
                });
            }

            let hold_handle = app.handle().clone();
            std::thread::spawn(move || {
                let is_alt_down = Arc::new(AtomicBool::new(false));
                let is_q_active = Arc::new(AtomicBool::new(false));

        let callback = move |event: rdev::Event| {
                    match event.event_type {
                        rdev::EventType::KeyPress(key) => {
                            if IS_OVERLAY_OPEN.load(Ordering::SeqCst) {
                                match key {
                                    rdev::Key::KeyD | rdev::Key::RightArrow => {
                                        let _ = hold_handle.emit("global_nav_next", ());
                                    }
                                    rdev::Key::KeyA | rdev::Key::LeftArrow => {
                                        let _ = hold_handle.emit("global_nav_prev", ());
                                    }
                                    rdev::Key::Return => {
                                        let _ = hold_handle.emit("global_nav_confirm", ());
                                    }
                                    rdev::Key::Escape => {
                                        let _ = hold_handle.emit("global_nav_back", ());
                                    }
                                    rdev::Key::Unknown(code) => {
                                        if code == 32 {
                                            let _ = hold_handle.emit("global_nav_next", ());
                                        } else if code == 30 {
                                            let _ = hold_handle.emit("global_nav_prev", ());
                                        } else if code == 28 {
                                            let _ = hold_handle.emit("global_nav_confirm", ());
                                        } else if code == 1 {
                                            let _ = hold_handle.emit("global_nav_back", ());
                                        }
                                    }
                                    _ => {}
                                }
                            }

                            match key {
                                rdev::Key::Alt | rdev::Key::AltGr => {
                                    is_alt_down.store(true, Ordering::SeqCst);
                                }
                                rdev::Key::KeyQ | rdev::Key::KeyA => {
                                    if is_alt_down.load(Ordering::SeqCst)
                                        && !is_q_active.swap(true, Ordering::SeqCst)
                                    {
                                        let _ = hold_handle.emit("global_overlay_show", ());
                                    }
                                }
                                _ => {}
                            }
                        }
                        rdev::EventType::KeyRelease(key) => {
                            match key {
                                rdev::Key::Alt | rdev::Key::AltGr => {
                                    is_alt_down.store(false, Ordering::SeqCst);
                                    if is_q_active.swap(false, Ordering::SeqCst) {
                                        let _ = hold_handle.emit("global_overlay_hide", ());
                                    }
                                }
                                rdev::Key::KeyQ | rdev::Key::KeyA => {
                                    if is_q_active.swap(false, Ordering::SeqCst) {
                                        let _ = hold_handle.emit("global_overlay_hide", ());
                                    }
                                }
                                _ => {}
                            }
                        }
                        _ => {}
                    }
                };

                if let Err(error) = rdev::listen(callback) {
                    eprintln!("Global hook listener error: {:?}", error);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            news::fetch_rockstar_news,
            news::open_news_article,
            news_window::set_news_alert,
            news_window::get_news_alert,
            news_window::sync_news_window,
            set_click_through,
            set_window_hit_regions,
            set_settings_window_mode,
            set_window_visibility,
            start_google_oauth,
            cancel_google_oauth,
            restore_window_focus,
            set_language,
            discord::update_discord_activity,
            discord::clear_discord_activity
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
