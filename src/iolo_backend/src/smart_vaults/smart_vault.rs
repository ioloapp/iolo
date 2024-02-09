use std::cell::RefCell;

use candid::Principal;
use ic_cdk::{post_upgrade, pre_upgrade};

use crate::common::error::SmartVaultErr;

use crate::policies::policies_interface_impl::{
    add_policy_impl, confirm_x_out_of_y_condition_impl, get_policy_as_beneficiary_impl,
    get_policy_as_owner_impl, get_policy_list_as_beneficiary_impl, get_policy_list_as_owner_impl,
    get_policy_list_as_validator_impl, remove_policy_impl, update_policy_impl,
};
use crate::policies::policy::PolicyResponse;
use crate::policies::policy::{AddPolicyArgs, Policy, PolicyID, PolicyListEntry};
use crate::policies::policy_registries::PolicyRegistries;
use crate::policies::policy_store::PolicyStore;
use crate::secrets::secret::{AddSecretArgs, Secret, SecretID, SecretListEntry, UpdateSecretArgs};
use crate::secrets::secret_store::SecretStore;
use crate::secrets::secrets_interface_impl::{
    add_secret_impl, get_encrypted_symmetric_key_as_beneficiary_impl,
    get_encrypted_symmetric_key_impl, get_secret_as_beneficiary_impl, get_secret_impl,
    get_secret_list_impl, remove_secret_impl, update_secret_impl,
};

use crate::users::contact::{AddContactArgs, Contact};
use crate::users::user::{AddOrUpdateUserArgs, PrincipalID, User};
use crate::users::user_store::UserStore;
use crate::users::users_interface_impl::{
    add_contact_impl, create_user_impl, delete_user_impl, get_contact_list_impl,
    get_current_user_impl, remove_contact_impl, update_contact_impl, update_user_impl,
    update_user_login_date_impl,
};
use crate::utils::caller::get_caller;

thread_local! {
    /// User Store
    pub static USER_STORE: RefCell<UserStore> = RefCell::new(UserStore::new());

    /// Secret Store
    pub static SECRET_STORE: RefCell<SecretStore> = RefCell::new(SecretStore::new());

    /// Policy (fka Testament) Store
    pub static POLICY_STORE: RefCell<PolicyStore> = RefCell::new(PolicyStore::new());

    /// Policy Registry for beneficiaries and validators
    pub static POLICY_REGISTRIES: RefCell<PolicyRegistries> = RefCell::new(PolicyRegistries::new());
}

/// Creates a new user
#[ic_cdk_macros::update]
pub async fn create_user(args: AddOrUpdateUserArgs) -> Result<User, SmartVaultErr> {
    create_user_impl(args, &get_caller()).await
}

/// Gets the current user
#[ic_cdk_macros::query]
pub fn get_current_user() -> Result<User, SmartVaultErr> {
    get_current_user_impl(&get_caller())
}

#[ic_cdk_macros::update]
pub fn update_user(args: AddOrUpdateUserArgs) -> Result<User, SmartVaultErr> {
    update_user_impl(args, &get_caller())
}

#[ic_cdk_macros::update]
pub fn update_user_login_date() -> Result<User, SmartVaultErr> {
    update_user_login_date_impl(&get_caller())
}

#[ic_cdk_macros::update]
pub fn delete_user() -> Result<(), SmartVaultErr> {
    delete_user_impl(&get_caller())
}

#[ic_cdk_macros::update]
pub async fn add_secret(args: AddSecretArgs) -> Result<Secret, SmartVaultErr> {
    add_secret_impl(args, &get_caller()).await
}

#[ic_cdk_macros::query]
pub fn get_secret(sid: SecretID) -> Result<Secret, SmartVaultErr> {
    get_secret_impl(sid, &get_caller())
}

#[ic_cdk_macros::update]
pub fn update_secret(usa: UpdateSecretArgs) -> Result<Secret, SmartVaultErr> {
    update_secret_impl(usa, &get_caller())
}

#[ic_cdk_macros::update]
pub fn remove_secret(secret_id: String) -> Result<(), SmartVaultErr> {
    remove_secret_impl(secret_id, &get_caller())
}

#[ic_cdk_macros::query]
pub fn get_secret_list() -> Result<Vec<SecretListEntry>, SmartVaultErr> {
    get_secret_list_impl(&get_caller())
}

#[ic_cdk_macros::query]
pub fn get_encrypted_symmetric_key(sid: SecretID) -> Result<Vec<u8>, SmartVaultErr> {
    get_encrypted_symmetric_key_impl(sid, &get_caller())
}

#[ic_cdk_macros::query]
pub fn get_secret_as_beneficiary(
    sid: SecretID,
    policy_id: PolicyID,
) -> Result<Secret, SmartVaultErr> {
    get_secret_as_beneficiary_impl(sid, policy_id, &get_caller())
}

#[ic_cdk_macros::query]
pub fn get_encrypted_symmetric_key_as_beneficiary(
    secret_id: SecretID,
    policy_id: PolicyID,
) -> Result<Vec<u8>, SmartVaultErr> {
    get_encrypted_symmetric_key_as_beneficiary_impl(secret_id, policy_id, &get_caller())
}

/**
 * Policy CRUD
 */

#[ic_cdk_macros::update]
pub async fn add_policy(args: AddPolicyArgs) -> Result<Policy, SmartVaultErr> {
    add_policy_impl(args, &get_caller()).await
}

#[ic_cdk_macros::query]
pub fn get_policy_as_owner(policy_id: PolicyID) -> Result<PolicyResponse, SmartVaultErr> {
    get_policy_as_owner_impl(policy_id, &get_caller())
}

#[ic_cdk_macros::query]
pub fn get_policy_list_as_owner() -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    get_policy_list_as_owner_impl(&get_caller())
}

#[ic_cdk_macros::query]
pub fn get_policy_as_beneficiary(policy_id: PolicyID) -> Result<PolicyResponse, SmartVaultErr> {
    get_policy_as_beneficiary_impl(policy_id, &get_caller())
}

#[ic_cdk_macros::query]
pub fn get_policy_list_as_beneficiary() -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    get_policy_list_as_beneficiary_impl(&get_caller())
}

#[ic_cdk_macros::query]
pub fn get_policy_list_as_validator() -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    get_policy_list_as_validator_impl(&get_caller())
}

#[ic_cdk_macros::update]
pub fn update_policy(policy: Policy) -> Result<Policy, SmartVaultErr> {
    update_policy_impl(policy, &get_caller())
}

#[ic_cdk_macros::update]
pub fn remove_policy(policy_id: String) -> Result<(), SmartVaultErr> {
    remove_policy_impl(policy_id, &get_caller())
}

#[ic_cdk_macros::update]
pub fn confirm_x_out_of_y_condition(
    policy_owner: PrincipalID,
    policy_id: PolicyID,
    status: bool,
) -> Result<(), SmartVaultErr> {
    confirm_x_out_of_y_condition_impl(policy_owner, policy_id, status, &get_caller())
}

/**
 * Contact CRUD
 */
#[ic_cdk_macros::update]
pub fn add_contact(args: AddContactArgs) -> Result<(), SmartVaultErr> {
    add_contact_impl(args, &get_caller())
}

#[ic_cdk_macros::query]
pub fn get_contact_list() -> Result<Vec<Contact>, SmartVaultErr> {
    get_contact_list_impl(&get_caller())
}

#[ic_cdk_macros::update]
pub fn update_contact(c: Contact) -> Result<Contact, SmartVaultErr> {
    update_contact_impl(c, &get_caller())
}

#[ic_cdk_macros::update]
pub fn remove_contact(contact: Principal) -> Result<(), SmartVaultErr> {
    remove_contact_impl(contact.to_string(), &get_caller())
}

#[pre_upgrade]
fn pre_upgrade() {}

#[post_upgrade]
fn post_upgrade() {}

#[cfg(test)]
mod tests {}
