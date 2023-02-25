use std::cell::RefCell;
use std::collections::BTreeMap;

use candid::candid_method;
use ic_cdk::{post_upgrade, pre_upgrade, storage};

use crate::common::messages::ReturnMessage;
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

/*#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn create_user(user_id: UserID) -> ReturnMessage<User, String> {
    // create the new user
    let res_create = USER_REGISTRY.with(|ur: &RefCell<UserRegistry>| {
        let mut user_registry = ur.borrow_mut();
        let res_insert = user_registry.insert(user_id, User::new(&user_id));

        // Insert returns None if user has been created and Some if user already exists.
        // We change this behaviour and return None if user already exists and Some (with new user) if user has been created
        match res_insert {
            Some(_) => None,
            None => user_registry.get(&user_id).cloned(),
        }
    });

    match res_create {
        Some(user) => ReturnMessage::Ok(user),
        None => ReturnMessage::Err("User already existed. Nothing has been inserted".to_string()),
    }
}*/

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn create_user(user_id: UserID) -> ReturnMessage<UserVault, String> {
    // create the new user
    let res_create_user = USER_REGISTRY.with(|ur: &RefCell<UserRegistry>| {
        let mut user_registry = ur.borrow_mut();
        user_registry.insert(user_id, User::new(&user_id))
    });

    match res_create_user {
        None => { // User has been created, let's create its user_vault
            let res_create_user_vault = MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
                let mut master_vault = ms.borrow_mut();
                master_vault.create_user_vault(&user_id)
            });
            match res_create_user_vault {
                Ok(v) => ReturnMessage::Ok(v.cloned()),
                Err(e) => ReturnMessage::Err("User_vault already existed. Nothing has been inserted".to_string())
            }
        }
        Some(_) => ReturnMessage::Err("User already existed. Nothing has been inserted".to_string()),
    }
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_user_vault(owner: UserID) -> Option<UserVault> {
    MASTERVAULT.with(|mv: &RefCell<MasterVault>| mv.borrow_mut().get_user_vault(&owner).cloned())
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn is_user_vault_existing(owner: UserID) -> bool {
    MASTERVAULT.with(|mv: &RefCell<MasterVault>| mv.borrow().is_user_vault_existing(&owner))
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
