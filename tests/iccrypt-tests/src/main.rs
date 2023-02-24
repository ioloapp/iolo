#![allow(dead_code)]

use anyhow::Ok;
use anyhow::Result;

use args::Arguments;
use clap::Parser;
use common::cleanup;
use key_derivation::test_key_derivation;
use smart_vaults::test_smart_vaults;
use utils::test_utils;

use crate::common::upgrade_canister;

//use xshell::{cmd, Shell};

mod args;
mod common;
mod key_derivation;
mod smart_vaults;
mod utils;

#[tokio::main]
async fn main() -> Result<()> {
    // test_utils().await?;
    // test_smart_vaults().await?;
    // test_key_derivation().await?;

    let args = Arguments::parse();

    // dbg!(&args);

    if args.clean {
        // reinstall erverything
        cleanup();
    }

    if let Some(canister) = args.upgrade {
        upgrade_canister(canister);
    }

    // println!("Hello {}!", args.name.unwrap());

    Ok(())
}
