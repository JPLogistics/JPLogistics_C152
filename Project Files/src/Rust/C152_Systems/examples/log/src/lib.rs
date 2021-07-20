use msfs::{
    self,
    sim_connect::{data_definition, Period, SimConnectRecv, SIMCONNECT_OBJECT_ID_USER},
};

#[data_definition]
#[derive(Debug)]
struct ControlSurfaces {
    #[name = "ELEVATOR POSITION"]
    #[unit = "Position"]
    elevator: f64,
    #[name = "AILERON POSITION"]
    #[unit = "Position"]
    ailerons: f64,
    #[name = "RUDDER POSITION"]
    #[unit = "Position"]
    rudder: f64,
}

#[msfs::standalone_module]
async fn module(mut module: msfs::StandaloneModule) -> Result<(), Box<dyn std::error::Error>> {
    let mut sim = module.open_simconnect("LOG")?;

    sim.request_data_on_sim_object::<ControlSurfaces>(
        0,
        SIMCONNECT_OBJECT_ID_USER,
        Period::SimFrame,
    )?;

    println!("WASM: LOG INSTALLED");

    while let Some(event) = module.next_event().await {
        match event {
            SimConnectRecv::SimObjectData(event) => {
                let data = event.into::<ControlSurfaces>(&sim).unwrap();
                println!("WASM: SimObjectData {:?}", data);
            }
            _ => {}
        }
    }

    Ok(())
}
