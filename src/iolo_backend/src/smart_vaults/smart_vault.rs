use candid::Principal;
use ic_cdk::{post_upgrade, pre_upgrade, storage};
use std::cell::RefCell;

use crate::common::error::SmartVaultErr;
use crate::common::user::{AddUserArgs, User};
use crate::common::uuid::UUID;
use crate::smart_vaults::testament::TestamentResponse;
use crate::smart_vaults::user_store::UserStore;
use crate::smart_vaults::user_vault::UserVaultID;
use crate::utils::caller::get_caller;

use super::master_vault::MasterVault;
use super::secret::{
    AddSecretArgs, Secret, SecretID, SecretListEntry, SecretSymmetricCryptoMaterial,
};
use super::testament::{AddTestamentArgs, Testament, TestamentID, TestamentListEntry};
use super::testament_registry::{TestamentRegistryForHeirs, TestamentRegistryForValidators};

thread_local! {
    // Master_vault holding all the user vaults
    pub static MASTERVAULT: RefCell<MasterVault> = RefCell::new(MasterVault::new());

    // User Registry
    pub static USER_STORE: RefCell<UserStore> = RefCell::new(UserStore::new());

    // Testament Registry for heirs
    pub static TESTAMENT_REGISTRY_FOR_HEIRS: RefCell<TestamentRegistryForHeirs> = RefCell::new(TestamentRegistryForHeirs::new());

    // Testament Registry for validators
    pub static TESTAMENT_REGISTRY_FOR_VALIDATORS: RefCell<TestamentRegistryForValidators> = RefCell::new(TestamentRegistryForValidators::new());

    // counter for the UUIDs
    pub static UUID_COUNTER: RefCell<u128>  = RefCell::new(1);
}

#[ic_cdk_macros::update]
pub fn create_user(args: AddUserArgs) -> Result<User, SmartVaultErr> {
    let mut new_user = User::new(&get_caller(), args);

    // Let's create the user vault
    let new_user_vault_id: UUID =
        MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<UUID, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            Ok(master_vault.create_user_vault())
        })?;

    // Add the new user vault to the new user
    new_user.set_user_vault(new_user_vault_id);

    // Store the new user
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
        let mut user_store = ur.borrow_mut();
        match user_store.add_user(new_user) {
            Ok(u) => Ok(u.clone()),
            Err(e) => Err(e),
        }
    })
}

#[ic_cdk_macros::query]
pub fn get_current_user() -> Result<User, SmartVaultErr> {
    // get current user
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
        let user_store = ur.borrow();
        match user_store.get_user(&get_caller()) {
            Ok(u) => Ok(u.clone()),
            Err(e) => Err(e),
        }
    })
}

#[ic_cdk_macros::update]
pub fn update_user(user: User) -> Result<User, SmartVaultErr> {
    // Update the user
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
        let mut user_store = ur.borrow_mut();
        match user_store.update_user(user) {
            Ok(u) => Ok(u.clone()),
            Err(e) => Err(e),
        }
    })
}

#[ic_cdk_macros::update]
pub fn update_user_login_date() -> Result<User, SmartVaultErr> {
    // Update the login date
    // let ps = PrincipalStorable::from(get_caller().clone());

    // get current user
    let mut current_user =
        USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
            let user_store = ur.borrow();
            match user_store.get_user(&get_caller()) {
                Ok(u) => Ok(u.clone()),
                Err(e) => Err(e),
            }
        })?;

    current_user.update_login_date();

    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
        let mut user_store = ur.borrow_mut();
        match user_store.update_user(current_user) {
            Ok(u) => Ok(u.clone()),
            Err(e) => Err(e),
        }
    })
}

#[ic_cdk_macros::update]
pub fn delete_user() -> Result<(), SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_vault(&user_vault_id);
    });

    // delete the user
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
        let mut user_store = ur.borrow_mut();
        user_store.delete_user(&principal)
    })?;
    Ok(())
}

#[ic_cdk_macros::update]
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

#[ic_cdk_macros::query]
pub fn get_secret_as_heir(
    sid: SecretID,
    testament_id: TestamentID,
) -> Result<Secret, SmartVaultErr> {
    let principal = get_caller();

    // Verify that heir belongs to testament
    let result_tr = TESTAMENT_REGISTRY_FOR_HEIRS.with(
        |tr: &RefCell<TestamentRegistryForHeirs>| -> Result<(TestamentID, Principal), SmartVaultErr> {
            let testament_registry = tr.borrow();
            testament_registry.get_testament_id_as_heir(principal, testament_id.clone())
        },
    )?;

    // Get user vault of testator
    let user_vault_id: UUID = get_vault_id_for(result_tr.1)?;

    // Read testament
    let result_mv = MASTERVAULT.with(
        |mv: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_testament(&testament_id)
                .cloned()
        },
    )?;

    // Check that heir is allowed to read testament
    if result_mv.conditions().status.clone() {
        // Read secret in testator user vault
        MASTERVAULT.with(
            |mv: &RefCell<MasterVault>| -> Result<Secret, SmartVaultErr> {
                mv.borrow()
                    .get_user_vault(&user_vault_id)?
                    .get_secret(&sid)
                    .cloned()
            },
        )
    } else {
        Err(SmartVaultErr::InvalidTestamentCondition)
    }
}

#[ic_cdk_macros::update]
pub fn remove_secret(secret_id: String) -> Result<(), SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<(), SmartVaultErr> {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_secret(&user_vault_id, &secret_id)
    })
}

#[ic_cdk_macros::query]
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

#[ic_cdk_macros::query]
pub fn get_secret_symmetric_crypto_material_as_heir(
    secret_id: SecretID,
    testament_id: TestamentID,
) -> Result<SecretSymmetricCryptoMaterial, SmartVaultErr> {
    let principal = get_caller();

    // Verify that heir belongs to testament
    let result_tr = TESTAMENT_REGISTRY_FOR_HEIRS.with(
        |tr: &RefCell<TestamentRegistryForHeirs>| -> Result<(TestamentID, Principal), SmartVaultErr> {
            let testament_registry = tr.borrow();
            testament_registry.get_testament_id_as_heir(principal, testament_id.clone())
        },
    )?;

    // Get user vault of testator
    let user_vault_id: UUID = get_vault_id_for(result_tr.1)?;

    // Read testament
    let result_mv = MASTERVAULT.with(
        |mv: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_testament(&testament_id)
                .cloned()
        },
    )?;

    // Check that heir is allowed to read testament
    if result_mv.conditions().status.clone() {
        // Read secret crypto material from testament

        Ok(result_mv.key_box().get(&secret_id).unwrap().clone())
    } else {
        Err(SmartVaultErr::InvalidTestamentCondition)
    }
}

#[ic_cdk_macros::update]
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
pub fn get_testament_as_testator(
    testament_id: TestamentID,
) -> Result<TestamentResponse, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    let result = MASTERVAULT.with(
        |mv: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_testament(&testament_id)
                .cloned()
        },
    )?;
    let mut testament_for_testator = TestamentResponse::from(result.clone());
    for secret in result.secrets() {
        let result_mv_2 = MASTERVAULT.with(
            |mv: &RefCell<MasterVault>| -> Result<Secret, SmartVaultErr> {
                mv.borrow()
                    .get_user_vault(&user_vault_id)?
                    .get_secret(secret)
                    .cloned()
            },
        )?;
        let secret_list_entry = SecretListEntry {
            id: result_mv_2.id().clone(),
            category: result_mv_2.category(),
            name: result_mv_2.name(),
        };
        testament_for_testator.secrets().insert(secret_list_entry);
    }
    Ok(testament_for_testator)
}

#[ic_cdk_macros::query]
pub fn get_testament_as_heir(
    testament_id: TestamentID,
) -> Result<TestamentResponse, SmartVaultErr> {
    // Verify that heir belongs to testament
    let result_tr = TESTAMENT_REGISTRY_FOR_HEIRS.with(
        |tr: &RefCell<TestamentRegistryForHeirs>| -> Result<(TestamentID, Principal), SmartVaultErr> {
            let testament_registry = tr.borrow();
            testament_registry.get_testament_id_as_heir(get_caller(), testament_id.clone())
        },
    )?;

    // Get user vault of testator
    let user_vault_id: UUID = get_vault_id_for(result_tr.1)?;

    // Read testament
    let result_mv = MASTERVAULT.with(
        |mv: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_testament(&testament_id)
                .cloned()
        },
    )?;

    // Check that heir is allowed to read testament
    if result_mv.conditions().status.clone() {
        // Get more secret data for heirs...
        let testator_vault_id = get_vault_id_for(*result_mv.testator())?;
        let mut testament_for_heir = TestamentResponse::from(result_mv.clone());
        for secret in result_mv.secrets() {
            let result_mv_2 = MASTERVAULT.with(
                |mv: &RefCell<MasterVault>| -> Result<Secret, SmartVaultErr> {
                    mv.borrow()
                        .get_user_vault(&testator_vault_id)?
                        .get_secret(secret)
                        .cloned()
                },
            )?;
            let secret_list_entry = SecretListEntry {
                id: result_mv_2.id().clone(),
                category: result_mv_2.category(),
                name: result_mv_2.name(),
            };
            testament_for_heir.secrets().insert(secret_list_entry);
        }
        Ok(testament_for_heir)
    } else {
        Err(SmartVaultErr::InvalidTestamentCondition)
    }
}

#[ic_cdk_macros::query]
pub fn get_testament_list_as_heir() -> Result<Vec<TestamentListEntry>, SmartVaultErr> {
    let result_tr = TESTAMENT_REGISTRY_FOR_HEIRS.with(
        |tr: &RefCell<TestamentRegistryForHeirs>| -> Vec<(TestamentID, Principal)> {
            let testament_registry = tr.borrow();
            testament_registry.get_testament_ids_as_heir(get_caller())
        },
    );

    let mut response = Vec::new();
    for item in result_tr {
        let user_vault_id: UUID = get_vault_id_for(item.1.clone())?;
        let result_mv = MASTERVAULT.with(
            |mv: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
                mv.borrow()
                    .get_user_vault(&user_vault_id)?
                    .get_testament(&item.0)
                    .cloned()
            },
        )?;
        let entry = TestamentListEntry::from(result_mv);
        response.push(entry)
    }
    Ok(response)
}

#[ic_cdk_macros::query]
pub fn get_testament_list_as_validator() -> Result<Vec<TestamentListEntry>, SmartVaultErr> {
    let result_tr = TESTAMENT_REGISTRY_FOR_VALIDATORS.with(
        |tr: &RefCell<TestamentRegistryForValidators>| -> Vec<(TestamentID, Principal)> {
            let testament_registry = tr.borrow();
            testament_registry.get_testament_ids_as_validator(get_caller())
        },
    );

    let mut response = Vec::new();
    for item in result_tr {
        let user_vault_id: UUID = get_vault_id_for(item.1.clone())?;
        let result_mv = MASTERVAULT.with(
            |mv: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
                mv.borrow()
                    .get_user_vault(&user_vault_id)?
                    .get_testament(&item.0)
                    .cloned()
            },
        )?;
        let entry = TestamentListEntry::from(result_mv);
        response.push(entry)
    }
    Ok(response)
}

#[ic_cdk_macros::query]
pub fn get_testament_list_as_testator() -> Result<Vec<TestamentListEntry>, SmartVaultErr> {
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
        Ok(testaments
            .into_iter()
            .map(TestamentListEntry::from)
            .collect())
    })
}

#[ic_cdk_macros::update]
pub fn confirm_x_out_of_y_condition(
    testator: Principal,
    testament_id: TestamentID,
    status: bool,
) -> Result<(), SmartVaultErr> {
    // Get user vault of testator
    let user_vault_id: UUID = get_vault_id_for(testator)?;

    // Read testament
    let mut result_mv = MASTERVAULT.with(
        |mv: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_testament(&testament_id)
                .cloned()
        },
    )?;

    // Check that there is a XOutOfYCondition in the testament and that the caller is one of the confirmers
    match result_mv.find_validator_mut(&get_caller()) {
        Some(confirmer) => {
            // Modify the confirmer as needed
            confirmer.status = status;
            Ok(())
        }
        None => Err(SmartVaultErr::Unauthorized),
    }
}

#[ic_cdk_macros::update]
pub fn remove_testament(testament_id: String) -> Result<(), SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<(), SmartVaultErr> {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_testament(&user_vault_id, &testament_id)
    })
}

#[ic_cdk_macros::update]
pub fn add_heir(args: AddUserArgs) -> Result<User, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<User, SmartVaultErr> {
        let mut master_vault = ms.borrow_mut();
        master_vault.add_heir(&user_vault_id, args)
    })
}

#[ic_cdk_macros::query]
pub fn get_heir_list() -> Result<Vec<User>, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|mv: &RefCell<MasterVault>| {
        let heirs: Vec<User> = mv
            .borrow()
            .get_user_vault(&user_vault_id)?
            .heirs()
            .clone()
            .into_values()
            .collect();
        Ok(heirs.into_iter().map(User::from).collect())
    })
}

#[ic_cdk_macros::update]
pub fn update_heir(u: User) -> Result<User, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<User, SmartVaultErr> {
        let mut master_vault = ms.borrow_mut();
        master_vault.update_user_heir(&user_vault_id, u)
    })
}

#[ic_cdk_macros::update]
pub fn remove_heir(user_id: Principal) -> Result<(), SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> Result<(), SmartVaultErr> {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_heir(&user_vault_id, &user_id)
    })
}

#[ic_cdk_macros::query]
pub fn is_user_vault_existing() -> bool {
    let principal = get_caller();
    if get_vault_id_for(principal).is_ok() {
        return true;
    }
    false
}

fn get_vault_id_for(principal: Principal) -> Result<UserVaultID, SmartVaultErr> {
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<UUID, SmartVaultErr> {
        let user_store = ur.borrow();
        let user = user_store.get_user(&principal)?;

        user.user_vault_id
            .ok_or_else(|| SmartVaultErr::UserVaultDoesNotExist("".to_string()))
    })
}

#[pre_upgrade]
fn pre_upgrade() {
    MASTERVAULT.with(|ms| storage::stable_save((ms,)).unwrap());
    // USER_STORE.with(|ur| storage::stable_save((ur,)).unwrap());
    TESTAMENT_REGISTRY_FOR_HEIRS.with(|tr| storage::stable_save((tr,)).unwrap());
    TESTAMENT_REGISTRY_FOR_VALIDATORS.with(|tr| storage::stable_save((tr,)).unwrap());
    UUID_COUNTER.with(|c| storage::stable_save((c,)).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (old_ms,): (MasterVault,) = storage::stable_restore().unwrap();
    MASTERVAULT.with(|ms| *ms.borrow_mut() = old_ms);

    // let (old_ur,): (UserStore,) = storage::stable_restore().unwrap();
    // USER_STORE.with(|ur| *ur.borrow_mut() = old_ur);

    let (old_tr,): (TestamentRegistryForHeirs,) = storage::stable_restore().unwrap();
    TESTAMENT_REGISTRY_FOR_HEIRS.with(|tr| *tr.borrow_mut() = old_tr);

    let (old_c,): (u128,) = storage::stable_restore().unwrap();
    UUID_COUNTER.with(|c| *c.borrow_mut() = old_c);
}
