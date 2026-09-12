use std::sync::Mutex;
use tauri::{Emitter, Manager};

use crate::news::{is_official_article_url, NewsItem};

const MAX_ALERT_PAYLOAD_BYTES: usize = 4096;

#[derive(Debug, Clone, Copy, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum NewsTheme {
    Gta4,
    Gta6,
}

#[derive(Debug, Clone, Copy, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum NewsLanguage {
    Fr,
    En,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewsAlertPayload {
    pub item: NewsItem,
    pub theme: NewsTheme,
    pub language: NewsLanguage,
}

#[derive(Default)]
pub struct NewsAlert(pub Mutex<Option<NewsAlertPayload>>);

fn validate_alert_payload(payload: &NewsAlertPayload) -> Result<(), String> {
    let item = &payload.item;
    if item.id.is_empty()
        || item.id.len() > 128
        || !item
            .id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_')
    {
        return Err("Invalid Newswire item id".to_string());
    }
    if item.title.is_empty() || item.title.len() > 500 {
        return Err("Invalid Newswire item title".to_string());
    }
    if item.source.is_empty() || item.source.len() > 128 {
        return Err("Invalid Newswire item source".to_string());
    }
    if item.source_icon.len() > 512 || item.published_at.is_empty() || item.published_at.len() > 100
    {
        return Err("Invalid Newswire item metadata".to_string());
    }
    if item.url.len() > 512 || (!item.url.is_empty() && !is_official_article_url(&item.url)) {
        return Err("News alert URL must be an official Newswire article".to_string());
    }
    if serde_json::to_vec(payload)
        .map_err(|error| format!("Could not encode News alert: {error}"))?
        .len()
        > MAX_ALERT_PAYLOAD_BYTES
    {
        return Err("News alert payload is too large".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn set_news_alert(
    app: tauri::AppHandle,
    state: tauri::State<NewsAlert>,
    payload: Option<NewsAlertPayload>,
) -> Result<(), String> {
    if let Some(ref payload) = payload {
        validate_alert_payload(payload)?;
    }
    *state.0.lock().map_err(|e| e.to_string())? = payload;
    app.emit_to("news", "news-alert-changed", ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_news_alert(state: tauri::State<NewsAlert>) -> Result<Option<NewsAlertPayload>, String> {
    Ok(state.0.lock().map_err(|e| e.to_string())?.clone())
}

#[tauri::command]
pub fn sync_news_window(
    app: tauri::AppHandle,
    state: tauri::State<NewsAlert>,
) -> Result<(), String> {
    let visible = state.0.lock().map_err(|e| e.to_string())?.is_some();
    let window = app
        .get_webview_window("news")
        .ok_or("News window is unavailable")?;
    let hwnd = window.hwnd().map_err(|e| e.to_string())?;
    if !visible {
        // Pair native show with native hide; Tauri still considers this window hidden.
        // SAFETY: the HWND comes from the live Tauri webview window and the Win32
        // visibility constants are valid for ShowWindow and IsWindowVisible.
        unsafe {
            use windows::Win32::UI::WindowsAndMessaging::{IsWindowVisible, ShowWindow, SW_HIDE};
            let native_hwnd = windows::Win32::Foundation::HWND(hwnd.0);
            let _ = ShowWindow(native_hwnd, SW_HIDE);
            if IsWindowVisible(native_hwnd).as_bool() {
                return Err("News window could not be hidden".to_string());
            }
        }
        return Ok(());
    }
    if let Some(monitor) = window.primary_monitor().map_err(|e| e.to_string())? {
        let scale = monitor.scale_factor();
        let width = (420.0 * scale).min(monitor.size().width as f64) as u32;
        let height = (160.0 * scale).min(monitor.size().height as f64) as u32;
        window
            .set_size(tauri::PhysicalSize::new(width, height))
            .map_err(|e| e.to_string())?;
        window
            .set_position(tauri::PhysicalPosition::new(
                monitor.position().x,
                monitor.position().y + monitor.size().height as i32
                    - height as i32
                    - (48.0 * scale) as i32,
            ))
            .map_err(|e| e.to_string())?;
    }
    window
        .set_ignore_cursor_events(true)
        .map_err(|e| e.to_string())?;
    // Show only through Win32: a notification must never activate the game overlay.
    super::configure_pure_overlay_window(hwnd.0 as isize, true);
    // SAFETY: the HWND comes from the live Tauri webview window and the Win32
    // visibility constants are valid for ShowWindow and IsWindowVisible.
    unsafe {
        use windows::Win32::UI::WindowsAndMessaging::{
            IsWindowVisible, ShowWindow, SW_SHOWNOACTIVATE,
        };
        let native_hwnd = windows::Win32::Foundation::HWND(hwnd.0);
        let _ = ShowWindow(native_hwnd, SW_SHOWNOACTIVATE);
        if !IsWindowVisible(native_hwnd).as_bool() {
            return Err("News window could not be shown".to_string());
        }
    }
    eprintln!("NEWS: visible=true click_through=true no_activate=true");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{validate_alert_payload, NewsAlertPayload, NewsLanguage, NewsTheme};
    use crate::news::NewsItem;

    fn payload(url: &str) -> NewsAlertPayload {
        NewsAlertPayload {
            item: NewsItem {
                id: "preview".to_string(),
                title: "Preview".to_string(),
                url: url.to_string(),
                source: "RRadio".to_string(),
                source_icon: String::new(),
                published_at: "Today".to_string(),
            },
            theme: NewsTheme::Gta6,
            language: NewsLanguage::En,
        }
    }

    #[test]
    fn rejects_untrusted_and_oversized_alerts() {
        assert!(validate_alert_payload(&payload("https://example.com/article")).is_err());

        let mut oversized = payload("");
        oversized.item.title = "x".repeat(501);
        assert!(validate_alert_payload(&oversized).is_err());
    }
}
