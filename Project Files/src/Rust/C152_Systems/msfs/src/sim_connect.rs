#![allow(clippy::too_many_arguments)]

use crate::sys;
use std::any::TypeId;
use std::collections::HashMap;
use std::pin::Pin;

pub use sys::SIMCONNECT_OBJECT_ID_USER;

pub use msfs_derive::sim_connect_client_data_definition as client_data_definition;
pub use msfs_derive::sim_connect_data_definition as data_definition;

pub type DataXYZ = sys::SIMCONNECT_DATA_XYZ;

/// A trait implemented by the `data_definition` attribute.
pub trait DataDefinition: 'static {
    #[doc(hidden)]
    const DEFINITIONS: &'static [(&'static str, &'static str, f32, sys::SIMCONNECT_DATATYPE)];
}

/// A trait implemented by the `client_data_definition` attribute.
pub trait ClientDataDefinition: 'static {
    #[doc(hidden)]
    fn get_definitions() -> Vec<(usize, usize, f32)>;
}

/// Rusty HRESULT wrapper.
#[derive(Debug)]
pub struct HResult(sys::HRESULT);
impl std::fmt::Display for HResult {
    fn fmt(&self, fmt: &mut std::fmt::Formatter) -> std::fmt::Result {
        std::fmt::Debug::fmt(self, fmt)
    }
}
impl std::error::Error for HResult {}

pub type Result<T> = std::result::Result<T, HResult>;
#[inline(always)]
fn map_err(result: sys::HRESULT) -> Result<()> {
    if result >= 0 {
        Ok(())
    } else {
        Err(HResult(result))
    }
}

/// A SimConnect session. This provides access to data within the MSFS sim.
pub struct SimConnect<'a> {
    handle: sys::HANDLE,
    callback: Box<dyn FnMut(&mut SimConnect, SimConnectRecv) + 'a>,
    data_definitions: HashMap<TypeId, sys::SIMCONNECT_DATA_DEFINITION_ID>,
    client_data_definitions: HashMap<TypeId, sys::SIMCONNECT_CLIENT_DATA_DEFINITION_ID>,
    event_id_counter: sys::DWORD,
    client_data_id_counter: sys::DWORD,
}

impl<'a> std::fmt::Debug for SimConnect<'a> {
    fn fmt(&self, fmt: &mut std::fmt::Formatter) -> std::fmt::Result {
        fmt.debug_struct("SimConnect").finish()
    }
}

impl<'a> SimConnect<'a> {
    /// Send a request to the Microsoft Flight Simulator server to open up communications with a new client.
    pub fn open<F>(name: &str, callback: F) -> Result<Pin<Box<SimConnect<'a>>>>
    where
        F: FnMut(&mut SimConnect, SimConnectRecv) + 'a,
    {
        unsafe {
            let mut handle = 0;
            let name = std::ffi::CString::new(name).unwrap();
            map_err(sys::SimConnect_Open(
                &mut handle,
                name.as_ptr(),
                std::ptr::null_mut(),
                0,
                0,
                0,
            ))?;
            debug_assert!(handle != 0);
            let mut sim = Box::pin(SimConnect {
                handle,
                callback: Box::new(callback),
                data_definitions: HashMap::new(),
                client_data_definitions: HashMap::new(),
                event_id_counter: 0,
                client_data_id_counter: 0,
            });
            sim.call_dispatch()?;
            Ok(sim)
        }
    }

    /// Used to process the next SimConnect message received. Only needed when not using the gauge API.
    pub fn call_dispatch(&mut self) -> Result<()> {
        unsafe {
            map_err(sys::SimConnect_CallDispatch(
                self.handle,
                Some(dispatch_cb),
                self as *mut SimConnect as *mut std::ffi::c_void,
            ))
        }
    }

    fn get_define_id<T: DataDefinition>(&mut self) -> Result<sys::SIMCONNECT_DATA_DEFINITION_ID> {
        let handle = self.handle;
        SimConnect::get_id::<T, _, _>(
            &mut self.data_definitions,
            |define_id: sys::SIMCONNECT_DATA_DEFINITION_ID| {
                /*
                unsafe {
                    map_err(sys::SimConnect_ClearDataDefinition(handle, define_id))?;
                }
                */
                for (datum_name, units_type, epsilon, datatype) in T::DEFINITIONS {
                    let datum_name = std::ffi::CString::new(*datum_name).unwrap();
                    let units_type = std::ffi::CString::new(*units_type).unwrap();
                    unsafe {
                        map_err(sys::SimConnect_AddToDataDefinition(
                            handle,
                            define_id,
                            datum_name.as_ptr(),
                            units_type.as_ptr(),
                            *datatype,
                            *epsilon,
                            sys::SIMCONNECT_UNUSED,
                        ))?;
                    }
                }
                Ok(())
            },
        )
    }

    fn get_client_data_define_id<T: ClientDataDefinition>(
        &mut self,
    ) -> Result<sys::SIMCONNECT_CLIENT_DATA_DEFINITION_ID> {
        let handle = self.handle;
        SimConnect::get_id::<T, _, _>(&mut self.client_data_definitions, |define_id| {
            /*
            unsafe {
                map_err(sys::SimConnect_ClearClientDataDefinition(handle, define_id))?;
            }
            */

            // Rust may reorder fields, so padding has to be calculated as min of
            // all fields instead of the last field.
            let mut padding = std::usize::MAX;
            for (offset, size, epsilon) in T::get_definitions() {
                padding = padding.min(std::mem::size_of::<T>() - (offset + size));
                unsafe {
                    map_err(sys::SimConnect_AddToClientDataDefinition(
                        handle,
                        define_id,
                        offset as sys::DWORD,
                        size as sys::DWORD,
                        epsilon,
                        sys::SIMCONNECT_UNUSED,
                    ))?;
                }
            }
            if padding > 0 && padding != std::usize::MAX {
                unsafe {
                    map_err(sys::SimConnect_AddToClientDataDefinition(
                        handle,
                        define_id,
                        (std::mem::size_of::<T>() - padding) as sys::DWORD,
                        padding as sys::DWORD,
                        0.0,
                        sys::SIMCONNECT_UNUSED,
                    ))?;
                }
            }
            Ok(())
        })
    }

    fn get_id<T: 'static, U: std::convert::TryFrom<usize> + Copy, F: Fn(U) -> Result<()>>(
        map: &mut HashMap<TypeId, U>,
        insert_fn: F,
    ) -> Result<U> {
        let key = TypeId::of::<T>();
        let maybe_id = U::try_from(map.len()).unwrap_or_else(|_| unreachable!());
        match map.entry(key) {
            std::collections::hash_map::Entry::Vacant(entry) => {
                insert_fn(maybe_id)?;
                entry.insert(maybe_id);
                Ok(maybe_id)
            }
            std::collections::hash_map::Entry::Occupied(entry) => Ok(*entry.get()),
        }
    }

    /// Make changes to the data properties of an object.
    pub fn set_data_on_sim_object<T: DataDefinition>(
        &mut self,
        object_id: sys::SIMCONNECT_OBJECT_ID,
        data: &T,
    ) -> Result<()> {
        let define_id = self.get_define_id::<T>()?;
        unsafe {
            map_err(sys::SimConnect_SetDataOnSimObject(
                self.handle,
                define_id,
                object_id,
                0,
                0,
                std::mem::size_of_val(data) as sys::DWORD,
                data as *const T as *mut std::ffi::c_void,
            ))
        }
    }

    /// Retrieve information about simulation objects of a given type that are
    /// within a specified radius of the user's aircraft.
    pub fn request_data_on_sim_object_type<T: DataDefinition>(
        &mut self,
        request_id: sys::SIMCONNECT_DATA_REQUEST_ID,
        radius: sys::DWORD,
        r#type: sys::SIMCONNECT_SIMOBJECT_TYPE,
    ) -> Result<()> {
        let define_id = self.get_define_id::<T>()?;
        unsafe {
            map_err(sys::SimConnect_RequestDataOnSimObjectType(
                self.handle,
                request_id,
                define_id,
                radius,
                r#type,
            ))
        }
    }

    /// Request when the SimConnect client is to receive data values for a specific object
    pub fn request_data_on_sim_object<T: DataDefinition>(
        &mut self,
        request_id: sys::SIMCONNECT_DATA_REQUEST_ID,
        object_id: sys::SIMCONNECT_OBJECT_ID,
        period: Period,
    ) -> Result<()> {
        let define_id = self.get_define_id::<T>()?;

        unsafe {
            map_err(sys::SimConnect_RequestDataOnSimObject(
                self.handle,
                request_id,
                define_id,
                object_id,
                period as sys::SIMCONNECT_PERIOD,
                sys::SIMCONNECT_DATA_REQUEST_FLAG_CHANGED,
                0,
                0,
                0,
            ))
        }
    }

    /// Map a Prepar3D event to a specific ID. If `mask` is true, the sim itself
    /// will ignore the event, and only this SimConnect instance will receive it.
    pub fn map_client_event_to_sim_event(
        &mut self,
        event_name: &str,
        mask: bool,
    ) -> Result<sys::DWORD> {
        let event_id = self.event_id_counter;
        self.event_id_counter += 1;
        unsafe {
            let event_name = std::ffi::CString::new(event_name).unwrap();
            map_err(sys::SimConnect_MapClientEventToSimEvent(
                self.handle,
                event_id,
                event_name.as_ptr(),
            ))?;

            map_err(sys::SimConnect_AddClientEventToNotificationGroup(
                self.handle,
                0,
                event_id,
                if mask { 1 } else { 0 },
            ))?;

            map_err(sys::SimConnect_SetNotificationGroupPriority(
                self.handle,
                0,
                sys::SIMCONNECT_GROUP_PRIORITY_HIGHEST_MASKABLE,
            ))?;
        }
        Ok(event_id)
    }

    /// Trigger an event, previously mapped with `map_client_event_to_sim_event`
    pub fn transmit_client_event(
        &mut self,
        object_id: sys::SIMCONNECT_OBJECT_ID,
        event_id: sys::DWORD,
        data: sys::DWORD,
    ) -> Result<()> {
        unsafe {
            map_err(sys::SimConnect_TransmitClientEvent(
                self.handle,
                object_id,
                event_id,
                data,
                0,
                0,
            ))
        }
    }

    fn get_client_data_id(&mut self, name: &str) -> Result<sys::SIMCONNECT_CLIENT_DATA_ID> {
        let client_id = self.client_data_id_counter;
        self.client_data_id_counter += 1;
        unsafe {
            let name = std::ffi::CString::new(name).unwrap();
            map_err(sys::SimConnect_MapClientDataNameToID(
                self.handle,
                name.as_ptr(),
                client_id,
            ))?;
        }
        Ok(client_id)
    }

    /// Allocate a region of memory in the sim with the given `name`. Other
    /// SimConnect modules can use the `name` to read data from this memory
    /// using `request_client_data`. This memory cannot be deallocated.
    pub fn create_client_data<T: ClientDataDefinition>(
        &mut self,
        name: &str,
    ) -> Result<ClientDataArea<T>> {
        let client_id = self.get_client_data_id(name)?;
        unsafe {
            map_err(sys::SimConnect_CreateClientData(
                self.handle,
                client_id,
                std::mem::size_of::<T>() as sys::DWORD,
                0,
            ))?;
        }
        Ok(ClientDataArea {
            client_id,
            phantom: std::marker::PhantomData,
        })
    }

    /// Create a handle to a region of memory allocated by another module with
    /// the given `name`.
    pub fn get_client_area<T: ClientDataDefinition>(
        &mut self,
        name: &str,
    ) -> Result<ClientDataArea<T>> {
        let client_id = self.get_client_data_id(name)?;
        Ok(ClientDataArea {
            client_id,
            phantom: std::marker::PhantomData,
        })
    }

    /// Request a pre-allocated region of memory from the sim with the given
    /// `name`. A module must have already used `create_client_data` to
    /// allocate this memory.
    pub fn request_client_data<T: ClientDataDefinition>(
        &mut self,
        request_id: sys::SIMCONNECT_DATA_REQUEST_ID,
        name: &str,
    ) -> Result<()> {
        let define_id = self.get_client_data_define_id::<T>()?;
        let client_id = self.get_client_data_id(name)?;
        unsafe {
            map_err(sys::SimConnect_RequestClientData(
                self.handle,
                client_id,
                request_id,
                define_id,
                sys::SIMCONNECT_CLIENT_DATA_PERIOD_SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET,
                sys::SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_CHANGED,
                0,
                0,
                0,
            ))?;
        }
        Ok(())
    }

    /// Set the data of an area acquired by `create_client_data` or
    /// `get_client_data`.
    pub fn set_client_data<T: ClientDataDefinition>(
        &mut self,
        area: &ClientDataArea<T>,
        data: &T,
    ) -> Result<()> {
        unsafe {
            map_err(sys::SimConnect_SetClientData(
                self.handle,
                area.client_id,
                self.get_client_data_define_id::<T>()?,
                0,
                0,
                std::mem::size_of::<T>() as sys::DWORD,
                data as *const _ as *mut std::ffi::c_void,
            ))?;
        }
        Ok(())
    }
}

impl<'a> Drop for SimConnect<'a> {
    fn drop(&mut self) {
        unsafe {
            map_err(sys::SimConnect_Close(self.handle)).expect("SimConnect_Close");
        }
    }
}

macro_rules! recv {
    ($V:ident) => {
        $V!(
            (
                SIMCONNECT_RECV_ID_SIMCONNECT_RECV_ID_EXCEPTION,
                SIMCONNECT_RECV_EXCEPTION,
                Exception
            ),
            (
                SIMCONNECT_RECV_ID_SIMCONNECT_RECV_ID_OPEN,
                SIMCONNECT_RECV_OPEN,
                Open
            ),
            (
                SIMCONNECT_RECV_ID_SIMCONNECT_RECV_ID_QUIT,
                SIMCONNECT_RECV_QUIT,
                Quit
            ),
            (
                SIMCONNECT_RECV_ID_SIMCONNECT_RECV_ID_EVENT,
                SIMCONNECT_RECV_EVENT,
                Event
            ),
            (
                SIMCONNECT_RECV_ID_SIMCONNECT_RECV_ID_SIMOBJECT_DATA,
                SIMCONNECT_RECV_SIMOBJECT_DATA,
                SimObjectData
            ),
            (
                SIMCONNECT_RECV_ID_SIMCONNECT_RECV_ID_CLIENT_DATA,
                SIMCONNECT_RECV_CLIENT_DATA,
                ClientData
            ),
        );
    };
}

extern "C" fn dispatch_cb(
    recv: *mut sys::SIMCONNECT_RECV,
    _cb_data: sys::DWORD,
    p_context: *mut std::ffi::c_void,
) {
    macro_rules! recv_cb {
        ($( ($ID:ident, $T:ident, $E:ident), )*) => {
            unsafe {
                match (*recv).dwID as sys::SIMCONNECT_RECV_ID {
                    sys::SIMCONNECT_RECV_ID_SIMCONNECT_RECV_ID_NULL => Some(SimConnectRecv::Null),
                    $(
                        sys::$ID => Some(SimConnectRecv::$E(&*(recv as *mut sys::$T))),
                    )*
                    sys::SIMCONNECT_RECV_ID_SIMCONNECT_RECV_ID_SIMOBJECT_DATA_BYTYPE => {
                        Some(SimConnectRecv::SimObjectData(&*(recv as *mut sys::SIMCONNECT_RECV_SIMOBJECT_DATA)))
                    }
                    _ => None,
                }
            }
        }
    }
    let recv = recv!(recv_cb);

    if let Some(recv) = recv {
        let sim = unsafe { &mut *(p_context as *mut SimConnect) };
        (sim.callback)(unsafe { &mut *(p_context as *mut SimConnect) }, recv);
    }
}

macro_rules! recv_enum {
    ($( ($ID:ident, $T:ident, $E:ident), )*) => {
        /// Message received from SimConnect.
        #[derive(Debug)]
        pub enum SimConnectRecv<'a> {
            Null,
            $(
                $E(&'a sys::$T),
            )*
        }
    }
}
recv!(recv_enum);

impl sys::SIMCONNECT_RECV_EVENT {
    /// The ID for this event.
    pub fn id(&self) -> sys::DWORD {
        self.uEventID
    }

    /// The data for this event.
    pub fn data(&self) -> sys::DWORD {
        self.dwData
    }
}

impl sys::SIMCONNECT_RECV_SIMOBJECT_DATA {
    /// The ID for this data.
    pub fn id(&self) -> sys::DWORD {
        self.dwRequestID
    }

    /// Convert a SimObjectData event into the data it contains.
    pub fn into<T: DataDefinition>(&self, sim: &SimConnect) -> Option<&T> {
        let define_id = sim.data_definitions[&TypeId::of::<T>()];
        if define_id == self.dwDefineID {
            Some(unsafe { &*(&self.dwData as *const sys::DWORD as *const T) })
        } else {
            None
        }
    }
}

impl sys::SIMCONNECT_RECV_CLIENT_DATA {
    /// The ID for this data.
    pub fn id(&self) -> sys::DWORD {
        self._base.dwRequestID
    }

    /// Convert a ClientData event into the data it contains.
    pub fn into<T: ClientDataDefinition>(&self, sim: &SimConnect) -> Option<&T> {
        let define_id = sim.client_data_definitions[&TypeId::of::<T>()];
        if define_id == self._base.dwDefineID {
            Some(unsafe { &*(&self._base.dwData as *const sys::DWORD as *const T) })
        } else {
            None
        }
    }
}

/// Specify how often data is to be sent to the client.
#[derive(Debug)]
pub enum Period {
    /// Specifies that the data is not to be sent
    Never = sys::SIMCONNECT_PERIOD_SIMCONNECT_PERIOD_NEVER as isize,
    /// Specifies that the data should be sent once only. Note that this is not
    /// an efficient way of receiving data frequently, use one of the other
    /// periods if there is a regular frequency to the data request.
    Once = sys::SIMCONNECT_PERIOD_SIMCONNECT_PERIOD_ONCE as isize,
    /// Specifies that the data should be sent every visual (rendered) frame.
    VisualFrame = sys::SIMCONNECT_PERIOD_SIMCONNECT_PERIOD_VISUAL_FRAME as isize,
    /// Specifies that the data should be sent every simulated frame, whether that frame is
    /// rendered or not.
    SimFrame = sys::SIMCONNECT_PERIOD_SIMCONNECT_PERIOD_SIM_FRAME as isize,
    /// Specifies that the data should be sent once every second.
    Second = sys::SIMCONNECT_PERIOD_SIMCONNECT_PERIOD_SECOND as isize,
}

/// An allocated client data memory region. Dropping this struct will not
/// deallocate the memory which has been allocated in the sim.
pub struct ClientDataArea<T: ClientDataDefinition> {
    client_id: sys::SIMCONNECT_CLIENT_DATA_ID,
    phantom: std::marker::PhantomData<T>,
}
