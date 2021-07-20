extern crate proc_macro;
use proc_macro::TokenStream;
use quote::{format_ident, quote};
use std::collections::HashMap;
use syn::{
    parse::{Parse, ParseStream, Result as SynResult},
    parse_macro_input, Expr, Ident, ItemFn, ItemStruct, Lit, Meta, Token, Type,
};

mod sys {
    include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
}

/// Declare a standalone module.
/// ```rs
/// #[standalone_module]
/// async fn module(mut module: msfs::StandaloneModule) -> Result<(), Box<dyn std::error::Error>> {
///   while let Some(event) = module.next_event().await {
///     // ...
///   }
/// }
/// ```
#[proc_macro_attribute]
pub fn standalone_module(_args: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as ItemFn);

    let rusty_name = input.sig.ident.clone();
    let executor_name = format_ident!(
        "{}_executor_do_not_use_or_you_will_be_fired",
        input.sig.ident
    );

    let output = quote! {
        #input

        #[allow(non_upper_case_globals)]
        static mut #executor_name: ::msfs::StandaloneModuleExecutor = ::msfs::StandaloneModuleExecutor {
            executor: ::msfs::executor::Executor {
                handle: |m| std::boxed::Box::pin(#rusty_name(m)),
                future: None,
                tx: None,
            },
        };

        #[no_mangle]
        pub extern "C" fn module_init() {
            unsafe {
                #executor_name.handle_init();
            }
        }

        #[no_mangle]
        pub extern "C" fn module_deinit() {
            unsafe {
                #executor_name.handle_deinit();
            }
        }
    };

    TokenStream::from(output)
}

struct GaugeArgs {
    name: Option<String>,
}

impl Parse for GaugeArgs {
    fn parse(input: ParseStream) -> SynResult<Self> {
        match input.parse::<Ident>() {
            Ok(i) if i == "name" => {
                input.parse::<Token![=]>()?;
                Ok(GaugeArgs {
                    name: Some(input.parse::<Ident>()?.to_string()),
                })
            }
            _ => Ok(GaugeArgs { name: None }),
        }
    }
}

/// Declare a gauge callback. It will be automatically exported with the name
/// `NAME_gauge_callback`, where `NAME` is the name of the decorated function.
/// ```rs
/// use futures::stream::{Stream, StreamExt};
/// // Declare and export `FOO_gauge_callback`
/// #[msfs::gauge]
/// async fn FOO(mut gauge: msfs::Gauge) -> Result<(), Box<dyn std::error::Error>> {
///   while let Some(event) = gauge.next_event().await {
///     // ...
///   }
/// }
/// ```
///
/// The macro can also be given a parameter, `name`, to rename the exported function.
/// ```rs
/// // Declare and export `FOO_gauge_callback`
/// #[msfs::gauge(name=FOO)]
/// async fn xyz(...) {}
#[proc_macro_attribute]
pub fn gauge(args: TokenStream, item: TokenStream) -> TokenStream {
    let args = parse_macro_input!(args as GaugeArgs);
    let input = parse_macro_input!(item as ItemFn);

    let rusty_name = input.sig.ident.clone();
    let executor_name = format_ident!(
        "{}_executor_do_not_use_or_you_will_be_fired",
        input.sig.ident
    );

    let extern_name = args.name.unwrap_or_else(|| input.sig.ident.to_string());
    let extern_gauge_name = format_ident!("{}_gauge_callback", extern_name);
    let extern_mouse_name = format_ident!("{}_mouse_callback", extern_name);

    let output = quote! {
        #input

        #[allow(non_upper_case_globals)]
        static mut #executor_name: ::msfs::GaugeExecutor = ::msfs::GaugeExecutor {
            fs_ctx: None,
            executor: ::msfs::executor::Executor {
                handle: |gauge| std::boxed::Box::pin(#rusty_name(gauge)),
                tx: None,
                future: None,
            },
        };

        #[no_mangle]
        pub extern "C" fn #extern_gauge_name(
            ctx: ::msfs::sys::FsContext,
            service_id: std::os::raw::c_int,
            p_data: *mut std::os::raw::c_void,
        ) -> bool {
            unsafe {
                #executor_name.handle_gauge(ctx, service_id, p_data)
            }
        }

        #[no_mangle]
        pub extern "C" fn #extern_mouse_name(
            fx: std::os::raw::c_float,
            fy: std::os::raw::c_float,
            i_flags: std::os::raw::c_uint,
        ) {
             unsafe {
                #executor_name.handle_mouse(fx, fy, i_flags);
             }
         }
    };

    TokenStream::from(output)
}

fn parse_struct_fields(
    input: &mut ItemStruct,
    attributes: &[&str],
    get_type: Option<fn(&str) -> &str>,
) -> Vec<HashMap<String, String>> {
    let mut data = Vec::new();

    for (i, field) in &mut input.fields.iter_mut().enumerate() {
        let mut meta = HashMap::new();

        meta.insert(
            "field_name".to_string(),
            if let Some(ident) = &field.ident {
                ident.to_string()
            } else {
                i.to_string()
            },
        );

        if let Some(get_type) = get_type {
            let ty = match &field.ty {
                Type::Path(p) => p.path.get_ident().unwrap().to_string(),
                _ => panic!("Unsupported type"),
            };

            meta.insert("type".to_string(), get_type(ty.as_str()).to_string());
        } else {
            let t = &field.ty;
            meta.insert("type".to_string(), quote!(#t).to_string());
        }

        let mut attrs = Vec::new();
        for a in &field.attrs {
            let simish = if let Some(i) = a.path.get_ident() {
                attributes.contains(&i.to_string().as_str())
            } else {
                false
            };
            if simish {
                let (name, value) = match a.parse_meta().unwrap() {
                    Meta::NameValue(mnv) => {
                        let name = mnv.path.get_ident().unwrap().to_string();
                        let value = match mnv.lit {
                            Lit::Str(s) => s.value(),
                            Lit::Float(f) => f.base10_digits().to_string(),
                            _ => panic!("argument must be a string or float"),
                        };
                        (name, value)
                    }
                    _ => panic!("attribute must be in for #[name = \"value\"]"),
                };

                meta.insert(name, value);
            } else {
                attrs.push(a.clone());
            }
        }
        field.attrs = attrs;

        data.push(meta);
    }

    data
}

/// Generate a struct which can be used with SimConnect's data definitions.
/// ```rs
/// #[sim_connect::data_definition]
/// struct ControlSurfaces {
///     #[name = "ELEVATOR POSITION"]
///     #[unit = "Position"]
///     elevator: f64,
///     #[name = "AILERON POSITION"]
///     #[unit = "Position"]
///     ailerons: f64,
///     #[name = "RUDDER POSITION"]
///     #[unit = "Position"]
///     rudder: f64,
/// }
///
/// sim.add_data_definition::<ControlSurfaces>();
/// ```
#[proc_macro_attribute]
pub fn sim_connect_data_definition(_args: TokenStream, item: TokenStream) -> TokenStream {
    let mut input = parse_macro_input!(item as ItemStruct);
    let name = input.ident.clone();

    let data = parse_struct_fields(
        &mut input,
        &["name", "unit", "epsilon"],
        Some(|ty| match ty {
            "bool" => "INT32",
            "i32" => "INT32",
            "i64" => "INT64",
            "f32" => "FLOAT32",
            "f64" => "FLOAT64",
            "DataXYZ" => "XYZ",
            _ => panic!("Unsupported type {}", ty),
        }),
    );

    let simvars = sys::get_simvars();

    let mut array = String::from("&[\n");
    for meta in data {
        let name = meta["name"].clone();
        let unit = meta.get("unit").unwrap_or_else(|| {
            simvars
                .get(&name)
                .unwrap_or_else(|| panic!("{} needs a #[unit] decorator", name))
        });

        let fallback = "0.0".to_string();
        let epsilon = meta.get("epsilon").unwrap_or(&fallback);

        let ty = meta["type"].clone();
        array += &format!(
            "  ({:?}, {:?}, {}, ::msfs::sys::SIMCONNECT_DATATYPE_SIMCONNECT_DATATYPE_{}),\n",
            name, unit, epsilon, ty
        );
    }
    array += "]";
    let array = syn::parse_str::<Expr>(&array).unwrap();

    let output = quote! {
        #[repr(C)]
        #input

        impl ::msfs::sim_connect::DataDefinition for #name {
            const DEFINITIONS: &'static [(&'static str, &'static str, f32, ::msfs::sys::SIMCONNECT_DATATYPE)] = #array;
        }
    };

    TokenStream::from(output)
}

/// Generate a struct which can be used with SimConnect's client data definitions.
/// ```rs
/// #[sim_connect::client_data_definition]
/// struct SomeData {
///     foo: u8,
///     bar: f64,
///     #[epsilon = 0.5]
///     baz: i8,
/// }
/// ```
#[proc_macro_attribute]
pub fn sim_connect_client_data_definition(_args: TokenStream, item: TokenStream) -> TokenStream {
    let mut input = parse_macro_input!(item as ItemStruct);
    let name = input.ident.clone();

    let data = parse_struct_fields(&mut input, &["epsilon"], None);

    let mut array = String::from("vec![\n");

    for meta in data {
        let fallback = "0.0".to_string();
        let epsilon = meta.get("epsilon").unwrap_or(&fallback);

        array += &format!(
            "    (unsafe {{
                     let uninit = std::mem::MaybeUninit::<{struct_name}>::uninit();
                     let base = uninit.as_ptr() as *const {struct_name};
                     let field = &((*base).{field_name}) as *const _;
                     (field as usize) - (base as usize)
                 }}, std::mem::size_of::<{type}>(), {epsilon}),
            ",
            struct_name=name, field_name=meta["field_name"], type=meta["type"], epsilon=epsilon,
        );
    }

    array += "]";

    let array = syn::parse_str::<Expr>(&array).unwrap();
    let output = quote! {
        #input

        impl ::msfs::sim_connect::ClientDataDefinition for #name {
            fn get_definitions() -> Vec<(usize, usize, f32)> { #array }
        }
    };

    TokenStream::from(output)
}
