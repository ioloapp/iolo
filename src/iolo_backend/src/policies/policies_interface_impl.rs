use std::cell::RefCell;

use candid::Principal;

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    secrets::{
        secret::{Secret, SecretListEntry},
        secrets_interface_impl::get_secret_impl,
    },
    smart_vaults::smart_vault::{POLICY_REGISTRIES, POLICY_STORE, USER_STORE},
};

use super::{
    conditions::Condition,
    policy::{AddPolicyArgs, Policy, PolicyID, PolicyResponse},
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
        match condition {
            Condition::XOutOfYCondition(xoutofy) => {
                POLICY_REGISTRIES.with(|x| {
                    let mut policy_registries = x.borrow_mut();
                    policy_registries.add_policy_to_validators(&xoutofy.validators, &policy.id());
                });
            }
            _ => {}
        }
    }

    // the old way (before storable)
    // Add entry to policy registry for beneficiaries (reverse index)
    // POLICY_REGISTRY_FOR_BENEFICIARIES.with(
    //     |tr: &RefCell<PolicyRegistryForBeneficiaries>| -> Result<(), SmartVaultErr> {
    //         let mut policy_registry = tr.borrow_mut();
    //         policy_registry.add_policy_to_registry(&policy);
    //         Ok(())
    //     },
    // )?;

    // Add entry to policy registry for validators (reverse index) if there is a XOutOfYCondition
    // for condition in policy.conditions().iter() {
    //     match condition {
    //         Condition::XOutOfYCondition(xoutofy) => {
    //             POLICY_REGISTRY_FOR_VALIDATORS.with(
    //                 |pr: &RefCell<PolicyRegistryForValidators>| -> Result<(), SmartVaultErr> {
    //                     let mut policy_registry = pr.borrow_mut();
    //                     policy_registry.add_policy_to_registry(
    //                         &xoutofy.validators,
    //                         &policy.id(),
    //                         &policy.owner(),
    //                     );
    //                     Ok(())
    //                 },
    //             )?;
    //         }
    //         _ => {}
    //     }
    // }

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

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use candid::Principal;

    use crate::{
        policies::policies_interface_impl::add_policy_impl,
        policies::{
            conditions::{Condition, TimeBasedCondition, Validator, XOutOfYCondition},
            policies_interface_impl::get_policy_as_owner_impl,
            policy::{AddPolicyArgs, LogicalOperator, PolicyResponse},
        },
        secrets::{
            secret::{AddSecretArgs, SecretSymmetricCryptoMaterial},
            secrets_interface_impl::add_secret_impl,
        },
        smart_vaults::smart_vault::{POLICY_STORE, USER_STORE},
        user_vaults::user_vault::KeyBox,
        users::{user::AddUserArgs, users_interface_impl::create_user_impl},
        utils::dumper::dump_policy_store,
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

        // get policy from proper interface implementation
        let mut fetched_policy: PolicyResponse =
            get_policy_as_owner_impl(added_policy.id().clone(), &principal).unwrap();
        assert_eq!(fetched_policy.secrets().len(), 1);
        assert_eq!(
            fetched_policy.secrets().iter().next().unwrap().id,
            added_secret.id()
        );
        assert_eq!(fetched_policy.beneficiaries.len(), 1);
        assert_eq!(fetched_policy.conditions.len(), 2);

        // dbg!(fetched_policy);

        // dbg!(added_policy);
        // dump_policy_store();
    }

    fn create_principal() -> Principal {
        Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ])
    }
}
