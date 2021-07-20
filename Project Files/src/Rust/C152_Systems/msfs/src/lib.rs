//! # msfs-rs
//!
//! These bindings include:
//!
//! - MSFS Gauge API
//! - SimConnect API
//! - NanoVG API
//!
//! ## Building
//!
//! Tools such as `cargo-wasi` may not work. When in doubt, try invoking
//! `cargo build --target wasm32-wasi` directly.
//!
//! If your MSFS SDK is not installed to `C:\MSFS SDK` you will need to set the
//! `MSFS_SDK` env variable to the correct path.
//!
//! ## Known Issues and Work-Arounds
//!
//! ### Missing various exports
//! Add a local `.cargo/config.toml` file with the following settings:
//! ```toml
//! [target.wasm32-wasi]
//! rustflags = [
//!   "-Clink-arg=--export-table",
//!   "-Clink-arg=--export=malloc",
//!   "-Clink-arg=--export=free",
//! ]
//! ```

mod msfs;
pub mod sim_connect;
pub mod sys;

pub use msfs::*;

#[cfg(any(target_arch = "wasm32", doc))]
pub mod legacy;

#[cfg(any(target_arch = "wasm32", doc))]
pub mod nvg;

#[cfg(target_os = "wasi")]
#[no_mangle]
unsafe extern "C" fn __wasilibc_find_relpath(
    path: *const std::os::raw::c_char,
    relative_path: *mut *const std::os::raw::c_char,
) -> std::os::raw::c_int {
    static mut PREOPENS: Vec<(wasi::Fd, String)> = vec![];
    static mut PREOPENS_AVAILABLE: bool = false;
    static mut EMPTY: *const std::os::raw::c_char =
        b".\0" as *const u8 as *const std::os::raw::c_char;

    if !PREOPENS_AVAILABLE {
        PREOPENS_AVAILABLE = true;

        const START_FD: wasi::Fd = 3; // skip stdio 0,1,2
        for fd in START_FD.. {
            let mut prestat = std::mem::MaybeUninit::uninit();
            let r = wasi::wasi_snapshot_preview1::fd_prestat_get(fd, prestat.as_mut_ptr());
            if r == wasi::ERRNO_BADF {
                break;
            }
            assert!(r == wasi::ERRNO_SUCCESS);
            let prestat = prestat.assume_init();

            if prestat.tag == wasi::PREOPENTYPE_DIR {
                let mut prefix = Vec::new();
                prefix.resize(prestat.u.dir.pr_name_len, 0);
                let r = wasi::wasi_snapshot_preview1::fd_prestat_dir_name(
                    fd,
                    prefix.as_mut_ptr(),
                    prestat.u.dir.pr_name_len,
                );
                assert!(r == wasi::ERRNO_SUCCESS);
                PREOPENS.push((
                    fd,
                    std::ffi::CString::from_vec_unchecked(prefix)
                        .into_string()
                        .unwrap(),
                ));
            }
        }
    }

    let rust_path = std::ffi::CStr::from_ptr(path).to_str().unwrap();
    let mut best_len = 0;
    let mut fd: std::os::raw::c_int = -1;
    for (maybe_fd, prefix) in PREOPENS.iter().rev() {
        if (fd == -1 || prefix.len() > best_len) && rust_path.starts_with(prefix) {
            fd = *maybe_fd as std::os::raw::c_int;
            best_len = prefix.len();
        }
    }

    if fd != -1 {
        *relative_path = path.add(best_len);
        loop {
            if **relative_path == '\\' as i8 {
                *relative_path = (*relative_path).add(1);
            } else if **relative_path == '.' as i8 && *(*relative_path.add(1)) == '\\' as i8 {
                *relative_path = (*relative_path).add(2);
            } else {
                break;
            }
        }
        if **relative_path == 0 {
            *relative_path = EMPTY;
        }
    }

    fd
}

#[doc(hidden)]
pub mod executor;
