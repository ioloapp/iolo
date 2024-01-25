use candid::Principal;
use ic_cdk::{post_upgrade, pre_upgrade, storage};
use std::cell::RefCell;

use crate::common::error::SmartVaultErr;
use crate::common::uuid::UUID;
use crate::policies::policies_interface_impl::add_policy_impl;
use crate::policies::policy::PolicyResponse;

use crate::policies::policy_store::PolicyStore;
use crate::secrets::secrets_interface_impl::{
    add_secret_impl, get_secret_impl, get_secret_list_impl,
    get_secret_symmetric_crypto_material_impl, remove_secret_impl, update_secret_impl,
};
use crate::user_vaults::user_vault::UserVaultID;
use crate::user_vaults::user_vault_store::UserVaultStore;
use crate::users::user::{AddUserArgs, User};
use crate::users::user_store::UserStore;
use crate::users::users_interface_impl::{
    create_user_impl, delete_user_impl, get_user, update_user_impl, update_user_login_date_impl,
};
use crate::utils::caller::get_caller;

use crate::policies::policy::{AddPolicyArgs, Policy, PolicyID, PolicyListEntry};
use crate::policies::policy_registry::{
    PolicyRegistryForBeneficiaries, PolicyRegistryForValidators,
};
use crate::secrets::secret::{
    AddSecretArgs, Secret, SecretID, SecretListEntry, SecretSymmetricCryptoMaterial,
    UpdateSecretArgs,
};
use crate::secrets::secret_store::SecretStore;

thread_local! {
    // User vault store holding all the user vaults
    pub static USER_VAULT_STORE: RefCell<UserVaultStore> = RefCell::new(UserVaultStore::new());

    // User Store
    pub static USER_STORE: RefCell<UserStore> = RefCell::new(UserStore::new());

    // Secret Store
    pub static SECRET_STORE: RefCell<SecretStore> = RefCell::new(SecretStore::new());

    // Policy (fka Testament) Store
    pub static POLICY_STORE: RefCell<PolicyStore> = RefCell::new(PolicyStore::new());

    // policy Registry for beneficiaries
    pub static POLICY_REGISTRY_FOR_BENEFICIARIES: RefCell<PolicyRegistryForBeneficiaries> = RefCell::new(PolicyRegistryForBeneficiaries::new());

    // policy Registry for validators
    pub static POLICY_REGISTRY_FOR_VALIDATORS: RefCell<PolicyRegistryForValidators> = RefCell::new(PolicyRegistryForValidators::new());

    // counter for the UUIDs
    pub static UUID_COUNTER: RefCell<u128>  = RefCell::new(1);
}
/**
 * User CRUD
 */

#[ic_cdk_macros::update]
pub async fn create_user(args: AddUserArgs) -> Result<User, SmartVaultErr> {
    create_user_impl(args, &get_caller()).await
}

#[ic_cdk_macros::query]
pub fn get_current_user() -> Result<User, SmartVaultErr> {
    get_user(&get_caller())
}

#[ic_cdk_macros::update]
pub fn update_user(user: User) -> Result<User, SmartVaultErr> {
    update_user_impl(user, &get_caller())
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
pub fn get_secret(sid: UUID) -> Result<Secret, SmartVaultErr> {
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
pub fn get_secret_symmetric_crypto_material(
    sid: UUID,
) -> Result<SecretSymmetricCryptoMaterial, SmartVaultErr> {
    get_secret_symmetric_crypto_material_impl(sid, &get_caller())
}

#[ic_cdk_macros::query]
pub fn get_secret_as_beneficiary(
    sid: SecretID,
    policy_id: PolicyID,
) -> Result<Secret, SmartVaultErr> {
    let principal = get_caller();

    // Verify that beneficiary belongs to policy
    let result_pr = POLICY_REGISTRY_FOR_BENEFICIARIES.with(
        |pr: &RefCell<PolicyRegistryForBeneficiaries>| -> Result<(PolicyID, Principal), SmartVaultErr> {
            let policy_registry = pr.borrow();
            policy_registry.get_policy_id_as_beneficiary(principal, policy_id.clone())
        },
    )?;

    // Get user vault of owner
    let user_vault_id: UUID = get_vault_id_for(result_pr.1)?;

    // Read policy
    let result_mv = USER_VAULT_STORE.with(
        |mv: &RefCell<UserVaultStore>| -> Result<Policy, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_policy(&policy_id)
                .cloned()
        },
    )?;

    // Check that beneficiary is allowed to read policy
    if *result_mv.conditions_status() {
        // Read secret in owner user vault
        USER_VAULT_STORE.with(
            |mv: &RefCell<UserVaultStore>| -> Result<Secret, SmartVaultErr> {
                mv.borrow()
                    .get_user_vault(&user_vault_id)?
                    .get_secret(&sid)
                    .cloned()
            },
        )
    } else {
        Err(SmartVaultErr::InvalidPolicyCondition)
    }
}

#[ic_cdk_macros::query]
pub fn get_secret_symmetric_crypto_material_as_beneficiary(
    secret_id: UUID,
    policy_id: PolicyID,
) -> Result<SecretSymmetricCryptoMaterial, SmartVaultErr> {
    let principal = get_caller();

    // Verify that beneficiary belongs to policy
    let result_tr = POLICY_REGISTRY_FOR_BENEFICIARIES.with(
        |tr: &RefCell<PolicyRegistryForBeneficiaries>| -> Result<(PolicyID, Principal), SmartVaultErr> {
            let policy_registry = tr.borrow();
            policy_registry.get_policy_id_as_beneficiary(principal, policy_id.clone())
        },
    )?;

    // Get user vault of owner
    let user_vault_id: UUID = get_vault_id_for(result_tr.1)?;

    // Read policy
    let result_mv = USER_VAULT_STORE.with(
        |mv: &RefCell<UserVaultStore>| -> Result<Policy, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_policy(&policy_id)
                .cloned()
        },
    )?;

    // Check that beneficiary is allowed to read policy
    if *result_mv.conditions_status() {
        // Read secret crypto material from policy

        Ok(result_mv.key_box().get(&secret_id).unwrap().clone())
    } else {
        Err(SmartVaultErr::InvalidPolicyCondition)
    }
}

/**
 * Policy CRUD
 */

#[ic_cdk_macros::update]
pub async fn add_policy(args: AddPolicyArgs) -> Result<Policy, SmartVaultErr> {
    add_policy_impl(args, &get_caller()).await
}

#[ic_cdk_macros::update]
pub fn update_policy(policy: Policy) -> Result<Policy, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    USER_VAULT_STORE.with(
        |ms: &RefCell<UserVaultStore>| -> Result<Policy, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.update_user_policy(&user_vault_id, policy)
        },
    )
}

#[ic_cdk_macros::query]
pub fn get_policy_as_owner(policy_id: PolicyID) -> Result<PolicyResponse, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    let policy = USER_VAULT_STORE.with(
        |mv: &RefCell<UserVaultStore>| -> Result<Policy, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_policy(&policy_id)
                .cloned()
        },
    )?;
    let mut policy_response = PolicyResponse::from(policy.clone());
    for secret_id in policy.secrets() {
        // get secret from secret store
        let secret = USER_VAULT_STORE.with(
            |mv: &RefCell<UserVaultStore>| -> Result<Secret, SmartVaultErr> {
                mv.borrow()
                    .get_user_vault(&user_vault_id)?
                    .get_secret(secret_id)
                    .cloned()
            },
        )?;
        let secret_list_entry = SecretListEntry {
            id: secret.id(),
            category: secret.category(),
            name: secret.name(),
        };
        policy_response.secrets().insert(secret_list_entry);
    }
    Ok(policy_response)
}

#[ic_cdk_macros::query]
pub fn get_policy_as_beneficiary(policy_id: PolicyID) -> Result<PolicyResponse, SmartVaultErr> {
    // Verify that beneficiary belongs to policy
    let result_pr = POLICY_REGISTRY_FOR_BENEFICIARIES.with(
        |pr: &RefCell<PolicyRegistryForBeneficiaries>| -> Result<(PolicyID, Principal), SmartVaultErr> {
            let policy_registry = pr.borrow();
            policy_registry.get_policy_id_as_beneficiary(get_caller(), policy_id.clone())
        },
    )?;

    // Get user vault of owner
    let user_vault_id: UUID = get_vault_id_for(result_pr.1)?;

    // Read policy
    let result_mv = USER_VAULT_STORE.with(
        |mv: &RefCell<UserVaultStore>| -> Result<Policy, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_policy(&policy_id)
                .cloned()
        },
    )?;

    // Check that beneficiary is allowed to read policy
    if *result_mv.conditions_status() {
        // Get more secret data for beneficiary...
        let owner_vault_id = get_vault_id_for(*result_mv.owner())?;
        let mut policy_for_beneficiary = PolicyResponse::from(result_mv.clone());
        for secret in result_mv.secrets() {
            let result_mv_2 = USER_VAULT_STORE.with(
                |mv: &RefCell<UserVaultStore>| -> Result<Secret, SmartVaultErr> {
                    mv.borrow()
                        .get_user_vault(&owner_vault_id)?
                        .get_secret(secret)
                        .cloned()
                },
            )?;
            let secret_list_entry = SecretListEntry {
                id: result_mv_2.id(),
                category: result_mv_2.category(),
                name: result_mv_2.name(),
            };
            policy_for_beneficiary.secrets().insert(secret_list_entry);
        }
        Ok(policy_for_beneficiary)
    } else {
        Err(SmartVaultErr::InvalidPolicyCondition)
    }
}

#[ic_cdk_macros::query]
pub fn get_policy_list_as_beneficiary() -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    let result_pr = POLICY_REGISTRY_FOR_BENEFICIARIES.with(
        |pr: &RefCell<PolicyRegistryForBeneficiaries>| -> Vec<(PolicyID, Principal)> {
            let policy_registry = pr.borrow();
            policy_registry.get_policy_ids_as_beneficiary(get_caller())
        },
    );

    let mut response = Vec::new();
    for item in result_pr {
        let user_vault_id: UUID = get_vault_id_for(item.1)?;
        let result_mv = USER_VAULT_STORE.with(
            |mv: &RefCell<UserVaultStore>| -> Result<Policy, SmartVaultErr> {
                mv.borrow()
                    .get_user_vault(&user_vault_id)?
                    .get_policy(&item.0)
                    .cloned()
            },
        )?;
        let entry = PolicyListEntry::from(result_mv);
        response.push(entry)
    }
    Ok(response)
}

#[ic_cdk_macros::query]
pub fn get_policy_list_as_validator() -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    let result_pr = POLICY_REGISTRY_FOR_VALIDATORS.with(
        |pr: &RefCell<PolicyRegistryForValidators>| -> Vec<(PolicyID, Principal)> {
            let policy_registry = pr.borrow();
            policy_registry.get_policy_ids_as_validator(get_caller())
        },
    );

    let mut response = Vec::new();
    for item in result_pr {
        let user_vault_id: UUID = get_vault_id_for(item.1)?;
        let result_mv = USER_VAULT_STORE.with(
            |mv: &RefCell<UserVaultStore>| -> Result<Policy, SmartVaultErr> {
                mv.borrow()
                    .get_user_vault(&user_vault_id)?
                    .get_policy(&item.0)
                    .cloned()
            },
        )?;
        let entry = PolicyListEntry::from(result_mv);
        response.push(entry)
    }
    Ok(response)
}

#[ic_cdk_macros::query]
pub fn get_policy_list_as_owner() -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    USER_VAULT_STORE.with(|mv: &RefCell<UserVaultStore>| {
        let policies: Vec<Policy> = mv
            .borrow()
            .get_user_vault(&user_vault_id)?
            .policies()
            .clone()
            .into_values()
            .collect();
        Ok(policies.into_iter().map(PolicyListEntry::from).collect())
    })
}

#[ic_cdk_macros::update]
pub fn confirm_x_out_of_y_condition(
    owner: Principal,
    policy_id: PolicyID,
    status: bool,
) -> Result<(), SmartVaultErr> {
    // Get user vault of owner
    let user_vault_id: UUID = get_vault_id_for(owner)?;

    // Read policy
    let mut result_mv = USER_VAULT_STORE.with(
        |mv: &RefCell<UserVaultStore>| -> Result<Policy, SmartVaultErr> {
            mv.borrow()
                .get_user_vault(&user_vault_id)?
                .get_policy(&policy_id)
                .cloned()
        },
    )?;

    // Check that there is a XOutOfYCondition in the policy and that the caller is one of the confirmers
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
pub fn remove_policy(policy_id: String) -> Result<(), SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    USER_VAULT_STORE.with(
        |ms: &RefCell<UserVaultStore>| -> Result<(), SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.remove_user_policies(&user_vault_id, &policy_id)
        },
    )
}

#[ic_cdk_macros::update]
pub fn add_beneficiary(args: AddUserArgs) -> Result<User, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    USER_VAULT_STORE.with(
        |ms: &RefCell<UserVaultStore>| -> Result<User, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.add_beneficiary(&user_vault_id, args)
        },
    )
}

#[ic_cdk_macros::query]
pub fn get_beneficiary_list() -> Result<Vec<User>, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    USER_VAULT_STORE.with(|mv: &RefCell<UserVaultStore>| {
        let beneficiaries: Vec<User> = mv
            .borrow()
            .get_user_vault(&user_vault_id)?
            .beneficiaries()
            .clone()
            .into_values()
            .collect();
        Ok(beneficiaries.into_iter().map(User::from).collect())
    })
}

#[ic_cdk_macros::update]
pub fn update_beneficiary(u: User) -> Result<User, SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    USER_VAULT_STORE.with(
        |ms: &RefCell<UserVaultStore>| -> Result<User, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.update_user_beneficiary(&user_vault_id, u)
        },
    )
}

#[ic_cdk_macros::update]
pub fn remove_beneficiary(user_id: Principal) -> Result<(), SmartVaultErr> {
    let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal)?;

    USER_VAULT_STORE.with(
        |ms: &RefCell<UserVaultStore>| -> Result<(), SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            master_vault.remove_user_beneficiary(&user_vault_id, &user_id)
        },
    )
}

#[ic_cdk_macros::query]
pub fn is_user_vault_existing() -> bool {
    let principal = get_caller();
    if get_vault_id_for(principal).is_ok() {
        return true;
    }
    false
}

pub fn get_vault_id_for(principal: Principal) -> Result<UserVaultID, SmartVaultErr> {
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<UUID, SmartVaultErr> {
        let user_store = ur.borrow();
        let user = user_store.get_user(&principal)?;

        user.user_vault_id
            .ok_or_else(|| SmartVaultErr::UserVaultDoesNotExist("".to_string()))
    })
}

#[pre_upgrade]
fn pre_upgrade() {
    USER_VAULT_STORE.with(|ms| storage::stable_save((ms,)).unwrap());
    // USER_STORE.with(|ur| storage::stable_save((ur,)).unwrap());
    POLICY_REGISTRY_FOR_BENEFICIARIES.with(|tr| storage::stable_save((tr,)).unwrap());
    POLICY_REGISTRY_FOR_VALIDATORS.with(|tr| storage::stable_save((tr,)).unwrap());
    UUID_COUNTER.with(|c| storage::stable_save((c,)).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (old_ms,): (UserVaultStore,) = storage::stable_restore().unwrap();
    USER_VAULT_STORE.with(|ms| *ms.borrow_mut() = old_ms);

    // let (old_ur,): (UserStore,) = storage::stable_restore().unwrap();
    // USER_STORE.with(|ur| *ur.borrow_mut() = old_ur);

    let (old_tr,): (PolicyRegistryForBeneficiaries,) = storage::stable_restore().unwrap();
    POLICY_REGISTRY_FOR_BENEFICIARIES.with(|tr| *tr.borrow_mut() = old_tr);

    let (old_c,): (u128,) = storage::stable_restore().unwrap();
    UUID_COUNTER.with(|c| *c.borrow_mut() = old_c);
}

#[cfg(test)]
mod tests {}
