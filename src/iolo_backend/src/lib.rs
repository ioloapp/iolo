//! # iolo backend
//!
//! This is the iolo backend implementation. It contains all the types, modules and methods provided to the front-end.
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

/// Contains common types, modules and methods
pub mod common;
/// Contains types, modules and methods for Policies
pub mod policies;
/// Contains types, modules and methods for Secrets
pub mod secrets;
/// Contains types, modules and methods for Smart Vaults
pub mod smart_vaults;
/// Contains types, modules and methods for Users
pub mod users;
/// Contains shared utils like random generator, time and caller
pub mod utils;

#[ic_cdk_macros::init]
fn init() {}

export_candid!();
