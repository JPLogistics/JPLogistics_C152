use msfs::sim_connect::{client_data_definition, SimConnect, SimConnectRecv};

#[client_data_definition]
#[derive(Debug)]
struct Data {
    foo: u32,
    bar: i8,
    baz: bool,
    qux: i16,
}

fn writer() -> Result<(), Box<dyn std::error::Error>> {
    let mut sim = SimConnect::open("CLIENT_DATA_WRITER", |_sim, recv| {
        println!("WRITER: {:?}", recv);
    })?;

    let area = sim.create_client_data::<Data>("data")?;
    let mut data = Data {
        foo: 0,
        bar: 42,
        baz: false,
        qux: 13,
    };

    loop {
        sim.call_dispatch()?;
        data.foo += 1;
        data.baz = !data.baz;
        sim.set_client_data(&area, &data)?;
        std::thread::sleep(std::time::Duration::from_millis(10));
    }
}

fn reader() -> Result<(), Box<dyn std::error::Error>> {
    let mut sim = SimConnect::open("CLIENT_DATA_READER", |sim, recv| {
        match recv {
            SimConnectRecv::ClientData(e) => {
                println!("READER: {:?}", e.into::<Data>(sim).unwrap());
            }
            _ => println!("READER: {:?}", recv),
        }
    })?;

    sim.request_client_data::<Data>(0, "data")?;

    loop {
        sim.call_dispatch()?;
        std::thread::sleep(std::time::Duration::from_millis(10));
    }
}

fn main() {
    let w = std::thread::spawn(|| writer().unwrap());
    let r = std::thread::spawn(|| reader().unwrap());
    w.join().unwrap();
    r.join().unwrap();
}
