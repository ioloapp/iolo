#![allow(dead_code)]

use anyhow::Ok;
use anyhow::Result;

use smart_vaults::test_smart_vaults;
use utils::test_utils;
//use xshell::{cmd, Shell};

mod common;
mod smart_vaults;
mod utils;

#[tokio::main]
async fn main() -> Result<()> {
    test_utils().await?;
    test_smart_vaults().await?;
    Ok(())
}
