pub mod common;
pub mod policies;
pub mod secrets;
pub mod smart_vaults;
pub mod user_vaults;
pub mod users;
pub mod utils;

use ic_cdk_macros::export_candid;

// for the candid file creation
use crate::common::error::SmartVaultErr;
use crate::policies::policy::AddTestamentArgs;
use crate::policies::policy::Policy;
use crate::policies::policy::PolicyID;
use crate::policies::policy::TestamentListEntry;
use crate::policies::policy::TestamentResponse;
use crate::secrets::secret::SecretID;
use crate::secrets::secret::SecretListEntry;
use crate::secrets::secret::SecretSymmetricCryptoMaterial;
use crate::smart_vaults::key_manager::TestamentKeyDerviationArgs;
use crate::users::user::AddUserArgs;
use crate::users::user::User;
use crate::utils::login_date_condition;
use candid::Principal;

use crate::secrets::secret::{AddSecretArgs, Secret};

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
