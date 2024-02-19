use crate::policies::conditions::ConfirmXOutOfYConditionArgs;
use crate::policies::policy::UpdatePolicyArgs;
use crate::secrets::secrets_interface_impl::get_secret_from_secret_store;
use crate::users::users_interface_impl::get_user_from_user_store;
use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    secrets::{
        secret::{Secret, SecretListEntry},
        secrets_interface_impl::get_secret_impl,
    },
    smart_vaults::smart_vault::{POLICY_REGISTRIES, POLICY_STORE, SECRET_STORE, USER_STORE},
    users::user::PrincipalID,
};

use super::conditions::ConditionUpdate;
use super::conditions_manager::evaluate_overall_conditions_status;
use super::policy::PolicyForValidator;
use super::{
    conditions::Condition,
    policy::{CreatePolicyArgs, Policy, PolicyID, PolicyListEntry, PolicyWithSecretListEntries},
};

pub async fn create_policy_impl(
    apa: CreatePolicyArgs,
    policy_owner: PrincipalID,
) -> Result<Policy, SmartVaultErr> {
    // we create the policy id in the backend
    let new_policy_id: String = UUID::new().await;

    // create policy from AddPolicyArgs
    let policy: Policy =
        Policy::from_create_policy_args(&new_policy_id, &policy_owner.to_string(), apa);

    // Add policy to the policy store (policies: StableBTreeMap<UUID, Policy, Memory>,)
    create_policy_in_policy_store(policy.clone())?;

    // add the policy id to the user in the USER_STORE
    USER_STORE.with(|us| {
        let mut user_store = us.borrow_mut();
        user_store.add_policy_to_user(&policy_owner.to_string(), policy.id().clone())
    })?;

    // Add entry to policy registry for beneficiaries (reverse index)
    POLICY_REGISTRIES.with(|pr| -> Result<(), SmartVaultErr> {
        let mut policy_registries = pr.borrow_mut();
        policy_registries.add_policy_to_beneficiary(&policy);
        Ok(())
    })?;

    // Add entry to policy registry for validators (reverse index) if there is a XOutOfYCondition
    for condition in policy.conditions().iter() {
        if let Condition::XOutOfY(xoutofy) = condition {
            POLICY_REGISTRIES.with(|x| {
                let mut policy_registries = x.borrow_mut();
                policy_registries.add_policy_to_validators(&xoutofy.validators, policy.id());
            });
        }
    }

    Ok(policy)
}

pub fn get_policy_as_owner_impl(
    policy_id: PolicyID,
    caller: PrincipalID,
) -> Result<PolicyWithSecretListEntries, SmartVaultErr> {
    // get policy from policy store
    let policy: Policy = get_policy_from_policy_store(&policy_id)?;

    let mut policy_response = PolicyWithSecretListEntries::from(policy.clone());
    for secret_id in policy.secrets() {
        // get secret from secret store
        let secret: Secret = get_secret_impl(secret_id.to_string(), caller.to_string())?;
        let secret_list_entry = SecretListEntry {
            id: secret.id().to_string(),
            category: secret.category(),
            name: secret.name(),
        };
        policy_response.secrets().insert(secret_list_entry);
    }
    Ok(policy_response)
}

pub fn get_policy_list_as_owner_impl(
    caller: PrincipalID,
) -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    // get policy ids from user in user store
    let policy_ids: Vec<PolicyID> = USER_STORE.with(|us| {
        let user_store = us.borrow();
        let user = user_store.get_user(&caller.to_string()).unwrap();
        user.policies().clone()
    });

    // get all the corresponding policies
    let policies = get_policies_from_policy_store(policy_ids)?;

    Ok(policies.into_iter().map(PolicyListEntry::from).collect())
}

pub fn get_policy_as_beneficiary_impl(
    policy_id: PolicyID,
    beneficiary: PrincipalID,
) -> Result<PolicyWithSecretListEntries, SmartVaultErr> {
    // get policy from policy store
    let policy: Policy = get_policy_from_policy_store(&policy_id)?;

    // Ensure beneficiary is in policy.beneficiaries
    if !policy.beneficiaries().contains(&beneficiary.to_string()) {
        return Err(SmartVaultErr::NoPolicyForBeneficiary(format!(
            "Beneficiary {:?} is not beneficient of policy {:?}",
            beneficiary, policy_id
        )));
    };

    // Check that beneficiary is allowed to read the policy
    if *policy.conditions_status() {
        // Get secrets from defined in policy
        let mut policy_for_beneficiary = PolicyWithSecretListEntries::from(policy.clone());
        for secret_ref in policy.secrets() {
            let secret = SECRET_STORE.with(|ss| {
                let secret_store = ss.borrow();
                secret_store.get(secret_ref)
            })?;
            let secret_list_entry = SecretListEntry {
                id: secret.id(),
                category: secret.category(),
                name: secret.name(),
            };
            policy_for_beneficiary.secrets().insert(secret_list_entry);
        }
        Ok(policy_for_beneficiary)
    } else {
        Err(SmartVaultErr::InvalidPolicyCondition)
    }
}

pub fn get_policy_as_validator_impl(
    policy_id: PolicyID,
    validator: PrincipalID,
) -> Result<PolicyForValidator, SmartVaultErr> {
    // get policy from policy store
    let policy: Policy = get_policy_from_policy_store(&policy_id)?;

    // Get all the policies for the validator
    let validator_policies =
        POLICY_REGISTRIES.with(|pr| -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
            let policy_registries = pr.borrow();
            policy_registries.get_policy_ids_as_validator(&validator.to_string())
        })?;

    if !validator_policies.into_iter().any(|p| p.id == policy_id) {
        // caller is not a validator of policy
        return Err(SmartVaultErr::NoPolicyForValidator(format!(
            "Validator {:?} is not validator of policy {:?}",
            validator, policy_id
        )));
    };

    // we return only the xooy conditions and filter out some fields
    let filtered_xooy_conditions: Vec<Condition> = policy
        .conditions()
        .into_iter()
        .filter_map(|c| match c {
            Condition::XOutOfY(xooy) => {
                let mut xooy_clone = xooy.clone();
                xooy_clone.validators = vec![]; // Reset the validators to an empty vector
                Some(Condition::XOutOfY(xooy_clone)) // Return the modified condition
            }
            _ => None,
        })
        .collect();

    let pfv: PolicyForValidator = PolicyForValidator {
        id: policy.id().to_string(),
        owner: policy.owner().to_string(),
        xooy_conditions: filtered_xooy_conditions,
    };

    Ok(pfv)
}

pub fn get_policy_list_as_beneficiary_impl(
    caller: PrincipalID,
) -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    // get all policy ids for caller by checking the policy registry index for beneficiaries
    POLICY_REGISTRIES.with(|pr| {
        let policy_registries = pr.borrow();
        policy_registries.get_policy_ids_as_beneficiary(&caller.to_string())
    })
}

pub fn get_policy_list_as_validator_impl(
    validator: PrincipalID,
) -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    // get all policy ids for caller by checking the policy registry index for validators
    POLICY_REGISTRIES.with(|pr| -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
        let policy_registries = pr.borrow();
        policy_registries.get_policy_ids_as_validator(&validator.to_string())
    })
}

/// Update notes: This is a full update, meaning
/// 1) provided ConditionUpdates with existing IDs will update the existing conditions
/// 2) provided ConditionUpdates without IDs (None) will create new conditions
/// 3) existing conditions without a matching ConditionUpdate will be removed
pub async fn update_policy_impl(
    upa: UpdatePolicyArgs,
    caller: PrincipalID,
) -> Result<Policy, SmartVaultErr> {
    // check if policy exists
    let old_policy: Policy = get_policy_from_policy_store(&upa.id)?;

    // check if caller is owner of policy
    if old_policy.owner() != &caller {
        return Err(SmartVaultErr::CallerNotPolicyOwner(upa.id));
    }

    // check if secrets in policy exist in secret store
    // check that caller is owner of the secrets
    // check that each secret is related in the key box
    for secret_id in upa.secrets.iter() {
        let s = get_secret_from_secret_store(secret_id)?;

        if s.owner() != caller {
            return Err(SmartVaultErr::SecretDoesNotExist(s.id.to_string()));
        }

        if !upa.key_box.contains_key(secret_id) {
            return Err(SmartVaultErr::KeyBoxEntryDoesNotExistForSecret(
                secret_id.to_string(),
            ));
        }
    }

    // Check that each key_box_id in the update policy args exists in the secrets
    for key_box_id in upa.key_box.keys() {
        if !upa.secrets.contains(key_box_id) {
            return Err(SmartVaultErr::SecretEntryDoesNotExistForKeyBoxEntry(
                key_box_id.to_string(),
            ));
        }
    }

    // Check that beneficiaries exist in user store
    for beneficiary in upa.beneficiaries.iter() {
        if get_user_from_user_store(&beneficiary.to_string()).is_err() {
            return Err(SmartVaultErr::UserDoesNotExist(beneficiary.to_string()));
        }
    }

    // let's keep track of the new conditions
    let mut new_final_condition_set: Vec<Condition> = vec![];

    // Find out which conditions are brand new and which conditions need updates
    for uc in upa.conditions.iter() {
        match uc.id() {
            Some(existing_id) => {
                // This is an existing condition which needs to be updated
                // ensure that the condition exists in the old policy
                if !old_policy.conditions.iter().any(|c| c.id() == existing_id) {
                    return Err(SmartVaultErr::PolicyConditionDoesNotExist(
                        existing_id.to_string(),
                    ));
                }
                let mut existing_condition: Condition = old_policy
                    .conditions
                    .iter()
                    .find(|c| c.id() == existing_id)
                    .unwrap()
                    .clone();
                let updated_condition: Condition = existing_condition.update_condition(uc.clone());
                new_final_condition_set.push(updated_condition);
            }
            None => {
                // we have a brand new condition
                let new_condition: Condition = Condition::from_update_condition(uc.clone()).await;
                new_final_condition_set.push(new_condition);
            }
        }
    }

    // Create policy from UpdatePolicyArgs
    let policy: Policy = Policy::from_update_policy_args(
        &upa.id,
        &old_policy.owner().to_string(),
        old_policy.conditions_status,
        *old_policy.date_created(),
        new_final_condition_set,
        upa.clone(),
    );

    // update policy in policy store
    let updated_policy = update_policy_in_policy_store(policy.clone())?;

    // Update registry for beneficiaries (reverse index)
    POLICY_REGISTRIES.with(|pr| -> Result<(), SmartVaultErr> {
        let mut policy_registries = pr.borrow_mut();
        policy_registries.update_policy_to_beneficiary(&policy)?;
        Ok(())
    })?;

    // Update policy registry for validators (reverse index) if there is a XOutOfYCondition
    for condition in policy.conditions().iter() {
        if let Condition::XOutOfY(xoutofy) = condition {
            POLICY_REGISTRIES.with(|x| {
                let mut policy_registries = x.borrow_mut();
                policy_registries.update_policy_to_validators(&xoutofy.validators, policy.id());
            });
        }
    }

    Ok(updated_policy)
}

pub fn delete_policy_impl(policy_id: String, caller: PrincipalID) -> Result<(), SmartVaultErr> {
    // check if policy exists
    let policy: Policy = get_policy_from_policy_store(&policy_id)?;

    // check if caller is owner of policy
    if policy.owner() != &caller.to_string() {
        return Err(SmartVaultErr::PolicyDoesNotExist(policy.id));
    }

    // delete policy in policy store
    POLICY_STORE.with(|ps| {
        let mut policy_store = ps.borrow_mut();
        policy_store.delete_policy(&policy_id)
    })?;

    // remove policy from registry for beneficiaries (reverse index)
    POLICY_REGISTRIES.with(|pr| -> Result<(), SmartVaultErr> {
        let mut policy_registries = pr.borrow_mut();
        policy_registries.remove_policy_from_beneficiary(&policy);
        Ok(())
    })?;

    // remove policy from registry for validators (reverse index) if there is a XOutOfYCondition
    for condition in policy.conditions().iter() {
        if let Condition::XOutOfY(xoutofy) = condition {
            POLICY_REGISTRIES.with(|x| {
                let mut policy_registries = x.borrow_mut();
                policy_registries.remove_policy_from_validators(&xoutofy.validators, policy.id());
            });
        }
    }

    // remove policy from user
    USER_STORE.with(|us| {
        let mut user_store = us.borrow_mut();
        user_store.remove_policy_from_user(&caller.to_string(), policy_id)
    })?;

    Ok(())
}

/// A validator confirming the status of the policy
/// ConfirmXOutOfYConditionArgs contains policy_id (PolicyID) and status (bool)
pub fn confirm_x_out_of_y_condition_impl(
    args: ConfirmXOutOfYConditionArgs,
    validator: PrincipalID,
) -> Result<(), SmartVaultErr> {
    // fetch policy from policy store and check if caller is beneficiary
    let mut policy: Policy;
    if let Ok(p) = get_policy_from_policy_store(&args.policy_id) {
        policy = p;
    } else {
        return Err(SmartVaultErr::PolicyDoesNotExist(args.policy_id));
    }

    let mut policy_needs_update = false;
    for condition in &mut policy.conditions {
        if let Condition::XOutOfY(x_out_of_y) = condition {
            for v in &mut x_out_of_y.validators {
                if v.principal_id == validator {
                    // there is a condition for which the validator is authorized validator
                    v.status = args.status;
                    policy_needs_update = true;
                }
            }
        }
        // check if the XooY condition has reached quorum
        condition.evaluate(None);
    }

    if policy_needs_update {
        update_policy_in_policy_store(policy.clone())?;
        evaluate_overall_conditions_status(policy.id())?;
    };

    Ok(())
}

/**
 * Helper CRUD functions
 */

pub fn create_policy_in_policy_store(policy: Policy) -> Result<Policy, SmartVaultErr> {
    POLICY_STORE.with(|ps| {
        let mut policy_store = ps.borrow_mut();
        policy_store.add_policy(policy.clone())
    })
}

pub fn get_policy_from_policy_store(policy_id: &PolicyID) -> Result<Policy, SmartVaultErr> {
    POLICY_STORE.with(|ps| -> Result<Policy, SmartVaultErr> {
        let policy_store = ps.borrow();
        policy_store.get(policy_id)
    })
}

pub fn get_policies_from_policy_store(
    policy_ids: Vec<String>,
) -> Result<Vec<Policy>, SmartVaultErr> {
    policy_ids
        .iter()
        .map(get_policy_from_policy_store)
        .collect()
}

pub fn update_policy_in_policy_store(policy: Policy) -> Result<Policy, SmartVaultErr> {
    POLICY_STORE.with(|ps| {
        let mut policy_store = ps.borrow_mut();
        policy_store.update_policy(policy.clone())
    })
}
