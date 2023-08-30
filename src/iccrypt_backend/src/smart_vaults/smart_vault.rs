use std::cell::RefCell;

use candid::{candid_method, Principal};
use ic_cdk::{post_upgrade, pre_upgrade, storage};

use crate::common::error::SmartVaultErr;
use crate::common::user::User;
use crate::common::uuid::UUID;
use crate::smart_vaults::user_registry::UserRegistry;
use crate::utils::caller::get_caller;

use super::master_vault::MasterVault;
use super::secret::{CreateSecretArgs, Secret, SecretForUpdate};
use super::user_vault::UserVault;

thread_local! {
    // Master_vault holding all the user vaults
    pub static MASTERVAULT: RefCell<MasterVault> = RefCell::new(MasterVault::new());

    // User Registsry
    pub static USER_REGISTRY: RefCell<UserRegistry> = RefCell::new(UserRegistry::new());

    // counter for the UUIDs
    pub static UUID_COUNTER: RefCell<u128>  = RefCell::new(1);
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn create_user() -> Result<User, SmartVaultErr> {
    let principal = get_caller();
    let mut new_user = User::new(&principal);

    // Let's create a vault for the user
    let new_user_vault_id: UUID =
        MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<UUID, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            Ok(master_vault.create_user_vault())
        })?;

    // Add the new user vault to the new user
    new_user.set_user_vault(new_user_vault_id);

    // Store the new user
    USER_REGISTRY.with(
        |ur: &RefCell<UserRegistry>| -> Result<User, SmartVaultErr> {
            let mut user_registry = ur.borrow_mut();
            match user_registry.add_user(new_user) {
                Ok(u) => Ok(*u),
                Err(e) => Err(e),
            }
        },
    )?;

    Ok(new_user)
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_user_vault() -> Result<UserVault, SmartVaultErr> {
    let principal = get_caller();

    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT
        .with(|mv: &RefCell<MasterVault>| mv.borrow_mut().get_user_vault(&user_vault_id).cloned())
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn delete_user() -> Result<(), SmartVaultErr> {
    let principal = get_caller();

    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_vault(&user_vault_id);
    });

    // delete the user
    USER_REGISTRY.with(
        |ur: &RefCell<UserRegistry>| -> Result<User, SmartVaultErr> {
            let mut user_registry = ur.borrow_mut();
            user_registry.delete_user(&principal)
        },
    )?;
    Ok(())
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn add_user_secret(args: CreateSecretArgs) -> Result<Secret, SmartVaultErr> {
    let principal = get_caller();

    let user_vault_id: UUID = get_vault_id_for(principal)?;
    MASTERVAULT.with(
        |ms: &RefCell<MasterVault>| -> Result<Secret, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.add_secret(&user_vault_id, args)
        },
    )
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn update_user_secret(secret_for_update: SecretForUpdate) -> Result<Secret, SmartVaultErr> {
    let principal = get_caller();

    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(
        |ms: &RefCell<MasterVault>| -> Result<Secret, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.update_secret(&user_vault_id, &secret_for_update)
        },
    )
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn remove_user_secret(secret_id: UUID) -> Result<(), SmartVaultErr> {
    let principal = get_caller();

    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<(), SmartVaultErr> {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_secret(&user_vault_id, &secret_id)
    })
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn is_user_vault_existing() -> bool {
    let principal = get_caller();
    if get_vault_id_for(principal).is_ok() {
        return true;
    }
    false
}

// #[ic_cdk_macros::query]
// #[candid_method(query)]
// pub
fn get_vault_id_for(principal: Principal) -> Result<UUID, SmartVaultErr> {
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
    UUID_COUNTER.with(|c| storage::stable_save((c,)).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (old_ms,): (MasterVault,) = storage::stable_restore().unwrap();
    MASTERVAULT.with(|ms| *ms.borrow_mut() = old_ms);

    let (old_ur,): (UserRegistry,) = storage::stable_restore().unwrap();
    USER_REGISTRY.with(|ur| *ur.borrow_mut() = old_ur);

    let (old_c,): (u128,) = storage::stable_restore().unwrap();
    UUID_COUNTER.with(|c| *c.borrow_mut() = old_c);
}
