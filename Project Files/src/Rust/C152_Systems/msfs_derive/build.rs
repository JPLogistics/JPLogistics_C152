fn main() {
    // let wasm = std::env::var("TARGET").unwrap().starts_with("wasm32-");
    let msfs_sdk = msfs_sdk::calculate_msfs_sdk_path().unwrap();
    println!("Found MSFS SDK: {:?}", msfs_sdk);

    let data = std::fs::read_dir(
        std::path::PathBuf::from(msfs_sdk)
            .join("Samples")
            .join("SimvarWatcher")
            .join("Simvars"),
    )
    .unwrap()
    .map(|f| f.unwrap())
    .flat_map(|f| {
        let source = std::fs::read_to_string(f.path()).unwrap();
        source
            .lines()
            .filter(|l| !l.is_empty())
            .map(|l| {
                let parts = l.split(',').collect::<Vec<&str>>();
                println!("parts {:?}", parts);
                (parts[0].to_owned(), parts[1].to_owned())
            })
            .collect::<Vec<(String, String)>>()
    })
    .map(|s| {
        format!(
            "simvars.insert({:?}.to_string(), {:?}.to_string());",
            s.0, s.1
        )
    })
    .collect::<Vec<String>>()
    .join("\n");

    let source = format!(
        "
    use std::collections::HashMap;

    pub fn get_simvars() -> HashMap<String, String> {{
        let mut simvars = HashMap::new();
        {}
        simvars
    }}
    ",
        data
    );

    std::fs::write(
        std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap()).join("bindings.rs"),
        source,
    )
    .unwrap();
}
