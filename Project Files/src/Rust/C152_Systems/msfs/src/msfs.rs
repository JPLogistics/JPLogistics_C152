use crate::{executor, sys};

impl sys::sGaugeDrawData {
    /// Get the width of the target instrument texture.
    pub fn width(&self) -> usize {
        self.winWidth as usize
    }

    /// Get the height of the target instrument texture.
    pub fn height(&self) -> usize {
        self.winHeight as usize
    }

    /// Get the elapsed time since the last frame.
    pub fn delta_time(&self) -> std::time::Duration {
        std::time::Duration::from_secs_f64(self.dt)
    }
}

use crate::sim_connect::{SimConnect, SimConnectRecv};
pub use msfs_derive::{gauge, standalone_module};

/// Used in Gauges to dispatch lifetime events, mouse events, and SimConnect events.
#[derive(Debug)]
pub enum MSFSEvent<'a> {
    PostInstall,
    PreInitialize,
    PostInitialize,
    PreUpdate,
    PostUpdate,
    PreDraw(&'a sys::sGaugeDrawData),
    PostDraw(&'a sys::sGaugeDrawData),
    PreKill,
    Mouse { x: f32, y: f32, flags: u32 },
    SimConnect(SimConnectRecv<'a>),
}

/// Gauge
pub struct Gauge {
    executor: *mut GaugeExecutor,
    rx: futures::channel::mpsc::Receiver<MSFSEvent<'static>>,
}

impl Gauge {
    /// Send a request to the Microsoft Flight Simulator server to open up communications with a new client.
    pub fn open_simconnect<'a>(
        &self,
        name: &str,
    ) -> Result<std::pin::Pin<Box<crate::sim_connect::SimConnect<'a>>>, Box<dyn std::error::Error>>
    {
        let executor = self.executor;
        let sim = crate::sim_connect::SimConnect::open(name, move |_sim, recv| {
            let executor = unsafe { &mut *executor };
            let recv =
                unsafe { std::mem::transmute::<SimConnectRecv<'_>, SimConnectRecv<'static>>(recv) };
            executor
                .executor
                .send(Some(MSFSEvent::SimConnect(recv)))
                .unwrap();
        })?;
        Ok(sim)
    }

    /// Create a NanoVG rendering context. See `Context` for more details.
    #[cfg(any(target_arch = "wasm32", doc))]
    pub fn create_nanovg(&self) -> Option<crate::nvg::Context> {
        crate::nvg::Context::create(unsafe { (*self.executor).fs_ctx.unwrap() })
    }

    /// Consume the next event from MSFS.
    pub fn next_event(&mut self) -> impl futures::Future<Output = Option<MSFSEvent<'_>>> + '_ {
        use futures::stream::StreamExt;
        async move { self.rx.next().await }
    }
}

#[doc(hidden)]
pub struct GaugeExecutor {
    pub fs_ctx: Option<sys::FsContext>,
    pub executor: executor::Executor<Gauge, MSFSEvent<'static>>,
}

#[doc(hidden)]
impl GaugeExecutor {
    pub fn handle_gauge(
        &mut self,
        ctx: sys::FsContext,
        service_id: std::os::raw::c_int,
        p_data: *mut std::ffi::c_void,
    ) -> bool {
        match service_id as u32 {
            sys::PANEL_SERVICE_PRE_INSTALL => {
                let executor = self as *mut GaugeExecutor;
                self.fs_ctx = Some(ctx);
                self.executor
                    .start(Box::new(move |rx| Gauge { executor, rx }))
                    .is_ok()
            }
            sys::PANEL_SERVICE_POST_KILL => self.executor.send(None).is_ok(),
            service_id => {
                if let Some(data) = match service_id {
                    sys::PANEL_SERVICE_POST_INSTALL => Some(MSFSEvent::PostInstall),
                    sys::PANEL_SERVICE_PRE_INITIALIZE => Some(MSFSEvent::PreInitialize),
                    sys::PANEL_SERVICE_POST_INITIALIZE => Some(MSFSEvent::PostInitialize),
                    sys::PANEL_SERVICE_PRE_UPDATE => Some(MSFSEvent::PreUpdate),
                    sys::PANEL_SERVICE_POST_UPDATE => Some(MSFSEvent::PostUpdate),
                    sys::PANEL_SERVICE_PRE_DRAW => Some(MSFSEvent::PreDraw(unsafe {
                        &*(p_data as *const sys::sGaugeDrawData)
                    })),
                    sys::PANEL_SERVICE_POST_DRAW => Some(MSFSEvent::PostDraw(unsafe {
                        &*(p_data as *const sys::sGaugeDrawData)
                    })),
                    sys::PANEL_SERVICE_PRE_KILL => Some(MSFSEvent::PreKill),
                    _ => None,
                } {
                    self.executor.send(Some(data)).is_ok()
                } else {
                    true
                }
            }
        }
    }

    pub fn handle_mouse(&mut self, x: f32, y: f32, flags: u32) {
        self.executor
            .send(Some(MSFSEvent::Mouse { x, y, flags }))
            .unwrap();
    }
}

pub struct StandaloneModule {
    executor: *mut StandaloneModuleExecutor,
    rx: futures::channel::mpsc::Receiver<SimConnectRecv<'static>>,
}

impl StandaloneModule {
    /// Send a request to the Microsoft Flight Simulator server to open up communications with a new client.
    pub fn open_simconnect<'a>(
        &self,
        name: &str,
    ) -> Result<std::pin::Pin<Box<SimConnect<'a>>>, Box<dyn std::error::Error>> {
        let executor = self.executor;
        let sim = SimConnect::open(name, move |_sim, recv| {
            let executor = unsafe { &mut *executor };
            let recv =
                unsafe { std::mem::transmute::<SimConnectRecv<'_>, SimConnectRecv<'static>>(recv) };
            executor.executor.send(Some(recv)).unwrap();
        })?;
        Ok(sim)
    }

    /// Consume the next event from MSFS.
    pub fn next_event(&mut self) -> impl futures::Future<Output = Option<SimConnectRecv<'_>>> + '_ {
        use futures::stream::StreamExt;
        async move { self.rx.next().await }
    }
}

#[doc(hidden)]
pub struct StandaloneModuleExecutor {
    pub executor: executor::Executor<StandaloneModule, SimConnectRecv<'static>>,
}

#[doc(hidden)]
impl StandaloneModuleExecutor {
    fn start(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let executor = self as *mut StandaloneModuleExecutor;
        self.executor
            .start(Box::new(move |rx| StandaloneModule { executor, rx }))
    }

    pub fn handle_init(&mut self) {
        self.start().unwrap();
    }

    fn end(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        self.executor.send(None)
    }

    pub fn handle_deinit(&mut self) {
        self.end().unwrap();
    }
}
