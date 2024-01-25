use std::cell::RefCell;

use candid::Principal;

use crate::{
    common::error::SmartVaultErr,
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

pub fn add_policy_impl(apa: AddPolicyArgs, caller: &Principal) -> Result<Policy, SmartVaultErr> {
    let policy: Policy = Policy::from(apa);

    // Add policy to the policy store (policies: StableBTreeMap<UUID, Policy, Memory>,)
    POLICY_STORE.with(
        |policy_store_rc: &RefCell<PolicyStore>| -> Result<Policy, SmartVaultErr> {
            let mut policy_store = policy_store_rc.borrow_mut();
            policy_store.add_policy(policy.clone())
        },
    )?;

    dbg!("add_policy_impl: policy: {:?}", &policy);

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
        user_vaults::user_vault::KeyBox,
        users::{user::AddUserArgs, users_interface_impl::create_user_impl},
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
        let added_policy = add_policy_impl(apa, &principal).unwrap();
        dbg!(added_policy);
    }

    fn create_principal() -> Principal {
        Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ])
    }
}
