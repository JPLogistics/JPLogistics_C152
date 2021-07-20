//! Bindings to the Legacy/gauges.h API

use crate::sys;

#[doc(hidden)]
pub trait SimVarF64 {
    fn to(self) -> f64;
    fn from(v: f64) -> Self;
}

impl SimVarF64 for f64 {
    fn to(self) -> f64 {
        self
    }

    fn from(v: f64) -> Self {
        v
    }
}

impl SimVarF64 for bool {
    fn to(self) -> f64 {
        if self {
            1.0
        } else {
            0.0
        }
    }

    fn from(v: f64) -> Self {
        v != 0.0
    }
}

impl SimVarF64 for u8 {
    fn to(self) -> f64 {
        self as f64
    }

    fn from(v: f64) -> Self {
        v as Self
    }
}

/// aircraft_varget
/// get_aircraft_var_enum
#[derive(Debug)]
pub struct AircraftVariable {
    simvar: sys::ENUM,
    units: sys::ENUM,
    index: sys::SINT32,
}
impl AircraftVariable {
    pub fn from(name: &str, units: &str, index: usize) -> Result<Self, Box<dyn std::error::Error>> {
        let name = std::ffi::CString::new(name).unwrap();
        let units = std::ffi::CString::new(units).unwrap();

        let simvar = unsafe { sys::get_aircraft_var_enum(name.as_ptr()) };
        if simvar == -1 {
            return Err(Box::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                "invalid name",
            )));
        }

        let units = unsafe { sys::get_units_enum(units.as_ptr()) };
        if units == -1 {
            return Err(Box::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                "invalid units",
            )));
        }
        Ok(Self {
            simvar,
            units,
            index: index as sys::SINT32,
        })
    }

    pub fn get<T: SimVarF64>(&self) -> T {
        let v = unsafe { sys::aircraft_varget(self.simvar, self.units, self.index) };
        T::from(v)
    }
}

/// register_named_variable
/// set_named_variable_typed_value
/// get_named_variable_value
/// set_named_variable_value
#[derive(Debug)]
pub struct NamedVariable(sys::ID);
impl NamedVariable {
    pub fn from(name: &str) -> Self {
        Self(unsafe {
            let name = std::ffi::CString::new(name).unwrap();
            sys::register_named_variable(name.as_ptr())
        })
    }

    pub fn get_value<T: SimVarF64>(&self) -> T {
        let v = unsafe { sys::get_named_variable_value(self.0) };
        T::from(v)
    }

    pub fn set_value(&self, v: impl SimVarF64) {
        let v = v.to();
        unsafe { sys::set_named_variable_value(self.0, v) }
    }
}

/// trigger_key_event
pub fn trigger_key_event(event_id: sys::ID32, value: sys::UINT32) {
    unsafe {
        sys::trigger_key_event(event_id, value);
    }
}

#[doc(hidden)]
pub trait ExecuteCalculatorCodeImpl {
    fn execute(code: &std::ffi::CStr) -> Option<Self>
    where
        Self: Sized;
}

#[doc(hidden)]
impl ExecuteCalculatorCodeImpl for f64 {
    fn execute(code: &std::ffi::CStr) -> Option<Self> {
        unsafe {
            let mut n = 0.0;
            if sys::execute_calculator_code(
                code.as_ptr(),
                &mut n,
                std::ptr::null_mut(),
                std::ptr::null_mut(),
            ) == 1
            {
                Some(n)
            } else {
                None
            }
        }
    }
}

#[doc(hidden)]
impl ExecuteCalculatorCodeImpl for i32 {
    fn execute(code: &std::ffi::CStr) -> Option<Self> {
        unsafe {
            let mut n = 0;
            if sys::execute_calculator_code(
                code.as_ptr(),
                std::ptr::null_mut(),
                &mut n,
                std::ptr::null_mut(),
            ) == 1
            {
                Some(n)
            } else {
                None
            }
        }
    }
}

#[doc(hidden)]
impl ExecuteCalculatorCodeImpl for String {
    fn execute(code: &std::ffi::CStr) -> Option<Self> {
        unsafe {
            let mut s = std::ptr::null();
            if sys::execute_calculator_code(
                code.as_ptr(),
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                &mut s,
            ) == 1
            {
                Some(std::ffi::CStr::from_ptr(s).to_str().unwrap().to_owned())
            } else {
                None
            }
        }
    }
}

#[doc(hidden)]
impl ExecuteCalculatorCodeImpl for () {
    fn execute(code: &std::ffi::CStr) -> Option<Self> {
        unsafe {
            if sys::execute_calculator_code(
                code.as_ptr(),
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                std::ptr::null_mut(),
            ) == 1
            {
                Some(())
            } else {
                None
            }
        }
    }
}

/// execute_calculator_code
pub fn execute_calculator_code<T: ExecuteCalculatorCodeImpl>(code: &str) -> Option<T> {
    let code = std::ffi::CString::new(code).unwrap();
    ExecuteCalculatorCodeImpl::execute(code.as_c_str())
}

/// Holds compiled calculator code, wraps `gauge_calculator_code_precompile`.
#[derive(Debug)]
pub struct CompiledCalculatorCode {
    p_compiled: sys::PCSTRINGZ,
    _p_compiled_size: sys::UINT32,
}

impl CompiledCalculatorCode {
    /// Create a new CompiledCalculatorCode instance.
    pub fn new(code: &str) -> Option<Self> {
        let mut p_compiled = std::mem::MaybeUninit::uninit();
        let mut p_compiled_size = std::mem::MaybeUninit::uninit();
        unsafe {
            let code = std::ffi::CString::new(code).unwrap();
            if sys::gauge_calculator_code_precompile(
                p_compiled.as_mut_ptr(),
                p_compiled_size.as_mut_ptr(),
                code.as_ptr(),
            ) != 0
            {
                Some(CompiledCalculatorCode {
                    p_compiled: p_compiled.assume_init(),
                    _p_compiled_size: p_compiled_size.assume_init(),
                })
            } else {
                None
            }
        }
    }

    /// Execute this CompiledCalculatorCode instance.
    pub fn execute<T: ExecuteCalculatorCodeImpl>(&self) -> Option<T> {
        ExecuteCalculatorCodeImpl::execute(unsafe { std::ffi::CStr::from_ptr(self.p_compiled) })
    }
}
