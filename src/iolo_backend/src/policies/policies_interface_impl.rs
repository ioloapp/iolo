use std::cell::RefCell;

use candid::Principal;

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    smart_vaults::smart_vault::{
        POLICY_REGISTRY_FOR_BENEFICIARIES, POLICY_REGISTRY_FOR_VALIDATORS, POLICY_STORE, USER_STORE,
    },
};

use super::{
    conditions::Condition,
    policy::{AddPolicyArgs, Policy},
    policy_registry::{PolicyRegistryForBeneficiaries, PolicyRegistryForValidators},
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
        user_store.add_policy_to_user(&caller, policy.id().clone().into())
    })?;

    // Add entry to policy registry for beneficiaries (reverse index)
    POLICY_REGISTRY_FOR_BENEFICIARIES.with(
        |tr: &RefCell<PolicyRegistryForBeneficiaries>| -> Result<(), SmartVaultErr> {
            let mut policy_registry = tr.borrow_mut();
            policy_registry.add_policy_to_registry(&policy);
            Ok(())
        },
    )?;

    // Add entry to policy registry for validators (reverse index) if there is a XOutOfYCondition
    for condition in policy.conditions().iter() {
        match condition {
            Condition::XOutOfYCondition(xoutofy) => {
                POLICY_REGISTRY_FOR_VALIDATORS.with(
                    |pr: &RefCell<PolicyRegistryForValidators>| -> Result<(), SmartVaultErr> {
                        let mut policy_registry = pr.borrow_mut();
                        policy_registry.add_policy_to_registry(
                            &xoutofy.validators,
                            &policy.id(),
                            &policy.owner(),
                        );
                        Ok(())
                    },
                )?;
            }
            _ => {}
        }
    }

    Ok(policy)
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use candid::Principal;

    use crate::{
        policies::policies_interface_impl::add_policy_impl,
        policies::policy::{AddPolicyArgs, LogicalOperator},
        smart_vaults::smart_vault::{POLICY_STORE, USER_STORE},
        user_vaults::user_vault::KeyBox,
        users::{user::AddUserArgs, users_interface_impl::create_user_impl},
        utils::dumper::dump_policy_store,
    };

    #[tokio::test]
    async fn itest_policy_lifecycle() {
        // Create empty user_vault
        let principal = create_principal();

        // Create User and store it
        let aua: AddUserArgs = AddUserArgs {
            id: principal,
            name: Some("donald".to_string()),
            email: None,
            user_type: None,
        };
        let _new_user = create_user_impl(aua, &principal).await.unwrap();

        // create a policy
        let apa: AddPolicyArgs = AddPolicyArgs {
            id: "Policy#1".to_string(),
            name: Some("Policy#1".to_string()),
            beneficiaries: HashSet::new(),
            secrets: HashSet::new(),
            key_box: KeyBox::new(),
            condition_logical_operator: LogicalOperator::And,
            conditions: Vec::new(),
        };
        let added_policy = add_policy_impl(apa, &principal).await.unwrap();

        // check if policy is in policy store
        POLICY_STORE.with(|ps| {
            let policy_store = ps.borrow();
            let policy_in_store = policy_store.get(&added_policy.id()).unwrap();
            assert_eq!(policy_in_store.id(), added_policy.id());
            assert_eq!(policy_in_store.name(), added_policy.name());
        });

        // check if the secret is in the user object
        USER_STORE.with(|us| {
            let user_store = us.borrow();
            let user = user_store.get_user(&principal).unwrap();
            assert_eq!(user.policies.len(), 1, "user should hold 1 policy now");
            assert_eq!(&user.policies[0], added_policy.id());
        });

        // dbg!(added_policy);
        dump_policy_store();
    }

    fn create_principal() -> Principal {
        Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ])
    }
}
