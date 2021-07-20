#![allow(clippy::all)]
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(dead_code)]
#![allow(safe_packed_borrows)]
include!(concat!(env!("OUT_DIR"), "/msfs-sys.rs"));

// https://github.com/rustwasm/team/issues/291
extern "C" {
    pub fn nvgStrokeColor(ctx: *mut NVGcontext, color: *const NVGcolor);
    pub fn nvgStrokePaint(ctx: *mut NVGcontext, paint: *const NVGpaint);
    pub fn nvgFillColor(ctx: *mut NVGcontext, color: *const NVGcolor);
    pub fn nvgFillPaint(ctx: *mut NVGcontext, paint: *const NVGpaint);
}
