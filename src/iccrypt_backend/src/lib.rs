pub mod common;
pub mod smart_vaults;
pub mod smart_wallets;
pub mod utils;

// for the candid file creation
use crate::common::error::SmartVaultErr;
use crate::common::user::User;
use crate::smart_vaults::key_manager::TestamentKeyDerviationArgs;
use crate::smart_vaults::secret::SecretID;
use crate::smart_vaults::secret::SecretListEntry;
use crate::smart_vaults::secret::SecretSymmetricCryptoMaterial;
use crate::smart_vaults::testament::AddTestamentArgs;
use crate::smart_vaults::testament::Testament;
use candid::candid_method;

use crate::smart_vaults::secret::{AddSecretArgs, Secret};

#[ic_cdk_macros::init]
fn init() {}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn who_am_i() -> String {
    format!("Hey. You are: {}", utils::caller::get_caller())
}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn what_time_is_it() -> u64 {
    utils::time::get_current_time()
}

candid::export_service!();

#[cfg(test)]
mod tests {
    use crate::__export_service;

    #[test]
    fn get_candid() {
        println!("####### Candid START #######");
        println!();
        std::println!("{}", __export_service());
        println!();
        println!("####### Candid END #######");
    }
}
