use candid::candid_method;

pub mod common;
pub mod smart_vaults;
pub mod smart_wallets;
pub mod utils;

// for the candid file creation
use crate::common::user::UserID;
use crate::smart_vaults::secret::Secret;
use crate::smart_vaults::secret::SecretCategory;
use crate::smart_vaults::user_vault::UserVault;

#[ic_cdk_macros::init]
fn init() {}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn who_am_i() -> String {
    utils::caller::get_caller().to_string()
}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn what_time_is_it() -> u64 {
    utils::time::get_current_time()
}

#[ic_cdk_macros::update]
#[candid_method(update)]
async fn give_me_a_new_uuid() -> String {
    utils::random::get_new_uuid().await
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
