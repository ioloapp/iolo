#![allow(dead_code)]

use anyhow::Ok;
use anyhow::Result;

use utils::test_utils;
//use xshell::{cmd, Shell};

mod common;
mod utils;

#[tokio::main]
async fn main() -> Result<()> {
    test_utils().await?;
    Ok(())
}

async fn itest_smart_vaults() -> Result<()> {
    // TODO
    Ok(())
}
