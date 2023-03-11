pub mod common;
pub mod smart_vaults;
pub mod smart_wallets;
pub mod utils;

// for the candid file creation
use crate::common::error::SmartVaultErr;
use crate::common::user::User;

use crate::smart_vaults::secret::{SecretForCreation,SecretForUpdate, Secret};
use crate::smart_vaults::user_vault::UserVault;

#[ic_cdk_macros::init]
fn init() {}

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
