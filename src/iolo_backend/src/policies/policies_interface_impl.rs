use crate::policies::conditions::ConfirmXOutOfYConditionArgs;
use crate::policies::policy::UpdatePolicyArgs;
use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    secrets::{
        secret::{Secret, SecretListEntry},
        secrets_interface_impl::get_secret_impl,
    },
    smart_vaults::smart_vault::{POLICY_REGISTRIES, POLICY_STORE, SECRET_STORE, USER_STORE},
    users::user::PrincipalID,
};

use super::conditions;
use super::conditions_manager::evaluate_overall_conditions_status;
use super::policy::PolicyForValidator;
use super::{
    conditions::Condition,
    policy::{AddPolicyArgs, Policy, PolicyID, PolicyListEntry, PolicyWithSecretListEntries},
};

pub async fn add_policy_impl(
    apa: AddPolicyArgs,
    policy_owner: PrincipalID,
) -> Result<Policy, SmartVaultErr> {
    // we create the policy id in the backend
    let new_policy_id: String = UUID::new().await;

    // create policy from AddPolicyArgs
    let policy: Policy =
        Policy::from_add_policy_args(&new_policy_id, &policy_owner.to_string(), apa);

    // Add policy to the policy store (policies: StableBTreeMap<UUID, Policy, Memory>,)
    add_policy_to_policy_store(policy.clone())?;

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
        if let Condition::XOutOfYCondition(xoutofy) = condition {
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

    // TODO: check if caller is owner of policy

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
            Condition::XOutOfYCondition(xooy) => {
                let mut xooy_clone = xooy.clone();
                xooy_clone.validators = vec![]; // Reset the validators to an empty vector
                Some(Condition::XOutOfYCondition(xooy_clone)) // Return the modified condition
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

pub fn update_policy_impl(
    upa: UpdatePolicyArgs,
    caller: PrincipalID,
) -> Result<Policy, SmartVaultErr> {
    // check if policy exists
    let existing_policy = POLICY_STORE.with(|ps| {
        let policy_store = ps.borrow();
        policy_store.get(&upa.id)
    })?;

    // check if caller is owner of policy
    if existing_policy.owner() != &caller.to_string() {
        return Err(SmartVaultErr::PolicyDoesNotExist(upa.id));
    }

    // check if secrets in policy exist in secret store
    // check that caller is owner of the secrets
    // check that each secret is related in the key box
    for secret_id in upa.secrets.iter() {
        let s = SECRET_STORE.with(|ss| {
            let secret_store = ss.borrow();
            secret_store.get(secret_id)
        })?;

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
    let mut error = None;
    USER_STORE.with(|us| {
        let user_store = us.borrow();
        for beneficiary in upa.beneficiaries.iter() {
            if user_store.get_user(&beneficiary.to_string()).is_err() {
                error = Some(SmartVaultErr::UserDoesNotExist(beneficiary.to_string()));
                break;
            }
        }
    });
    if let Some(err) = error {
        return Err(err);
    }

    // create policy from AddPolicyArgs
    let policy: Policy = Policy::from_update_policy_args(
        &upa.id,
        &existing_policy.owner().to_string(),
        existing_policy.conditions_status,
        *existing_policy.date_created(),
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
        if let Condition::XOutOfYCondition(xoutofy) = condition {
            POLICY_REGISTRIES.with(|x| {
                let mut policy_registries = x.borrow_mut();
                policy_registries.update_policy_to_validators(&xoutofy.validators, policy.id());
            });
        }
    }

    Ok(updated_policy)
}

pub fn remove_policy_impl(policy_id: String, caller: PrincipalID) -> Result<(), SmartVaultErr> {
    // check if policy exists
    let policy: Policy = get_policy_from_policy_store(&policy_id)?;

    // check if caller is owner of policy
    if policy.owner() != &caller.to_string() {
        return Err(SmartVaultErr::PolicyDoesNotExist(policy.id));
    }

    // remove policy in policy store
    POLICY_STORE.with(|ps| {
        let mut policy_store = ps.borrow_mut();
        policy_store.remove_policy(&policy_id)
    })?;

    // remove policy from registry for beneficiaries (reverse index)
    POLICY_REGISTRIES.with(|pr| -> Result<(), SmartVaultErr> {
        let mut policy_registries = pr.borrow_mut();
        policy_registries.remove_policy_from_beneficiary(&policy);
        Ok(())
    })?;

    // remove policy from registry for validators (reverse index) if there is a XOutOfYCondition
    for condition in policy.conditions().iter() {
        if let Condition::XOutOfYCondition(xoutofy) = condition {
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
        if let Condition::XOutOfYCondition(x_out_of_y) = condition {
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

pub fn add_policy_to_policy_store(policy: Policy) -> Result<Policy, SmartVaultErr> {
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

#[cfg(test)]
mod tests {
    use candid::Principal;
    use rand::Rng;
    use std::collections::HashSet;

    use crate::policies::policy::UpdatePolicyArgs;
    use crate::{
        common::error::SmartVaultErr,
        policies::{
            conditions::{Condition, TimeBasedCondition, Validator, XOutOfYCondition},
            policies_interface_impl::{
                add_policy_impl, get_policy_as_beneficiary_impl, get_policy_as_owner_impl,
                get_policy_list_as_beneficiary_impl, get_policy_list_as_owner_impl,
                get_policy_list_as_validator_impl, update_policy_impl,
            },
            policy::{AddPolicyArgs, Policy, PolicyWithSecretListEntries},
        },
        secrets::{
            secret::AddSecretArgs,
            secrets_interface_impl::{add_secret_impl, get_secret_as_beneficiary_impl},
        },
        smart_vaults::smart_vault::POLICY_STORE,
        users::{
            user::{AddOrUpdateUserArgs, KeyBox},
            users_interface_impl::create_user_impl,
        },
    };

    #[tokio::test]
    async fn itest_policy_lifecycle() {
        let _ = create_principal();
        let principal = create_principal();
        let beneficiary = create_principal();
        let validator = create_principal();
        let validator2 = create_principal();

        // Create User and store it
        let mut aua: AddOrUpdateUserArgs = AddOrUpdateUserArgs {
            name: Some("Alice the main user".to_string()),
            email: None,
            user_type: None,
        };
        let _user_main = create_user_impl(aua.clone(), principal.to_string())
            .await
            .unwrap();
        aua.name = Some("Bob the beneficiary".to_string());
        let _user_alice = create_user_impl(aua.clone(), beneficiary.to_string()).await;
        aua.name = Some("Vic the validator".to_string());
        let _user_victor = create_user_impl(aua.clone(), validator.to_string()).await;
        aua.name = Some("Valeria the validator".to_string());
        let _user_valeria = create_user_impl(aua.clone(), validator2.to_string()).await;

        // Create a Secret
        let encrypted_symmetric_key: Vec<u8> = vec![1, 2, 3];

        let asa: AddSecretArgs = AddSecretArgs {
            category: None,
            name: Some("Google".to_string()),
            username: Some(vec![1, 2, 3]),
            password: Some(vec![1, 2, 3]),
            url: None,
            notes: Some(vec![1, 2, 3]),
            encrypted_symmetric_key,
        };

        // Add Secret
        let added_secret = add_secret_impl(asa.clone(), principal.to_string())
            .await
            .unwrap();

        // create a policy with a time based condition
        let time_based_condition: Condition = Condition::TimeBasedCondition(TimeBasedCondition {
            id: "My Time Based Condition".to_string(),
            number_of_days_since_last_login: 0,
            condition_status: false,
        });

        let x_out_of_y_condition: Condition = Condition::XOutOfYCondition(XOutOfYCondition {
            id: "My X out of Y Condition".to_string(),
            validators: vec![Validator {
                principal_id: validator.to_string(),
                status: false,
            }],
            quorum: 1,
            question: "When will you be happy?".to_string(),
            condition_status: false,
        });

        let apa: AddPolicyArgs = AddPolicyArgs {
            name: Some("Policy#1".to_string()),
            //beneficiaries: [beneficiary].iter().cloned().collect(),
            //secrets: HashSet::new(),
            //key_box: KeyBox::new(),
            //conditions_logical_operator: LogicalOperator::And,
            //conditions: vec![time_based_condition.clone(), x_out_of_y_condition.clone()],
        };
        //apa.secrets.insert(added_secret.id().to_string());
        let added_policy: Policy = add_policy_impl(apa.clone(), principal.to_string())
            .await
            .unwrap();

        // Update policy with other attributes
        let mut secrets = HashSet::new();
        let mut kb: KeyBox = KeyBox::new();
        kb.insert(added_secret.id().to_string(), vec![1, 2, 3]);
        secrets.insert(added_secret.id().to_string());
        let upa: UpdatePolicyArgs = UpdatePolicyArgs {
            id: added_policy.id().to_string(),
            name: added_policy.name,
            beneficiaries: [beneficiary.to_string()].iter().cloned().collect(),
            secrets,
            key_box: kb,
            conditions_logical_operator: None,
            conditions: vec![time_based_condition.clone(), x_out_of_y_condition.clone()],
        };
        let added_policy = update_policy_impl(upa, principal.to_string());
        assert!(added_policy.is_ok());
        let added_policy = added_policy.unwrap();

        // check if policy is in policy store and check if it contains the secret
        POLICY_STORE.with(|ps| {
            let policy_store = ps.borrow();
            let policy_in_store = policy_store.get(added_policy.id()).unwrap();
            assert_eq!(policy_in_store.id(), added_policy.id());
            assert_eq!(policy_in_store.name(), added_policy.name());
            assert_eq!(policy_in_store.secrets().len(), 1);
            assert_eq!(
                policy_in_store.secrets().iter().next().unwrap(),
                &added_secret.id().to_string()
            );
            assert_eq!(policy_in_store.beneficiaries().len(), 1);
            assert_eq!(policy_in_store.conditions().len(), 2)
        });

        // get policy list and check if policy is in there
        let policy_list = get_policy_list_as_owner_impl(principal.to_string()).unwrap();
        assert_eq!(policy_list.len(), 1);
        assert_eq!(&policy_list[0].id, added_policy.id());

        // get specific policy from proper interface implementation
        let mut fetched_policy: PolicyWithSecretListEntries =
            get_policy_as_owner_impl(added_policy.id().clone(), principal.to_string()).unwrap();
        assert_eq!(fetched_policy.secrets().len(), 1);
        assert_eq!(
            fetched_policy.secrets().iter().next().unwrap().id,
            added_secret.id()
        );
        assert_eq!(fetched_policy.beneficiaries.len(), 1);
        assert_eq!(fetched_policy.conditions.len(), 2);

        // get list of policies as beneficiary
        let policy_list_as_beneficiary =
            get_policy_list_as_beneficiary_impl(beneficiary.to_string()).unwrap();
        assert_eq!(policy_list_as_beneficiary.len(), 1);
        assert_eq!(&policy_list_as_beneficiary[0].id, added_policy.id());

        // get specific policy as beneficiary: this should fail, because policy has not yet been activated
        let policy_reponse =
            get_policy_as_beneficiary_impl(added_policy.id().clone(), beneficiary.to_string());
        assert!(policy_reponse.is_err_and(|e| matches!(e, SmartVaultErr::InvalidPolicyCondition)));

        // get policy list as validator
        let get_policy_list_as_validator =
            get_policy_list_as_validator_impl(validator.to_string()).unwrap();
        assert_eq!(get_policy_list_as_validator.len(), 1);
        assert_eq!(&get_policy_list_as_validator[0].id, added_policy.id());

        // get policy list as beneficiary: this should fail, because validator is not a beneficiary
        let get_policy_list_as_validator =
            get_policy_list_as_validator_impl(beneficiary.to_string());
        assert_eq!(get_policy_list_as_validator.unwrap().len(), 0);

        // get policy as validator: this souhld fail, because validator is not a beneficiary
        let policy_reponse =
            get_policy_as_beneficiary_impl(added_policy.id().clone(), validator.to_string());
        assert!(
            policy_reponse.is_err_and(|e| matches!(e, SmartVaultErr::NoPolicyForBeneficiary(_)))
        );

        // UPDATE POLICY NAME and BENEFICIARIES
        let mut beneficiaries = HashSet::new();
        beneficiaries.insert(beneficiary.to_string());
        beneficiaries.insert(validator.to_string());
        let upa: UpdatePolicyArgs = UpdatePolicyArgs {
            id: added_policy.id().to_string(),
            name: Some("new policy updates".to_string()),
            beneficiaries,
            secrets: added_policy.secrets.clone(),
            key_box: added_policy.key_box.clone(),
            conditions_logical_operator: added_policy.conditions_logical_operator().clone(),
            conditions: added_policy.conditions.clone(),
        };

        let updated_policy = update_policy_impl(upa.clone(), principal.to_string());
        assert!(updated_policy.is_ok());
        let updated_policy = updated_policy.unwrap();
        assert_eq!(updated_policy.name(), &upa.name);
        assert!(updated_policy
            .beneficiaries()
            .contains(&validator.to_string()));
        assert!(updated_policy
            .beneficiaries()
            .contains(&beneficiary.to_string()));

        // UPDATE POLICY CONDITIONS
        let time_based_condition: Condition = Condition::TimeBasedCondition(TimeBasedCondition {
            id: "My Time Based Condition number two".to_string(),
            number_of_days_since_last_login: 100,
            condition_status: false,
        });

        let x_out_of_y_condition: Condition = Condition::XOutOfYCondition(XOutOfYCondition {
            id: "My X out of Y Condition".to_string(),
            validators: vec![Validator {
                principal_id: validator2.to_string(),
                status: false,
            }],
            quorum: 1,
            question: "Do I live on the moon?".to_string(),
            condition_status: false,
        });

        let mut beneficiaries = HashSet::new();
        beneficiaries.insert(validator.to_string());
        let upa: UpdatePolicyArgs = UpdatePolicyArgs {
            id: updated_policy.id().to_string(),
            name: updated_policy.name,
            beneficiaries: updated_policy.beneficiaries,
            secrets: updated_policy.secrets,
            key_box: updated_policy.key_box,
            conditions_logical_operator: added_policy.conditions_logical_operator().clone(),
            conditions: vec![time_based_condition, x_out_of_y_condition],
        };

        let updated_policy = update_policy_impl(upa, principal.to_string());
        assert!(updated_policy.is_ok());
        // let updated_policy = updated_policy.unwrap();
        let policy_list_as_old_validator = get_policy_list_as_validator_impl(validator.to_string());
        let policy_list_as_new_validator =
            get_policy_list_as_validator_impl(validator2.to_string());
        assert_eq!(policy_list_as_old_validator.unwrap().len(), 0);
        assert_eq!(policy_list_as_new_validator.unwrap().len(), 1);
        let updated_policy = updated_policy.unwrap();

        // test get secret as beneficiary

        // this should return an error, because the policy has not been activated
        let secret_as_beneficiary = get_secret_as_beneficiary_impl(
            added_secret.id().to_string(),
            updated_policy.id,
            beneficiary.to_string(),
        );
        assert!(secret_as_beneficiary
            .is_err_and(|e| matches!(e, SmartVaultErr::InvalidPolicyCondition)));
    }

    fn create_principal() -> Principal {
        // create random u8
        let mut rng = rand::thread_rng();

        // create random u8 array
        let mut random_u8_array: [u8; 29] = [0; 29];
        rng.fill(&mut random_u8_array[..]);
        Principal::from_slice(&random_u8_array)
    }
}
