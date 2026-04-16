use base64::Engine;

#[tauri::command]
fn runtime_environment() -> serde_json::Value {
    serde_json::json!({
        "runtime": "tauri",
        "tauri": true,
        "tauriVersion": env!("CARGO_PKG_VERSION"),
        "platform": std::env::consts::OS,
    })
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleDriveHttpRequest {
    method: String,
    url: String,
    headers: std::collections::HashMap<String, String>,
    #[serde(default)]
    body_base64: Option<String>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct GoogleDriveHttpResponse {
    status: u16,
    headers: std::collections::HashMap<String, String>,
    body_base64: String,
}

fn allowed_google_apis_url(url: &str) -> bool {
    url.starts_with("https://www.googleapis.com/")
}

#[tauri::command]
async fn google_drive_http_request(
    request: GoogleDriveHttpRequest,
) -> Result<GoogleDriveHttpResponse, String> {
    if !allowed_google_apis_url(&request.url) {
        return Err("Only https://www.googleapis.com/ URLs are allowed".to_string());
    }

    let method = reqwest::Method::from_bytes(request.method.as_bytes())
        .map_err(|e| format!("Invalid HTTP method: {e}"))?;

    let client = reqwest::Client::new();
    let mut req = client.request(method, &request.url);

    for (name, value) in request.headers {
        req = req.header(name, value);
    }

    if let Some(b64) = request.body_base64 {
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(b64.trim())
            .map_err(|e| format!("Invalid request body encoding: {e}"))?;
        req = req.body(bytes);
    }

    let response = req.send().await.map_err(|e| e.to_string())?;
    let status = response.status().as_u16();

    let mut headers = std::collections::HashMap::new();
    for (key, value) in response.headers().iter() {
        if let Ok(v) = value.to_str() {
            headers.insert(key.to_string(), v.to_string());
        }
    }

    let body = response.bytes().await.map_err(|e| e.to_string())?;
    let body_base64 = base64::engine::general_purpose::STANDARD.encode(body);

    Ok(GoogleDriveHttpResponse {
        status,
        headers,
        body_base64,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            runtime_environment,
            google_drive_http_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
