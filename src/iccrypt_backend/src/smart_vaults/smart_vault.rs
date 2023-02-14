use std::cell::RefCell;
use std::collections::BTreeMap;

use candid::candid_method;
use ic_cdk::{post_upgrade, pre_upgrade, storage};

use crate::common::user::{User, UserID};

use super::master_safe::MasterSafe;
use super::secret::{Secret, SecretCategory};
use super::user_safe::UserSafe;

pub type UserRegistry = BTreeMap<UserID, User>;

thread_local! {
    // Mastersafe holding all the user safes
    static MASTERSAFE: RefCell<MasterSafe> = RefCell::new(MasterSafe::new());

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

    // open a safe for the new user
    MASTERSAFE.with(|ms: &RefCell<MasterSafe>| {
        let mut master_safe = ms.borrow_mut();
        master_safe.get_or_create_user_safe(&owner);
    });
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn delete_user(owner: UserID) {
    // delete the user safe
    MASTERSAFE.with(|ms: &RefCell<MasterSafe>| {
        let mut master_safe = ms.borrow_mut();
        master_safe.remove_user_safe(&owner);
    });

    // delete the user
    USER_REGISTRY.with(|ur: &RefCell<UserRegistry>| {
        let mut user_registry = ur.borrow_mut();
        user_registry.remove(&owner);
    });
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn is_user_safe_existing(owner: UserID) -> bool {
    MASTERSAFE.with(|mv: &RefCell<MasterSafe>| mv.borrow_mut().is_user_safe_existing(&owner))
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_user_safe(owner: UserID) -> UserSafe {
    MASTERSAFE
        .with(|mv: &RefCell<MasterSafe>| mv.borrow_mut().get_or_create_user_safe(&owner).clone())
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn add_user_secret(owner: UserID, category: SecretCategory, name: String) {
    let new_secret = Secret::new(&owner, &category, &name).await;
    MASTERSAFE.with(|ms: &RefCell<MasterSafe>| {
        let mut master_safe = ms.borrow_mut();
        master_safe.add_secret(&owner, &new_secret);
    });
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn update_user_secret(owner: UserID, secret: Secret) {
    MASTERSAFE.with(|ms: &RefCell<MasterSafe>| {
        let mut master_safe = ms.borrow_mut();
        master_safe.update_secret(&owner, &secret);
    });
}

#[pre_upgrade]
fn pre_upgrade() {
    MASTERSAFE.with(|ms| storage::stable_save((ms,)).unwrap());
    USER_REGISTRY.with(|ur| storage::stable_save((ur,)).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (old_ms,): (MasterSafe,) = storage::stable_restore().unwrap();
    MASTERSAFE.with(|ms| *ms.borrow_mut() = old_ms);

    let (old_ur,): (UserRegistry,) = storage::stable_restore().unwrap();
    USER_REGISTRY.with(|ur| *ur.borrow_mut() = old_ur);
}
