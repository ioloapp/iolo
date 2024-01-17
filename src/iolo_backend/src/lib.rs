use ic_cdk_macros::export_candid;

// for the candid file creation
use crate::common::error::SmartVaultErr;

pub mod common;
pub mod policies;
pub mod secrets;
pub mod smart_vaults;
pub mod user_vaults;
pub mod users;
pub mod utils;

#[ic_cdk_macros::init]
fn init() {

    // initialize the timers for triggering the login date condition
    //login_date_condition::init_condition();
}

#[ic_cdk_macros::query]
fn who_am_i() -> String {
    format!("Hey. You are: {}", utils::caller::get_caller())
}

#[ic_cdk_macros::query]
fn what_time_is_it() -> u64 {
    utils::time::get_current_time()
}

// Generate did files
export_candid!();
