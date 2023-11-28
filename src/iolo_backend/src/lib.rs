pub mod common;
pub mod smart_vaults;
pub mod smart_wallets;
pub mod utils;

use ic_cdk_macros::export_candid;

// for the candid file creation
use crate::common::error::SmartVaultErr;
use crate::common::user::User;
use crate::smart_vaults::key_manager::TestamentKeyDerviationArgs;
use crate::smart_vaults::secret::SecretID;
use crate::smart_vaults::secret::SecretListEntry;
use crate::smart_vaults::secret::SecretSymmetricCryptoMaterial;
use crate::smart_vaults::testament::AddTestamentArgs;
use crate::smart_vaults::testament::Testament;
use crate::smart_vaults::testament::TestamentResponse;
use crate::smart_vaults::testament::TestamentID;
use crate::smart_vaults::testament::TestamentListEntry;
use crate::common::user::AddUserArgs;
use crate::utils::login_date_condition;
use candid::Principal;

use crate::smart_vaults::secret::{AddSecretArgs, Secret};

#[ic_cdk_macros::init]
fn init() {

    // initialize the timers for triggering the login date condition
    login_date_condition::init_condition();
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