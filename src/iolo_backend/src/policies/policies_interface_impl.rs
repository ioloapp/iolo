use std::{cell::RefCell, collections::HashSet};

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    secrets::{
        secret::{Secret, SecretListEntry},
        secrets_interface_impl::get_secret_impl,
    },
    smart_vaults::smart_vault::{POLICY_REGISTRIES, POLICY_STORE, SECRET_STORE, USER_STORE},
    users::user::PrincipalID,
};

use super::{
    conditions::Condition,
    policy::{AddPolicyArgs, Policy, PolicyID, PolicyListEntry, PolicyResponse},
    policy_store::PolicyStore,
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
    POLICY_STORE.with(
        |policy_store_rc: &RefCell<PolicyStore>| -> Result<Policy, SmartVaultErr> {
            let mut policy_store = policy_store_rc.borrow_mut();
            policy_store.add_policy(policy.clone())
        },
    )?;

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
) -> Result<PolicyResponse, SmartVaultErr> {
    // get policy from policy store
    let policy: Policy = get_policy_from_policy_store(&policy_id)?;

    // TODO: check if caller is owner of policy

    let mut policy_response = PolicyResponse::from(policy.clone());
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
    let policies: Vec<Policy> = POLICY_STORE.with(|ps| {
        let policy_store = ps.borrow();
        let policies: Vec<Policy> = policy_ids
            .iter()
            .map(|pid| policy_store.get(pid).unwrap())
            .collect();
        policies
    });

    Ok(policies.into_iter().map(PolicyListEntry::from).collect())
}

///
pub fn get_policy_as_beneficiary_impl(
    policy_id: PolicyID,
    beneficiary: PrincipalID,
) -> Result<PolicyResponse, SmartVaultErr> {
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
        let mut policy_for_beneficiary = PolicyResponse::from(policy.clone());
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

pub fn update_policy_impl(policy: Policy, caller: PrincipalID) -> Result<Policy, SmartVaultErr> {
    // check if policy exists
    POLICY_STORE.with(|ps| {
        let policy_store = ps.borrow();
        policy_store.get(policy.id())
    })?;

    // check if caller is owner of policy
    if policy.owner() != &caller.to_string() {
        return Err(SmartVaultErr::OnlyOwnerCanUpdatePolicy(format!(
            "Caller {:?} is not owner of policy {:?}",
            caller,
            policy.id()
        )));
    }

    // check if secrets in policy exist in secret store
    for secret_id in policy.secrets.iter() {
        SECRET_STORE.with(|ss| {
            let secret_store = ss.borrow();
            secret_store.get(secret_id)
        })?;
    }

    // update policy in policy store
    let updated_policy = POLICY_STORE.with(|ps| {
        let mut policy_store = ps.borrow_mut();
        policy_store.update_policy(policy.clone())
    })?;

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
        return Err(SmartVaultErr::OnlyOwnerCanUpdatePolicy(format!(
            "Caller {:?} is not owner of policy {:?}",
            caller,
            policy.id()
        )));
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

    Ok(())
}

pub fn confirm_x_out_of_y_condition_impl(
    policy_owner: PrincipalID,
    policy_id: PolicyID,
    status: bool,
    validator: PrincipalID,
) -> Result<(), SmartVaultErr> {
    // fetch policy from policy store and check if caller is beneficiary
    let mut policy: Policy;
    if let Ok(p) = get_policy_from_policy_store(&policy_id) {
        // check if the caller is a beneficiary of the policy
        if !p.owner().eq(&policy_owner) {
            return Err(SmartVaultErr::CallerNotPolicyOwner(policy_id));
        }
        policy = p;
    } else {
        return Err(SmartVaultErr::PolicyDoesNotExist(policy_id));
    }

    // Check that there is a XOutOfYCondition in the policy and that the caller is one of the confirmers
    match policy.find_validator_mut(&validator.to_string()) {
        Some(confirmer) => {
            // Modify the confirmer as needed
            confirmer.status = status;
            Ok(())
        }
        None => Err(SmartVaultErr::Unauthorized),
    }
}

pub fn get_policy_from_policy_store(policy_id: &PolicyID) -> Result<Policy, SmartVaultErr> {
    POLICY_STORE.with(|ps| -> Result<Policy, SmartVaultErr> {
        let policy_store = ps.borrow();
        policy_store.get(policy_id)
    })
}

pub fn get_policies_from_policy_store(
    policy_ids: HashSet<String>,
) -> Result<Vec<Policy>, SmartVaultErr> {
    policy_ids
        .iter()
        .map(get_policy_from_policy_store)
        .collect()
}

#[cfg(test)]
mod tests {

    use candid::Principal;
    use rand::Rng;

    use crate::{
        common::error::SmartVaultErr,
        policies::{
            conditions::{Condition, TimeBasedCondition, Validator, XOutOfYCondition},
            policies_interface_impl::{
                add_policy_impl, get_policy_as_beneficiary_impl, get_policy_as_owner_impl,
                get_policy_list_as_beneficiary_impl, get_policy_list_as_owner_impl,
                get_policy_list_as_validator_impl, update_policy_impl,
            },
            policy::{AddPolicyArgs, Policy, PolicyResponse},
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
        let aua: AddOrUpdateUserArgs = AddOrUpdateUserArgs {
            name: Some("donald".to_string()),
            email: None,
            user_type: None,
        };
        let _new_user = create_user_impl(aua, principal.to_string()).await.unwrap();

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
                id: validator.to_string(),
                status: false,
            }],
            quorum: 1,
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
        let mut added_policy: Policy = add_policy_impl(apa.clone(), principal.to_string())
            .await
            .unwrap();

        // Update policy with other attributes
        added_policy.beneficiaries = [beneficiary.to_string()].iter().cloned().collect();
        added_policy.secrets.insert(added_secret.id().to_string());
        added_policy.key_box = KeyBox::new();
        added_policy.conditions = vec![time_based_condition.clone(), x_out_of_y_condition.clone()];
        let added_policy = update_policy_impl(added_policy.clone(), principal.to_string());
        assert!(added_policy.is_ok());
        let mut added_policy = added_policy.unwrap();

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
        let mut fetched_policy: PolicyResponse =
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
        assert!(policy_reponse.is_err_and(|e| match e {
            SmartVaultErr::InvalidPolicyCondition => true,
            _ => false,
        }));

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
        assert!(policy_reponse.is_err_and(|e| match e {
            SmartVaultErr::NoPolicyForBeneficiary(_) => true,
            _ => false,
        }));

        // UPDATE POLICY NAME and BENEFICIARIES
        added_policy.name = Some("new policy updates".to_string());
        added_policy.beneficiaries.insert(validator.to_string());
        let updated_policy = update_policy_impl(added_policy.clone(), principal.to_string());
        assert!(updated_policy.is_ok());
        let mut updated_policy = updated_policy.unwrap();
        assert_eq!(updated_policy.name(), added_policy.name());
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
                id: validator2.to_string(),
                status: false,
            }],
            quorum: 1,
            condition_status: false,
        });
        updated_policy.conditions = vec![time_based_condition, x_out_of_y_condition];
        let updated_policy = update_policy_impl(updated_policy.clone(), principal.to_string());
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
        assert!(secret_as_beneficiary.is_err_and(|e| match e {
            SmartVaultErr::InvalidPolicyCondition => true,
            _ => false,
        }));
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
