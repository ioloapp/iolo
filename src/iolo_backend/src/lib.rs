//! # iolo backend
//!
//! This is the iolo backend implementation.
//!
use common::uuid::UUID;
use ic_cdk_macros::export_candid;

// for the candid file creation
use crate::common::error::SmartVaultErr;
use crate::policies::policy::AddPolicyArgs;
use crate::policies::policy::Policy;
use crate::policies::policy::PolicyID;
use crate::policies::policy::PolicyListEntry;
use crate::policies::policy::PolicyResponse;
use crate::secrets::secret::SecretID;
use crate::secrets::secret::SecretListEntry;
use crate::secrets::secret::SecretSymmetricCryptoMaterial;
use crate::smart_vaults::key_manager::PolicyKeyDerviationArgs;
use crate::users::contact::AddContactArgs;
use crate::users::contact::Contact;
use crate::users::user::AddOrUpdateUserArgs;
use crate::users::user::User;
use candid::Principal;

use crate::secrets::secret::{AddSecretArgs, Secret, UpdateSecretArgs};

pub mod common;
pub mod policies;
pub mod secrets;
pub mod smart_vaults;
pub mod user_vaults;
pub mod users;
pub mod utils;

#[ic_cdk_macros::init]
fn init() {}

// Generate did files
export_candid!();
