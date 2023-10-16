use std::cell::RefCell;

use candid::{candid_method, Principal};
use ic_cdk::{post_upgrade, pre_upgrade, storage};

use crate::common::error::SmartVaultErr;
use crate::common::user::User;
use crate::common::uuid::UUID;
use crate::smart_vaults::user_registry::UserRegistry;
use crate::utils::caller::get_caller;

use super::master_vault::MasterVault;
use super::secret::{
    AddSecretArgs, Secret, SecretID, SecretListEntry, SecretSymmetricCryptoMaterial,
};
use super::testament::{AddTestamentArgs, Testament, TestamentID};
use super::testament_registry::TestamentRegistry;

thread_local! {
    // Master_vault holding all the user vaults
    pub static MASTERVAULT: RefCell<MasterVault> = RefCell::new(MasterVault::new());

    // User Registsry
    pub static USER_REGISTRY: RefCell<UserRegistry> = RefCell::new(UserRegistry::new());

    // Testament Registsry
    pub static TESTAMENT_REGISTRY: RefCell<TestamentRegistry> = RefCell::new(TestamentRegistry::new());

    // counter for the UUIDs
    pub static UUID_COUNTER: RefCell<u128>  = RefCell::new(1);
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn create_user() -> Result<User, SmartVaultErr> {
    let mut new_user = User::new(&get_caller());

    // Let's create the user vault
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
    )
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
pub fn add_secret(args: AddSecretArgs) -> Result<Secret, SmartVaultErr> {
    let user_vault_id: UUID = get_vault_id_for(get_caller())?;
    MASTERVAULT.with(
        |ms: &RefCell<MasterVault>| -> Result<Secret, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.add_user_secret(&user_vault_id, args)
        },
    )
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn update_secret(s: Secret) -> Result<Secret, SmartVaultErr> {
    let principal = get_caller();

    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(
        |ms: &RefCell<MasterVault>| -> Result<Secret, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.update_user_secret(&user_vault_id, s)
        },
    )
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_secret(sid: SecretID) -> Result<Secret, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(
        |mv: &RefCell<MasterVault>| -> Result<Secret, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_secret(&sid)
                .cloned()
        },
    )
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn remove_secret(secret_id: String) -> Result<(), SmartVaultErr> {
    let principal = get_caller();

    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<(), SmartVaultErr> {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_secret(&user_vault_id, &secret_id)
    })
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_secret_list() -> Result<Vec<SecretListEntry>, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|mv: &RefCell<MasterVault>| {
        let secrets_flat: Vec<Secret> = mv
            .borrow()
            .get_user_vault(&user_vault_id)?
            .secrets()
            .clone()
            .into_values()
            .collect();
        Ok(secrets_flat
            .into_iter()
            .map(SecretListEntry::from)
            .collect())
    })
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_secret_symmetric_crypto_material(
    sid: SecretID,
) -> Result<SecretSymmetricCryptoMaterial, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|mv: &RefCell<MasterVault>| {
        let mv: &MasterVault = &mv.borrow();
        let uv = mv.get_user_vault(&user_vault_id)?;
        let sdm: &SecretSymmetricCryptoMaterial = uv.key_box().get(&sid).unwrap();
        Ok(sdm.clone())
    })
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn add_testament(args: AddTestamentArgs) -> Result<Testament, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(
        |ms: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.add_user_testament(&user_vault_id, args)
        },
    )
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn update_testament(t: Testament) -> Result<Testament, SmartVaultErr> {
    let principal = get_caller();

    let user_vault_id: UUID = get_vault_id_for(principal)?;
    MASTERVAULT.with(
        |ms: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.update_user_testament(&user_vault_id, t)
        },
    )
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_testament(id: TestamentID) -> Result<Testament, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(
        |mv: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_testament(&id)
                .cloned()
        },
    )
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_testaments_as_heir() -> Result<Vec<(Principal, TestamentID)>, SmartVaultErr> {
    TESTAMENT_REGISTRY.with(
        |tr: &RefCell<TestamentRegistry>| -> Result<Vec<(Principal, TestamentID)>, SmartVaultErr> {
            tr.borrow().get_testaments_for_heir(get_caller()).cloned()
        },
    )
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_testament_list() -> Result<Vec<Testament>, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|mv: &RefCell<MasterVault>| {
        let testaments: Vec<Testament> = mv
            .borrow()
            .get_user_vault(&user_vault_id)?
            .testaments()
            .clone()
            .into_values()
            .collect();
        Ok(testaments)
    })
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn remove_testament(testament_id: String) -> Result<(), SmartVaultErr> {
    let principal = get_caller();

    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<(), SmartVaultErr> {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_testament(&user_vault_id, &testament_id)
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
    TESTAMENT_REGISTRY.with(|tr| storage::stable_save((tr,)).unwrap());
    UUID_COUNTER.with(|c| storage::stable_save((c,)).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (old_ms,): (MasterVault,) = storage::stable_restore().unwrap();
    MASTERVAULT.with(|ms| *ms.borrow_mut() = old_ms);

    let (old_ur,): (UserRegistry,) = storage::stable_restore().unwrap();
    USER_REGISTRY.with(|ur| *ur.borrow_mut() = old_ur);

    let (old_tr,): (TestamentRegistry,) = storage::stable_restore().unwrap();
    TESTAMENT_REGISTRY.with(|tr| *tr.borrow_mut() = old_tr);

    let (old_c,): (u128,) = storage::stable_restore().unwrap();
    UUID_COUNTER.with(|c| *c.borrow_mut() = old_c);
}
