use std::cell::RefCell;

use crate::{
    common::error::SmartVaultErr,
    policies::policy::LogicalOperator,
    smart_vaults::smart_vault::USER_STORE,
    users::{user::User, user_store::UserStore},
};

use super::{
    conditions::Condition,
    policies_interface_impl::{get_policy_from_policy_store, update_policy_in_policy_store},
    policy::PolicyID,
};

/// This function is called every time a policy condition is updated (by the login date condition checks or through XooY validation).
/// It will check the overall condition status of the policy and set it to true if all conditions are met.
pub fn evaluate_overall_conditions_status(policy_id: &PolicyID) -> Result<(), SmartVaultErr> {
    let mut policy = get_policy_from_policy_store(policy_id).unwrap();
    let mut overall_conditions_status = false;
    let logical_operator = policy.conditions_logical_operator().clone();

    if policy.conditions().len() == 1 {
        overall_conditions_status = policy.conditions().first().unwrap().get_condition_status();
    }

    if let Some(operator) = logical_operator {
        match operator {
            LogicalOperator::And => {
                overall_conditions_status =
                    policy.conditions.iter().all(|c| c.get_condition_status());
            }
            LogicalOperator::Or => {
                overall_conditions_status =
                    policy.conditions.iter().any(|c| c.get_condition_status());
            }
        }
    }

    if overall_conditions_status {
        policy.set_condition_status(true);
        update_policy_in_policy_store(policy.clone())?;
    }

    Ok(())
}

/// This function is called every time the timer fires.
/// It will check the last login date of all users and set the condition status of all policies
/// to true if the last login date is older than the allowed number of days.
pub fn check_login_date_conditions() {
    // read all users
    let users: Vec<User> = USER_STORE.with(|ur: &RefCell<UserStore>| -> Vec<User> {
        let user_store = ur.borrow();
        user_store.users()
    });

    // iterate over all existing users
    for user in users {
        // iterate over all policies
        for policy_id in user.policies() {
            // get policy from policy store
            let mut policy = get_policy_from_policy_store(&policy_id).unwrap();

            // track whether policy needs to be updated
            let mut policy_needs_update = false;

            // iterate over policy conditions
            for condition in policy.conditions_mut().iter_mut() {
                if let Condition::LastLogin(tb) = &condition {
                    if condition.evaluate(Some(&user)) {
                        // Last login date earlier than allowed, set condition status of all user policies to true
                        ic_cdk::println!("Last login date of user {:?} is older than {:?} days, condition status of all its policies is set to true", user.id, tb.number_of_days_since_last_login);
                        // policy.set_condition_status(true);
                        condition.set_condition_status(true);
                        policy_needs_update = true;
                    } else {
                        ic_cdk::println!(
                            "Last login date of user {:?} is NOT older than {:?} days!",
                            user.id,
                            tb.number_of_days_since_last_login
                        );
                    }
                }
            }

            // update policy in policy store?
            if policy_needs_update {
                update_policy_in_policy_store(policy.clone()).ok();
                evaluate_overall_conditions_status(&policy_id).ok();
            }
        }
    }
}
