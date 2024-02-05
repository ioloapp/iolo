use std::cell::RefCell;

use candid::Principal;
use ic_cdk::{post_upgrade, pre_upgrade, storage};

use crate::common::error::SmartVaultErr;
use crate::common::uuid::UUID;
use crate::policies::policies_interface_impl::{
    add_policy_impl, get_policy_as_beneficiary_impl, get_policy_as_owner_impl,
    get_policy_list_as_beneficiary_impl, get_policy_list_as_owner_impl,
    get_policy_list_as_validator_impl, remove_policy_impl, update_policy_impl,
};
use crate::policies::policy::PolicyResponse;
use crate::policies::policy::{AddPolicyArgs, Policy, PolicyID, PolicyListEntry};
use crate::policies::policy_registries::{
    PolicyRegistries, PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE,
    PolicyRegistryForValidators_DO_NOT_USE_ANYMORE,
};
use crate::policies::policy_store::PolicyStore;
use crate::secrets::secret::{
    AddSecretArgs, Secret, SecretID, SecretListEntry, SecretSymmetricCryptoMaterial,
    UpdateSecretArgs,
};
use crate::secrets::secret_store::SecretStore;
use crate::secrets::secrets_interface_impl::{
    add_secret_impl, get_secret_as_beneficiary_impl, get_secret_impl, get_secret_list_impl,
    get_secret_symmetric_crypto_material_impl, remove_secret_impl, update_secret_impl,
};
use crate::user_vaults::user_vault::UserVaultID;
use crate::user_vaults::user_vault_store_DO_NOT_USE_ANYMORE::UserVaultStore_DO_NOT_USE_ANYMORE;
use crate::users::contact::{AddContactArgs, Contact};
use crate::users::user::{AddUserArgs, User};
use crate::users::user_store::UserStore;
use crate::users::users_interface_impl::{
    add_contact_impl, create_user_impl, delete_user_impl, get_contact_list_impl,
    get_current_user_impl, remove_contact_impl, update_contact_impl, update_user_impl,
    update_user_login_date_impl,
};
use crate::utils::caller::get_caller;

thread_local! {
    // User vault store holding all the user vaults
    pub static USER_VAULT_STORE_DO_NOT_USE_ANYMORE: RefCell<UserVaultStore_DO_NOT_USE_ANYMORE> = RefCell::new(UserVaultStore_DO_NOT_USE_ANYMORE::new());

    // User Store
    pub static USER_STORE: RefCell<UserStore> = RefCell::new(UserStore::new());

    // Secret Store
    pub static SECRET_STORE: RefCell<SecretStore> = RefCell::new(SecretStore::new());

    // Policy (fka Testament) Store
    pub static POLICY_STORE: RefCell<PolicyStore> = RefCell::new(PolicyStore::new());

    // Policy Registry for beneficiaries and validators
    pub static POLICY_REGISTRIES: RefCell<PolicyRegistries> = RefCell::new(PolicyRegistries::new());

    // policy Registry for beneficiaries
    pub static POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE: RefCell<PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE> = RefCell::new(PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE::new());

    // policy Registry for validators
    pub static POLICY_REGISTRY_FOR_VALIDATORS_DO_NOT_USE_ANYMORE: RefCell<PolicyRegistryForValidators_DO_NOT_USE_ANYMORE> = RefCell::new(PolicyRegistryForValidators_DO_NOT_USE_ANYMORE::new());

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
    get_current_user_impl(&get_caller())
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
    get_secret_as_beneficiary_impl(sid, policy_id, &get_caller())
}

#[ic_cdk_macros::query]
pub fn get_secret_symmetric_crypto_material_as_beneficiary(
    secret_id: UUID,
    policy_id: PolicyID,
) -> Result<SecretSymmetricCryptoMaterial, SmartVaultErr> {
    let principal = get_caller();

    // Verify that beneficiary belongs to policy
    let result_tr = POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE.with(
        |tr: &RefCell<PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE>| -> Result<(PolicyID, Principal), SmartVaultErr> {
            let policy_registry = tr.borrow();
            policy_registry.get_policy_id_as_beneficiary(principal, policy_id.clone())
        },
    )?;

    // Get user vault of owner
    let user_vault_id: UUID = get_vault_id_for_DO_NOT_USE_ANYMORE(result_tr.1)?;

    // Read policy
    let result_mv = USER_VAULT_STORE_DO_NOT_USE_ANYMORE.with(
        |mv: &RefCell<UserVaultStore_DO_NOT_USE_ANYMORE>| -> Result<Policy, SmartVaultErr> {
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
    owner: Principal,
    policy_id: PolicyID,
    status: bool,
) -> Result<(), SmartVaultErr> {
    // Get user vault of owner
    let user_vault_id: UUID = get_vault_id_for_DO_NOT_USE_ANYMORE(owner)?;

    // Read policy
    let mut result_mv = USER_VAULT_STORE_DO_NOT_USE_ANYMORE.with(
        |mv: &RefCell<UserVaultStore_DO_NOT_USE_ANYMORE>| -> Result<Policy, SmartVaultErr> {
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
pub fn remove_contact(id: Principal) -> Result<(), SmartVaultErr> {
    remove_contact_impl(id, &get_caller())
}

pub fn get_vault_id_for_DO_NOT_USE_ANYMORE(
    principal: Principal,
) -> Result<UserVaultID, SmartVaultErr> {
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<UUID, SmartVaultErr> {
        let user_store = ur.borrow();
        let user = user_store.get_user(&principal)?;

        user.user_vault_id_DO_NOT_USE_ANYMORE
            .ok_or_else(|| SmartVaultErr::UserVaultDoesNotExist("".to_string()))
    })
}

#[pre_upgrade]
fn pre_upgrade() {
    USER_VAULT_STORE_DO_NOT_USE_ANYMORE.with(|ms| storage::stable_save((ms,)).unwrap());
    // USER_STORE.with(|ur| storage::stable_save((ur,)).unwrap());
    POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE
        .with(|tr| storage::stable_save((tr,)).unwrap());
    POLICY_REGISTRY_FOR_VALIDATORS_DO_NOT_USE_ANYMORE
        .with(|tr| storage::stable_save((tr,)).unwrap());
    UUID_COUNTER.with(|c| storage::stable_save((c,)).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (old_ms,): (UserVaultStore_DO_NOT_USE_ANYMORE,) = storage::stable_restore().unwrap();
    USER_VAULT_STORE_DO_NOT_USE_ANYMORE.with(|ms| *ms.borrow_mut() = old_ms);

    // let (old_ur,): (UserStore,) = storage::stable_restore().unwrap();
    // USER_STORE.with(|ur| *ur.borrow_mut() = old_ur);

    let (old_tr,): (PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE,) =
        storage::stable_restore().unwrap();
    POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE.with(|tr| *tr.borrow_mut() = old_tr);

    let (old_c,): (u128,) = storage::stable_restore().unwrap();
    UUID_COUNTER.with(|c| *c.borrow_mut() = old_c);
}

#[cfg(test)]
mod tests {}
