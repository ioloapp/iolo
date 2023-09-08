use colored::*;

use std::env;

use anyhow::Ok;
use anyhow::Result;

use tests::div::test_utils;
use tests::encryption::test_encryption;
use tests::smart_vaults::test_smart_vaults;
use utils::dfx::cleanup;
use utils::dfx::upgrade_canister;

mod tests;
mod types;
mod utils;

#[tokio::main]
async fn main() -> Result<()> {
    let mut args = env::args();

    if args.len() < 2 {
        print_help_menu();
        return Ok(());
    }

    let c: &str = &args.nth(1).expect("no pattern given");

    match c {
        "deploy" => {
            cleanup()?;
        }
        "upgrade" => {
            let Some(canister) = args.nth(0) else {
                println!("\nPlease provide valid canister name: iccrypt_backend, iccrypt_frontend");
                return Ok(());
            };
            if canister == "iccrypt_backend" || canister == "iccrypt_frontend" {
                upgrade_canister(&canister)?;
            } else {
                println!("\nPlease provide valid canister name: iccrypt_backend, iccrypt_frontend");
            }

            return Ok(());
        }
        "utils" => {
            test_utils().await?;
        }
        "vetkd" => {
            test_encryption().await?;
        }
        "sv" => {
            test_smart_vaults().await?;
        }
        _ => {
            print_help_menu();
            return Ok(());
        }
    }
    return Ok(());
}

fn print_help_menu() {
    println!("\n{}:\n", "Commands".yellow().bold());
    println!(
        "   {}{} Cleanup the local replica and deploy everything from scratch",
        "deploy".green(),
        sh(6)
    );
    println!(
        "   {}{} Upgrade canister with CANISTER_NAME",
        "upgrade [CANISTER]".green(),
        sh(18)
    );
    println!("   {}{} Test Utils like time, etc.", "utils".green(), sh(5));
    println!(
        "   {}{} Test key vetkd functionalities",
        "vetkd".green(),
        sh(5)
    );
    println!(
        "   {}{} Test smart vault functionalities",
        "sm".green(),
        sh(2)
    );
}

fn sh(n: i32) -> String {
    let tab = 25;
    let mut res: String = String::from("");
    for _ in 1..(tab - n) {
        res.push(' ');
    }
    res
}
