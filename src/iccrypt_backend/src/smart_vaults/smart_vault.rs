use std::cell::RefCell;
use std::collections::BTreeMap;

use candid::candid_method;
use ic_cdk::{post_upgrade, pre_upgrade, storage};

use crate::common::error::SmartVaultErr;
use crate::common::user::{User, UserID};
use crate::utils::caller::get_caller;

use super::master_vault::MasterVault;
use super::secret::{Secret, SecretCategory};
use super::user_vault::UserVault;

pub type UserRegistry = BTreeMap<UserID, User>;

thread_local! {
    // Master_vault holding all the user vaults
    static MASTERVAULT: RefCell<MasterVault> = RefCell::new(MasterVault::new());

    // User Registsry
    static USER_REGISTRY: RefCell<UserRegistry> = RefCell::new(UserRegistry::new());
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn create_user() -> Result<User, SmartVaultErr> {
    let principal = get_caller();
    let new_user = User::new(&principal);
    if let Some(_) = USER_REGISTRY.with(|ur: &RefCell<UserRegistry>| {
        let mut user_registry = ur.borrow_mut();
        user_registry.insert(principal, new_user.clone())
    }) {
        // The user already exists
        return Err(SmartVaultErr::UserAlreadyExists(principal.to_string()));
    }

    // Let's create a vault for the user
    MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<(), SmartVaultErr> {
        let mut master_vault = ms.borrow_mut();
        master_vault.create_user_vault(&principal)?;
        Ok(())
    })?;

    Ok(new_user)
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_user_vault() -> Option<UserVault> {
    let principal = get_caller();
    MASTERVAULT
        .with(|mv: &RefCell<MasterVault>| mv.borrow_mut().get_user_vault(&principal).cloned())
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn is_user_vault_existing() -> bool {
    let principal = get_caller();
    MASTERVAULT.with(|mv: &RefCell<MasterVault>| mv.borrow().is_user_vault_existing(&principal))
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn delete_user() {
    let principal = get_caller();
    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_vault(&principal);
    });

    // delete the user
    USER_REGISTRY.with(|ur: &RefCell<UserRegistry>| {
        let mut user_registry = ur.borrow_mut();
        user_registry.remove(&principal);
    });
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn add_user_secret(category: SecretCategory, name: String) {
    let principal = get_caller();
    let new_secret = Secret::new(&category, &name).await;
    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.add_secret(&principal, &new_secret);
    });
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn update_user_secret(secret: Secret) {
    let principal = get_caller();
    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.update_secret(&principal, &secret);
    });
}

#[pre_upgrade]
fn pre_upgrade() {
    MASTERVAULT.with(|ms| storage::stable_save((ms,)).unwrap());
    USER_REGISTRY.with(|ur| storage::stable_save((ur,)).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (old_ms,): (MasterVault,) = storage::stable_restore().unwrap();
    MASTERVAULT.with(|ms| *ms.borrow_mut() = old_ms);

    let (old_ur,): (UserRegistry,) = storage::stable_restore().unwrap();
    USER_REGISTRY.with(|ur| *ur.borrow_mut() = old_ur);
}
