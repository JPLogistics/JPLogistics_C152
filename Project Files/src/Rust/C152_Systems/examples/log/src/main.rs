use msfs::sim_connect::{
    data_definition, Period, SimConnect, SimConnectRecv, SIMCONNECT_OBJECT_ID_USER,
};

#[data_definition]
#[derive(Debug)]
struct Data {
    #[name = "RADIO HEIGHT"]
    #[epsilon = 0.01]
    height: f64,
    #[name = "AIRSPEED INDICATED"]
    #[epsilon = 0.01]
    airspeed: f64,
}

#[data_definition]
#[derive(Debug)]
struct Controls {
    #[name = "ELEVATOR POSITION"]
    elevator: f64,
    #[name = "AILERON POSITION"]
    ailerons: f64,
    #[name = "RUDDER POSITION"]
    rudder: f64,
    #[name = "ELEVATOR TRIM POSITION"]
    elevator_trim: f64,
}

#[data_definition]
#[derive(Debug)]
struct Throttle(
    #[name = "GENERAL ENG THROTTLE LEVER POSITION:1"] f64,
    #[name = "GENERAL ENG THROTTLE LEVER POSITION:2"] f64,
);

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut sim = SimConnect::open("LOG", |sim, recv| match recv {
        SimConnectRecv::SimObjectData(event) => match event.dwRequestID {
            0 => {
                println!("{:?}", event.into::<Data>(sim).unwrap());
            }
            1 => {
                println!("{:?}", event.into::<Controls>(sim).unwrap());
            }
            2 => {
                println!("{:?}", event.into::<Throttle>(sim).unwrap());
            }
            _ => {}
        },
        _ => println!("{:?}", recv),
    })?;

    sim.request_data_on_sim_object::<Data>(0, SIMCONNECT_OBJECT_ID_USER, Period::SimFrame)?;
    sim.request_data_on_sim_object::<Controls>(1, SIMCONNECT_OBJECT_ID_USER, Period::SimFrame)?;
    sim.request_data_on_sim_object::<Throttle>(2, SIMCONNECT_OBJECT_ID_USER, Period::SimFrame)?;

    loop {
        sim.call_dispatch()?;
        std::thread::sleep(std::time::Duration::from_millis(10));
    }
}
