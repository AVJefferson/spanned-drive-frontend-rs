#[tauri::command]
fn runtime_environment() -> serde_json::Value {
    serde_json::json!({
        "runtime": "tauri",
        "tauri": true,
        "platform": std::env::consts::OS,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![runtime_environment])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
