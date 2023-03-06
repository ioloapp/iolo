use std::cell::RefCell;

use candid::{candid_method, Principal};
use ic_cdk::{post_upgrade, pre_upgrade, storage};

use crate::common::error::SmartVaultErr;
use crate::common::user::User;
use crate::common::uuid::UUID;
use crate::smart_vaults::user_registry::UserRegistry;
use crate::utils::caller::get_caller;

use super::master_vault::MasterVault;
use super::secret::{Secret, SecretCategory};
use super::user_vault::UserVault;

thread_local! {
    // Master_vault holding all the user vaults
    static MASTERVAULT: RefCell<MasterVault> = RefCell::new(MasterVault::new());

    // User Registsry
    static USER_REGISTRY: RefCell<UserRegistry> = RefCell::new(UserRegistry::new());
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn create_user() -> Result<User, SmartVaultErr> {
    let principal = get_caller();
    let new_user = User::new(&principal);

    USER_REGISTRY.with(
        |ur: &RefCell<UserRegistry>| -> Result<User, SmartVaultErr> {
            let mut user_registry = ur.borrow_mut();
            match user_registry.create_new_user(&principal) {
                Ok(u) => Ok(*u), // u is of type &User. User implements Copy
                Err(e) => Err(e),
            }
        },
    )?;

    // Let's create a vault for the user
    // MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<(), SmartVaultErr> {
    //     let mut master_vault = ms.borrow_mut();
    //     master_vault.create_user_vault().await;
    //     Ok(())
    // })?;

    Ok(new_user)
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_user_vault() -> Result<UserVault, SmartVaultErr> {
    let principal = get_caller();

    // Get vault_id of caller
    // let user_vault_id: UUID = USER_REGISTRY.with(
    //     |ur: &RefCell<UserRegistry>| -> Result<UUID, SmartVaultErr> {
    //         let user_registry = ur.borrow();
    //         let user = user_registry.get_user(&principal)?;
    //         Ok(*user.user_vault_id())
    //     },
    // )?;
    let user_vault_id: UUID = get_vault_id_of_caller(principal)?;

    MASTERVAULT
        .with(|mv: &RefCell<MasterVault>| mv.borrow_mut().get_user_vault(&user_vault_id).cloned())
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn delete_user() -> Result<(), SmartVaultErr> {
    let principal = get_caller();

    // Get vault_id of caller
    // let user_vault_id: UUID = USER_REGISTRY.with(
    //     |ur: &RefCell<UserRegistry>| -> Result<UUID, SmartVaultErr> {
    //         let user_registry = ur.borrow();
    //         let user = user_registry.get_user(&principal)?;
    //         Ok(*user.user_vault_id())
    //     },
    // )?;
    let user_vault_id: UUID = get_vault_id_of_caller(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_vault(&user_vault_id);
    });

    // delete the user
    USER_REGISTRY.with(|ur: &RefCell<UserRegistry>| {
        let mut user_registry = ur.borrow_mut();
        user_registry.delete_user(&principal);
    });
    Ok(())
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn add_user_secret(category: SecretCategory, name: String) -> Result<(), SmartVaultErr> {
    let principal = get_caller();

    // Get vault_id of caller
    // let user_vault_id: UUID = USER_REGISTRY.with(
    //     |ur: &RefCell<UserRegistry>| -> Result<UUID, SmartVaultErr> {
    //         let user_registry = ur.borrow();
    //         let user = user_registry.get_user(&principal)?;
    //         Ok(*user.user_vault_id())
    //     },
    // )?;
    let user_vault_id: UUID = get_vault_id_of_caller(principal)?;

    let new_secret = Secret::new(&category, &name).await;
    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.add_secret(&user_vault_id, &new_secret);
    });
    Ok(())
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn update_user_secret(secret: Secret) -> Result<(), SmartVaultErr> {
    let principal = get_caller();

    // Get vault_id of caller
    // let user_vault_id: UUID = USER_REGISTRY.with(
    //     |ur: &RefCell<UserRegistry>| -> Result<UUID, SmartVaultErr> {
    //         let user_registry = ur.borrow();
    //         let user = user_registry.get_user(&principal)?;
    //         Ok(*user.user_vault_id())
    //     },
    // )?;
    let user_vault_id: UUID = get_vault_id_of_caller(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.update_secret(&user_vault_id, &secret);
    });
    Ok(())
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_vault_id_of_caller(principal: Principal) -> Result<UUID, SmartVaultErr> {
    USER_REGISTRY.with(
        |ur: &RefCell<UserRegistry>| -> Result<UUID, SmartVaultErr> {
            let user_registry = ur.borrow();
            let user = user_registry.get_user(&principal)?;
            Ok(*user.user_vault_id())
        },
    )
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
