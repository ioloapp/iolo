use std::cell::RefCell;

use candid::Principal;
use ic_stable_structures::vec;

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    secrets::{
        secret::{Secret, SecretListEntry},
        secrets_interface_impl::get_secret_impl,
    },
    smart_vaults::smart_vault::{POLICY_REGISTRIES, POLICY_STORE, SECRET_STORE, USER_STORE},
};

use super::{
    conditions::Condition,
    policy::{AddPolicyArgs, Policy, PolicyID, PolicyListEntry, PolicyResponse},
    policy_store::PolicyStore,
};

pub async fn add_policy_impl(
    apa: AddPolicyArgs,
    caller: &Principal,
) -> Result<Policy, SmartVaultErr> {
    let mut policy: Policy = Policy::from(apa);

    // we create the policy id in the backend
    let new_policy_id: String = UUID::new_random().await.into();
    policy.id = new_policy_id.clone();

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
        user_store.add_policy_to_user(caller, policy.id().clone())
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
    caller: &Principal,
) -> Result<PolicyResponse, SmartVaultErr> {
    // get policy from policy store
    let policy: Policy = POLICY_STORE.with(|ps| -> Result<Policy, SmartVaultErr> {
        let policy_store = ps.borrow();
        policy_store.get(&policy_id)
    })?;

    // TODO: check if caller is owner of policy

    let mut policy_response = PolicyResponse::from(policy.clone());
    for secret_id in policy.secrets() {
        // get secret from secret store
        let secret: Secret = get_secret_impl(UUID::from(secret_id.to_string()), caller)?;
        let secret_list_entry = SecretListEntry {
            id: secret.id(),
            category: secret.category(),
            name: secret.name(),
        };
        policy_response.secrets().insert(secret_list_entry);
    }
    Ok(policy_response)
}

pub fn get_policy_list_as_owner_impl(
    caller: &Principal,
) -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    // get policy ids from user in user store
    let policy_ids: Vec<PolicyID> = USER_STORE.with(|us| {
        let user_store = us.borrow();
        let user = user_store.get_user(&caller).unwrap();
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

pub fn get_policy_as_beneficiary_impl(
    policy_id: PolicyID,
    beneficiary: &Principal,
) -> Result<PolicyResponse, SmartVaultErr> {
    // get policy from policy store
    let policy: Policy = POLICY_STORE.with(|ps| -> Result<Policy, SmartVaultErr> {
        let policy_store = ps.borrow();
        policy_store.get(&policy_id)
    })?;

    // Ensure beneficiary is in policy.beneficiaries
    if !policy.beneficiaries().contains(beneficiary) {
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
                secret_store.get(&UUID::from(secret_ref.to_string()))
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
    caller: &Principal,
) -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
    // get all policy ids for caller by checking the policy registry index for beneficiaries
    POLICY_REGISTRIES.with(|pr| {
        let policy_registries = pr.borrow();
        policy_registries.get_policy_ids_as_beneficiary(caller)
    })
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use candid::Principal;
    use rand::Rng;

    use crate::{
        common::error::SmartVaultErr,
        policies::policies_interface_impl::{
            add_policy_impl, get_policy_list_as_beneficiary_impl, get_policy_list_as_owner_impl,
        },
        policies::{
            conditions::{Condition, TimeBasedCondition, Validator, XOutOfYCondition},
            policies_interface_impl::{get_policy_as_beneficiary_impl, get_policy_as_owner_impl},
            policy::{AddPolicyArgs, LogicalOperator, PolicyResponse},
        },
        secrets::{
            secret::{AddSecretArgs, SecretSymmetricCryptoMaterial},
            secrets_interface_impl::add_secret_impl,
        },
        smart_vaults::smart_vault::POLICY_STORE,
        user_vaults::user_vault::KeyBox,
        users::{user::AddUserArgs, users_interface_impl::create_user_impl},
    };

    #[tokio::test]
    async fn itest_policy_lifecycle() {
        // Create empty user_vault
        let principal = create_principal();
        let beneficiary = create_principal();
        let validator = create_principal();

        // Create User and store it
        let aua: AddUserArgs = AddUserArgs {
            id: principal,
            name: Some("donald".to_string()),
            email: None,
            user_type: None,
        };
        let _new_user = create_user_impl(aua, &principal).await.unwrap();

        // Create a Secret
        let sscm: SecretSymmetricCryptoMaterial = SecretSymmetricCryptoMaterial {
            encrypted_symmetric_key: vec![1, 2, 3],
        };
        let asa: AddSecretArgs = AddSecretArgs {
            category: None,
            name: Some("Google".to_string()),
            username: Some(vec![1, 2, 3]),
            password: Some(vec![1, 2, 3]),
            url: None,
            notes: Some(vec![1, 2, 3]),
            symmetric_crypto_material: sscm,
        };

        // Add Secret
        let added_secret = add_secret_impl(asa.clone(), &principal).await.unwrap();

        // create a policy with a time based condition
        let time_based_condition: Condition = Condition::TimeBasedCondition(TimeBasedCondition {
            id: "My Time Based Condition".to_string(),
            number_of_days_since_last_login: 0,
            condition_status: false,
        });

        let x_out_of_y_condition: Condition = Condition::XOutOfYCondition(XOutOfYCondition {
            id: "My X out of Y Condition".to_string(),
            validators: vec![Validator {
                id: validator,
                status: false,
            }],
            quorum: 1,
            condition_status: false,
        });

        let mut apa: AddPolicyArgs = AddPolicyArgs {
            id: "Policy#1".to_string(),
            name: Some("Policy#1".to_string()),
            beneficiaries: [beneficiary].iter().cloned().collect(),
            secrets: HashSet::new(),
            key_box: KeyBox::new(),
            condition_logical_operator: LogicalOperator::And,
            conditions: vec![time_based_condition, x_out_of_y_condition],
        };
        apa.secrets.insert(added_secret.id().to_string());
        let added_policy = add_policy_impl(apa, &principal).await.unwrap();

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
        let policy_list = get_policy_list_as_owner_impl(&principal).unwrap();
        assert_eq!(policy_list.len(), 1);
        assert_eq!(&policy_list[0].id, added_policy.id());

        // get specific policy from proper interface implementation
        let mut fetched_policy: PolicyResponse =
            get_policy_as_owner_impl(added_policy.id().clone(), &principal).unwrap();
        assert_eq!(fetched_policy.secrets().len(), 1);
        assert_eq!(
            fetched_policy.secrets().iter().next().unwrap().id,
            added_secret.id()
        );
        assert_eq!(fetched_policy.beneficiaries.len(), 1);
        assert_eq!(fetched_policy.conditions.len(), 2);

        // get list of policies as beneficiary
        let policy_list_as_beneficiary = get_policy_list_as_beneficiary_impl(&beneficiary).unwrap();
        assert_eq!(policy_list_as_beneficiary.len(), 1);
        assert_eq!(&policy_list_as_beneficiary[0].id, added_policy.id());

        // get specific policy as beneficiary: this should fail, because policy has not yet been activated
        let policy_reponse =
            get_policy_as_beneficiary_impl(added_policy.id().clone(), &beneficiary);
        assert!(policy_reponse.is_err_and(|e| match e {
            SmartVaultErr::InvalidPolicyCondition => true,
            _ => false,
        }));

        // get policy as validator: this souhld fail, because validator is not a beneficiary
        let policy_reponse = get_policy_as_beneficiary_impl(added_policy.id().clone(), &validator);
        assert!(policy_reponse.is_err_and(|e| match e {
            SmartVaultErr::NoPolicyForBeneficiary(_) => true,
            _ => false,
        }));

        // dbg!(fetched_policy);

        // dbg!(added_policy);
        // dump_policy_store();
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
