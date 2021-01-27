#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;

mod api;
mod cors;
mod db;
mod ebird;
mod models;
mod queries;

use rocket_contrib::serve::StaticFiles;
use std::process;

use structopt::clap::AppSettings::{ColorAlways, ColoredHelp, DeriveDisplayOrder};
use structopt::StructOpt;

#[derive(StructOpt)]
#[structopt(
    name = "sylph",
    setting(ColorAlways),
    setting(ColoredHelp),
    setting(DeriveDisplayOrder)
)]
struct Opt {
    #[structopt(long, name = "EBIRD_REGION_CODE")]
    fetch_ebird_hotspots: Option<String>,

    #[structopt(long)]
    fetch_ebird_hotspot_species: bool,

    #[structopt(long)]
    fetch_ebird_species: bool,

    #[structopt(long)]
    load_ebird_hotspots: bool,

    #[structopt(long)]
    load_ebird_species: bool,

    #[structopt(long)]
    load_ebird_hotspot_species: bool,
}

fn main() -> std::io::Result<()> {
    let opt = Opt::from_args();
    if let Some(region) = opt.fetch_ebird_hotspots {
        process::exit(ebird::fetch::fetch_hotspots(region)?)
    } else if opt.fetch_ebird_hotspot_species {
        process::exit(ebird::fetch::fetch_hotspot_species()?)
    } else if opt.fetch_ebird_species {
        process::exit(ebird::fetch::fetch_species()?)
    } else if opt.load_ebird_hotspots {
        process::exit(ebird::load::load_hotspots()?)
    } else if opt.load_ebird_hotspot_species {
        process::exit(ebird::load::load_hotspot_species()?)
    } else if opt.load_ebird_species {
        process::exit(ebird::load::load_species()?)
    } else {
        rocket::ignite()
            .mount(
                "/api",
                routes![api::guides, api::ebird_hotspots, api::sites, api::trips],
            )
            .mount("/", StaticFiles::from("ui/dist"))
            .attach(cors::CORS())
            .launch();
    }
    Ok(())
}
