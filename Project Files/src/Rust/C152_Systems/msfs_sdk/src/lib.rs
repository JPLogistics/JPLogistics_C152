pub fn calculate_msfs_sdk_path() -> Result<String, &'static str> {
    if let Ok(sdk) = std::env::var("MSFS_SDK") {
        return Ok(sdk);
    }
    for p in ["/mnt/c/MSFS SDK", r"C:\MSFS SDK"].iter() {
        if std::path::Path::new(p).exists() {
            return Ok(p.to_string());
        }
    }
    Err("Could not locate MSFS SDK. Make sure you have it installed or try setting the MSFS_SDK env var.")
}
