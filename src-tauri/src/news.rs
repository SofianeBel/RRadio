use std::io::Read;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::Value;

const NEWSWIRE_FEED_URL: &str = "https://graph.rockstargames.com/?origin=https%3A%2F%2Fwww.rockstargames.com&operationName=NewswireList&variables=%7B%22tagIdHash%22%3Anull%2C%22page%22%3A1%2C%22metaUrl%22%3A%22%2Fnewswire%22%2C%22limit%22%3A20%2C%22locale%22%3A%22en_us%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%227ec00215aecc70de257b0719a1dfcfa84fe57fdc7bf5c10ec2e8f377defede58%22%7D%7D";
const ROCKSTAR_SITE: &str = "https://www.rockstargames.com";
const ROCKSTAR_SOURCE_ICON: &str =
    "https://media-rockstargames-com.akamaized.net/favicons/rockstar/favicon-180x180.png";
const MAX_RESPONSE_BYTES: u64 = 256 * 1024;
const MAX_ITEMS: usize = 12;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);
type PublishedKey = (u16, u8, u8, u8, u8);

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct NewsItem {
    pub id: String,
    pub title: String,
    pub url: String,
    pub source: String,
    pub source_icon: String,
    pub published_at: String,
}

/// Fetch the official Rockstar Newswire list without blocking Tauri's async runtime.
#[tauri::command]
pub async fn fetch_rockstar_news() -> Result<Vec<NewsItem>, String> {
    tauri::async_runtime::spawn_blocking(fetch_rockstar_news_blocking)
        .await
        .map_err(|error| format!("Rockstar Newswire task failed: {error}"))?
}

#[tauri::command]
pub fn open_news_article(url: String) -> Result<(), String> {
    if !is_official_article_url(&url) {
        return Err("Only official Rockstar Newswire articles can be opened".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        use windows::core::PCWSTR;
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::Shell::ShellExecuteW;
        use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

        let wide_url = OsStr::new(&url)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<_>>();
        let wide_open = OsStr::new("open")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<_>>();
        // SAFETY: both pointers reference local, NUL-terminated UTF-16 buffers and the
        // null owner HWND is valid for ShellExecuteW.
        let result = unsafe {
            ShellExecuteW(
                HWND(std::ptr::null_mut()),
                PCWSTR(wide_open.as_ptr()),
                PCWSTR(wide_url.as_ptr()),
                PCWSTR::null(),
                PCWSTR::null(),
                SW_SHOWNORMAL,
            )
        };
        let result_code = result.0 as isize;
        if result_code <= 32 {
            return Err(format!(
                "Windows could not open the Newswire article ({result_code})"
            ));
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|error| format!("Could not open the Newswire article: {error}"))?;
    }

    Ok(())
}

fn fetch_rockstar_news_blocking() -> Result<Vec<NewsItem>, String> {
    let agent = ureq::AgentBuilder::new()
        .timeout(REQUEST_TIMEOUT)
        .redirects(0)
        .build();
    let response = agent
        .get(NEWSWIRE_FEED_URL)
        .set("Accept", "application/json")
        .set("Origin", ROCKSTAR_SITE)
        .set("User-Agent", "RRadio/0.1 Rockstar-Newswire")
        .call()
        .map_err(|error| format!("Rockstar Newswire request failed: {error}"))?;

    let mut body = String::new();
    response
        .into_reader()
        .take(MAX_RESPONSE_BYTES + 1)
        .read_to_string(&mut body)
        .map_err(|error| format!("Could not read Rockstar Newswire response: {error}"))?;
    if body.len() as u64 > MAX_RESPONSE_BYTES {
        return Err("Rockstar Newswire response exceeded 256 KiB".to_string());
    }

    parse_newswire_response(&body)
}

fn parse_newswire_response(body: &str) -> Result<Vec<NewsItem>, String> {
    let response: Value = serde_json::from_str(body)
        .map_err(|error| format!("Invalid Rockstar Newswire JSON: {error}"))?;
    if let Some(errors) = response.get("errors") {
        if !errors.is_null() {
            return Err("Rockstar Newswire returned GraphQL errors".to_string());
        }
    }

    let results = response
        .pointer("/data/posts/results")
        .and_then(Value::as_array)
        .ok_or_else(|| "Rockstar Newswire response did not contain post results".to_string())?;

    let mut items = results
        .iter()
        .take(MAX_ITEMS * 2)
        .filter_map(parse_news_item)
        .collect::<Vec<_>>();
    items.sort_unstable_by(|left, right| right.0.cmp(&left.0));

    Ok(items
        .into_iter()
        .take(MAX_ITEMS)
        .map(|(_, item)| item)
        .collect())
}

fn parse_news_item(post: &Value) -> Option<(PublishedKey, NewsItem)> {
    let id = post.get("id")?.as_str()?.trim();
    let title = post.get("title")?.as_str()?.trim();
    let path = post.get("url")?.as_str()?;
    let created = post.get("created")?.as_str()?;
    let published_at = post.get("created_formatted")?.as_str()?.trim();

    if id.is_empty()
        || id.len() > 128
        || !id.bytes().all(|byte| byte.is_ascii_alphanumeric())
        || title.is_empty()
        || title.len() > 500
        || published_at.is_empty()
        || published_at.len() > 100
    {
        return None;
    }

    let published_key = parse_newswire_timestamp(created)?;
    let url = official_article_url(path)?;
    Some((
        published_key,
        NewsItem {
            id: id.to_string(),
            title: title.to_string(),
            url,
            source: "Rockstar Games Newswire".to_string(),
            source_icon: ROCKSTAR_SOURCE_ICON.to_string(),
            published_at: published_at.to_string(),
        },
    ))
}

fn official_article_url(path: &str) -> Option<String> {
    let article_path = path.strip_prefix("/newswire/article/")?;
    if article_path.is_empty()
        || article_path.len() > 512
        || article_path.contains(['?', '#', '\\'])
        || article_path.split('/').any(|segment| {
            segment.is_empty()
                || !segment
                    .bytes()
                    .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
        })
    {
        return None;
    }

    Some(format!("{ROCKSTAR_SITE}{path}"))
}

pub(crate) fn is_official_article_url(url: &str) -> bool {
    let Some(path) = url.strip_prefix(ROCKSTAR_SITE) else {
        return false;
    };
    official_article_url(path).as_deref() == Some(url)
}

fn parse_newswire_timestamp(timestamp: &str) -> Option<PublishedKey> {
    let (date, time) = timestamp.split_once(", ")?;
    let mut date = date.split('/');
    let month = date.next()?.parse::<u8>().ok()?;
    let day = date.next()?.parse::<u8>().ok()?;
    let year = date.next()?.parse::<u16>().ok()?.checked_add(2000)?;
    if date.next().is_some() || !(1..=12).contains(&month) || !(1..=31).contains(&day) {
        return None;
    }

    let (clock, meridiem) = time.split_once(' ')?;
    let mut clock = clock.split(':');
    let hour = clock.next()?.parse::<u8>().ok()?;
    let minute = clock.next()?.parse::<u8>().ok()?;
    if clock.next().is_some() || !(1..=12).contains(&hour) || minute > 59 {
        return None;
    }
    let hour = match meridiem {
        "AM" if hour == 12 => 0,
        "AM" => hour,
        "PM" if hour == 12 => 12,
        "PM" => hour + 12,
        _ => return None,
    };

    Some((year, month, day, hour, minute))
}

#[cfg(test)]
mod tests {
    use super::{
        is_official_article_url, official_article_url, parse_newswire_response,
        parse_newswire_timestamp,
    };

    #[test]
    fn accepts_only_official_newswire_article_paths() {
        assert_eq!(
            official_article_url("/newswire/article/abc123/a-story"),
            Some("https://www.rockstargames.com/newswire/article/abc123/a-story".to_string())
        );
        assert_eq!(official_article_url("https://example.com/article"), None);
        assert_eq!(
            official_article_url("/newswire/article/abc123/a-story?next=evil"),
            None
        );
        assert!(is_official_article_url(
            "https://www.rockstargames.com/newswire/article/abc123/a-story"
        ));
        assert!(!is_official_article_url(
            "https://rockstargames.com/newswire/article/abc123/a-story"
        ));
        assert!(!is_official_article_url(
            "https://www.rockstargames.com/newswire/article/abc123/a-story#fragment"
        ));
    }

    #[test]
    fn parses_and_orders_official_items_newest_first() {
        let response = r#"{
          "data": { "posts": { "results": [
            {"id":"older","title":"Red Dead update","url":"/newswire/article/older/red-dead","created":"8/27/26, 3:00 PM","created_formatted":"August 27, 2026"},
            {"id":"newer","title":"GTA update","url":"/newswire/article/newer/gta","created":"9/10/26, 10:00 AM","created_formatted":"September 10, 2026"},
            {"id":"bad","title":"Bad URL","url":"https://example.com/article","created":"9/11/26, 1:00 PM","created_formatted":"September 11, 2026"}
          ] } }, "errors": null
        }"#;

        let items = parse_newswire_response(response).expect("fixture is valid");
        assert_eq!(items.len(), 2);
        assert_eq!(items[0].id, "newer");
        assert_eq!(items[0].published_at, "September 10, 2026");
        assert_eq!(items[0].source, "Rockstar Games Newswire");
        assert!(items.iter().all(|item| item
            .url
            .starts_with("https://www.rockstargames.com/newswire/article/")));
    }

    #[test]
    fn parses_noon_and_midnight_correctly() {
        assert_eq!(
            parse_newswire_timestamp("9/10/26, 12:00 AM"),
            Some((2026, 9, 10, 0, 0))
        );
        assert_eq!(
            parse_newswire_timestamp("9/10/26, 12:00 PM"),
            Some((2026, 9, 10, 12, 0))
        );
    }
}
