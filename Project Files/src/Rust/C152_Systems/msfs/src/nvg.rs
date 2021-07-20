//! NanoVG is small antialiased vector graphics rendering library with a lean
//! API modeled after the HTML5 Canvas API. It can be used to draw gauge
//! instruments in MSFS. See `Gauge::create_nanovg`.

use crate::sys;

type Result = std::result::Result<(), Box<dyn std::error::Error>>;

/// A NanoVG render context.
pub struct Context {
    ctx: *mut sys::NVGcontext,
}

impl Context {
    /// Create a NanoVG render context from an `FsContext`.
    pub fn create(fs_ctx: sys::FsContext) -> Option<Self> {
        let uninit = std::mem::MaybeUninit::<sys::NVGparams>::zeroed();
        let mut params = unsafe { uninit.assume_init() };
        params.userPtr = fs_ctx;
        params.edgeAntiAlias = 1;

        let ctx = unsafe { sys::nvgCreateInternal(&mut params) };
        if ctx.is_null() {
            None
        } else {
            Some(Self { ctx })
        }
    }

    /// Draw a frame.
    pub fn draw_frame<F: Fn(&Frame) -> Result>(&self, width: usize, height: usize, f: F) {
        unsafe {
            sys::nvgBeginFrame(self.ctx, width as f32, height as f32, 1.0);
        }

        let frame = Frame { ctx: self.ctx };

        match f(&frame) {
            Ok(()) => unsafe {
                sys::nvgEndFrame(self.ctx);
            },
            Err(_) => unsafe {
                sys::nvgCancelFrame(self.ctx);
            },
        }
    }

    /// NanoVG allows you to load .ttf files and use the font to render text.
    ///
    /// The appearance of the text can be defined by setting the current text style
    /// and by specifying the fill color. Common text and font settings such as
    /// font size, letter spacing and text align are supported. Font blur allows you
    /// to create simple text effects such as drop shadows.
    ///
    /// At render time the font face can be set based on the font handles or name.
    ///
    /// Font measure functions return values in local space, the calculations are
    /// carried in the same resolution as the final rendering. This is done because
    /// the text glyph positions are snapped to the nearest pixels sharp rendering.
    ///
    /// The local space means that values are not rotated or scale as per the current
    /// transformation. For example if you set font size to 12, which would mean that
    /// line height is 16, then regardless of the current scaling and rotation, the
    /// returned line height is always 16. Some measures may vary because of the scaling
    /// since aforementioned pixel snapping.
    ///
    /// While this may sound a little odd, the setup allows you to always render the
    /// same way regardless of scaling.
    ///
    /// Note: currently only solid color fill is supported for text.
    pub fn create_font(
        &self,
        name: &str,
        filename: &str,
    ) -> std::result::Result<Font, Box<dyn std::error::Error>> {
        let name = std::ffi::CString::new(name).unwrap();
        let filename = std::ffi::CString::new(filename).unwrap();
        let handle = unsafe { sys::nvgCreateFont(self.ctx, name.as_ptr(), filename.as_ptr()) };
        match handle {
            -1 => Err(Box::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                "unable to load font",
            ))),
            _ => Ok(Font { handle }),
        }
    }

    /// NanoVG allows you to load jpg, png, psd, tga, pic and gif files to be used for rendering.
    /// In addition you can upload your own image. The image loading is provided by stb_image.
    pub fn create_image(
        &self,
        filename: &str,
    ) -> std::result::Result<Image, Box<dyn std::error::Error>> {
        let filename = std::ffi::CString::new(filename).unwrap();
        let handle = unsafe { sys::nvgCreateImage(self.ctx, filename.as_ptr(), 0) };
        match handle {
            -1 => Err(Box::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                "unable to load image",
            ))),
            _ => Ok(Image {
                ctx: self.ctx,
                handle,
            }),
        }
    }
}

impl Drop for Context {
    fn drop(&mut self) {
        unsafe {
            sys::nvgDeleteInternal(self.ctx);
        }
    }
}

/// Methods to draw on a frame. See `Context::draw_frame`.
pub struct Frame {
    ctx: *mut sys::NVGcontext,
}

impl Frame {
    /// Draw a path.
    pub fn draw_path<F: Fn(&Path) -> Result>(&self, style: &Style, f: F) -> Result {
        unsafe {
            // sys::nvgSave(self.ctx);
            // sys::nvgReset(self.ctx);
            sys::nvgBeginPath(self.ctx);
        }

        if let Some(stroke) = &style.stroke {
            match stroke {
                PaintOrColor::Paint(p) => unsafe {
                    sys::nvgStrokePaint(self.ctx, &p.0);
                },
                PaintOrColor::Color(c) => unsafe {
                    sys::nvgStrokeColor(self.ctx, &c.0);
                },
            }
        }
        if let Some(fill) = &style.fill {
            match fill {
                PaintOrColor::Paint(p) => unsafe {
                    sys::nvgFillPaint(self.ctx, &p.0);
                },
                PaintOrColor::Color(c) => unsafe {
                    sys::nvgFillColor(self.ctx, &c.0);
                },
            }
        }

        let path = Path { ctx: self.ctx };
        let r = f(&path);

        if style.stroke.is_some() {
            unsafe {
                sys::nvgStroke(self.ctx);
            }
        }
        if style.fill.is_some() {
            unsafe {
                sys::nvgFill(self.ctx);
            }
        }

        /*
        unsafe {
            sys::nvgRestore(self.ctx);
        }
        */

        r
    }
}

/// A path.
pub struct Path {
    ctx: *mut sys::NVGcontext,
}

impl Path {
    /// Starts new sub-path with specified point as first point.
    pub fn move_to(&self, x: f32, y: f32) {
        unsafe {
            sys::nvgMoveTo(self.ctx, x, y);
        }
    }

    /// Adds line segment from the last point in the path to the specified point.
    pub fn line_to(&self, x: f32, y: f32) {
        unsafe {
            sys::nvgLineTo(self.ctx, x, y);
        }
    }

    /// Adds cubic bezier segment from last point in the path via two control points to the specified point.
    pub fn bezier_to(&self, c1x: f32, c1y: f32, c2x: f32, c2y: f32, x: f32, y: f32) {
        unsafe {
            sys::nvgBezierTo(self.ctx, c1x, c1y, c2x, c2y, x, y);
        }
    }

    /// Adds quadratic bezier segment from last point in the path via a control point to the
    /// specified point.
    pub fn quad_to(&self, cx: f32, cy: f32, x: f32, y: f32) {
        unsafe {
            sys::nvgQuadTo(self.ctx, cx, cy, x, y);
        }
    }

    /// Adds an arc segment at the corner defined by the last path point, and two specified points.
    pub fn arc_to(&self, x1: f32, y1: f32, x2: f32, y2: f32, radius: f32) {
        unsafe {
            sys::nvgArcTo(self.ctx, x1, y1, x2, y2, radius);
        }
    }

    /// Closes current sub-path with a line segment.
    pub fn close_path(&self) {
        unsafe {
            sys::nvgClosePath(self.ctx);
        }
    }

    /// Creates a new circle arc shaped sub-path. The arc center is at (`cx`,`cy`), the arc radius
    /// is `r`, and the arc is drawn from angle `a0` to `a1`, and swept in direction `dir`.
    /// Angles are in radians.
    pub fn arc(&self, cx: f32, cy: f32, r: f32, a0: f32, a1: f32, dir: Direction) {
        unsafe {
            sys::nvgArc(self.ctx, cx, cy, r, a0, a1, dir as i32);
        }
    }

    /// Creates a new oval arc shaped sub-path. The arc center is at (`cx`, `cy`), the arc radius
    /// is (`rx`, `ry`), and the arc is draw from angle a0 to a1, and swept in direction `dir`.
    #[allow(clippy::too_many_arguments)]
    pub fn elliptical_arc(
        &self,
        cx: f32,
        cy: f32,
        rx: f32,
        ry: f32,
        a0: f32,
        a1: f32,
        dir: Direction,
    ) {
        unsafe {
            sys::nvgEllipticalArc(self.ctx, cx, cy, rx, ry, a0, a1, dir as i32);
        }
    }

    /// Creates new rectangle shaped sub-path.
    pub fn rect(&self, x: f32, y: f32, w: f32, h: f32) {
        unsafe {
            sys::nvgRect(self.ctx, x, y, w, h);
        }
    }

    /// Creates a new rounded rectangle sub-path with rounded corners
    #[allow(clippy::many_single_char_names)]
    pub fn rounded_rect(&self, x: f32, y: f32, w: f32, h: f32, r: f32) {
        unsafe {
            sys::nvgRoundedRect(self.ctx, x, y, w, h, r);
        }
    }

    /// Creates new rounded rectangle shaped sub-path with varying radii for each corner.
    #[allow(clippy::too_many_arguments)]
    #[allow(clippy::many_single_char_names)]
    pub fn rounded_rect_varying(
        &self,
        x: f32,
        y: f32,
        w: f32,
        h: f32,
        rad_top_left: f32,
        rad_top_right: f32,
        rad_bottom_right: f32,
        rad_bottom_left: f32,
    ) {
        unsafe {
            sys::nvgRoundedRectVarying(
                self.ctx,
                x,
                y,
                w,
                h,
                rad_top_left,
                rad_top_right,
                rad_bottom_right,
                rad_bottom_left,
            );
        }
    }

    /// Creates a new ellipse shaped sub-path.
    pub fn ellipse(&self, cx: f32, cy: f32, rx: f32, ry: f32) {
        unsafe {
            sys::nvgEllipse(self.ctx, cx, cy, rx, ry);
        }
    }

    /// Creates a new circle shaped path.
    pub fn circle(&self, cx: f32, cy: f32, r: f32) {
        unsafe {
            sys::nvgCircle(self.ctx, cx, cy, r);
        }
    }

    // TODO: fill
}

/// Winding direction
#[derive(Debug)]
#[repr(u32)]
pub enum Direction {
    /// Winding for holes.
    Clockwise = sys::NVGwinding_NVG_CW,
    /// Winding for solid shapes.
    CounterClockwise = sys::NVGwinding_NVG_CCW,
}

#[derive(Debug)]
#[doc(hidden)]
pub enum PaintOrColor {
    Paint(Paint),
    Color(Color),
}

impl From<Paint> for PaintOrColor {
    fn from(p: Paint) -> PaintOrColor {
        PaintOrColor::Paint(p)
    }
}

impl From<Color> for PaintOrColor {
    fn from(c: Color) -> PaintOrColor {
        PaintOrColor::Color(c)
    }
}

/// The stroke and/or fill which will be applied to a path.
#[derive(Debug, Default)]
pub struct Style {
    stroke: Option<PaintOrColor>,
    fill: Option<PaintOrColor>,
}

impl Style {
    /// Set the stroke of this style.
    pub fn stroke<T: Into<PaintOrColor>>(mut self, stroke: T) -> Self {
        self.stroke = Some(stroke.into());
        self
    }

    /// Set the fill of this style.
    pub fn fill<T: Into<PaintOrColor>>(mut self, fill: T) -> Self {
        self.fill = Some(fill.into());
        self
    }
}

/// Colors in NanoVG are stored as unsigned ints in ABGR format.
#[derive(Debug)]
pub struct Color(sys::NVGcolor);

impl Color {
    /// Returns a color value from red, green, blue values. Alpha will be set to 255 (1.0).
    pub fn from_rgb(r: u8, g: u8, b: u8) -> Self {
        Self(unsafe { sys::nvgRGB(r, g, b) })
    }

    /// Returns a color value from red, green, blue values. Alpha will be set to 1.0f.
    pub fn from_rgbf(r: f32, g: f32, b: f32) -> Self {
        Self(unsafe { sys::nvgRGBf(r, g, b) })
    }

    /// Returns a color value from red, green, blue and alpha values.
    pub fn from_rgba(r: u8, g: u8, b: u8, a: u8) -> Self {
        Self(unsafe { sys::nvgRGBA(r, g, b, a) })
    }

    /// Returns a color value from red, green, blue values. Alpha will be set to 1.0f.
    pub fn from_rgbaf(r: f32, g: f32, b: f32, a: f32) -> Self {
        Self(unsafe { sys::nvgRGBAf(r, g, b, a) })
    }

    /// Returns color value specified by hue, saturation and lightness.
    /// HSL values are all in range [0..1], alpha will be set to 255.
    pub fn from_hsv(h: f32, s: f32, l: f32) -> Self {
        Self(unsafe { sys::nvgHSL(h, s, l) })
    }

    /// Returns color value specified by hue, saturation and lightness.
    /// HSL values are all in range [0..1], alpha will be set to 255.
    pub fn from_hsva(h: f32, s: f32, l: f32, a: u8) -> Self {
        Self(unsafe { sys::nvgHSLA(h, s, l, a) })
    }
}

/// NanoVG supports four types of paints: linear gradient, box gradient, radial gradient and image pattern.
/// These can be used as paints for strokes and fills.
#[derive(Debug)]
pub struct Paint(sys::NVGpaint);

impl Paint {
    /// Creates and returns an image pattern. Parameters (`x`, `y`) specify the left-top location of the image pattern,
    /// (`w`, `h`) is the size of the image, `angle` is the rotation around the top-left corner, and `image` is the image
    /// to render.
    pub fn from_image(
        image: &Image,
        x: f32,
        y: f32,
        w: f32,
        h: f32,
        angle: f32,
        alpha: f32,
    ) -> Paint {
        Paint(unsafe { sys::nvgImagePattern(image.ctx, x, y, w, h, angle, image.handle, alpha) })
    }
}

/// A font handle.
pub struct Font {
    handle: std::os::raw::c_int,
}

/// An image handle.
pub struct Image {
    ctx: *mut sys::NVGcontext,
    handle: std::os::raw::c_int,
}

impl Image {
    /// Returns the dimensions of a created image.
    pub fn size(&self) -> (usize, usize) {
        let mut w = 0;
        let mut h = 0;
        unsafe {
            sys::nvgImageSize(self.ctx, self.handle, &mut w, &mut h);
        }
        (w as usize, h as usize)
    }
}

impl Drop for Image {
    fn drop(&mut self) {
        unsafe {
            sys::nvgDeleteImage(self.ctx, self.handle);
        }
    }
}
