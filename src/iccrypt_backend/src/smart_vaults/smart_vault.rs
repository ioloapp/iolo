use std::cell::RefCell;
use std::collections::BTreeMap;

use candid::candid_method;
use ic_cdk::{post_upgrade, pre_upgrade, storage};

use crate::common::user::{User, UserID};

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
pub fn create_new_user(owner: UserID) {
    // create the new user
    USER_REGISTRY.with(|ur: &RefCell<UserRegistry>| {
        let mut user_registry = ur.borrow_mut();
        user_registry.insert(owner, User::new(&owner));
    });

    // open a vault for the new user
    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.get_or_create_user_vault(&owner);
    });
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn delete_user(owner: UserID) {
    // delete the user vault
    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_vault(&owner);
    });

    // delete the user
    USER_REGISTRY.with(|ur: &RefCell<UserRegistry>| {
        let mut user_registry = ur.borrow_mut();
        user_registry.remove(&owner);
    });
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn is_user_vault_existing(owner: UserID) -> bool {
    MASTERVAULT.with(|mv: &RefCell<MasterVault>| mv.borrow_mut().is_user_vault_existing(&owner))
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_user_vault(owner: UserID) -> UserVault {
    MASTERVAULT
        .with(|mv: &RefCell<MasterVault>| mv.borrow_mut().get_or_create_user_vault(&owner).clone())
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn add_user_secret(owner: UserID, category: SecretCategory, name: String) {
    let new_secret = Secret::new(&owner, &category, &name).await;
    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.add_secret(&owner, &new_secret);
    });
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn update_user_secret(owner: UserID, secret: Secret) {
    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.update_secret(&owner, &secret);
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
