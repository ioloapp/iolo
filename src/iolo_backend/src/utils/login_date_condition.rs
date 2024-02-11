use std::{cell::RefCell, time::Duration};

use ic_cdk_timers::TimerId;

use crate::{
    policies::{
        conditions::Condition,
        policies_interface_impl::{get_policy_from_policy_store},
    },
    smart_vaults::smart_vault::USER_STORE,
    users::{user::User, user_store::UserStore},
};
use crate::smart_vaults::smart_vault::POLICY_STORE;

thread_local! {
    // The global vector to keep multiple timer IDs.
    static TIMER_IDS: RefCell<Vec<TimerId>> = RefCell::new(Vec::new());
}

#[ic_cdk_macros::update]
fn start_with_interval_secs(secs: u64) {
    let secs = Duration::from_secs(secs);

    // Schedule a new periodic task to increment the counter.
    let timer_id = ic_cdk_timers::set_timer_interval(secs, periodic_task);

    // Add the timer ID to the global vector.
    TIMER_IDS.with(|timer_ids| timer_ids.borrow_mut().push(timer_id));
}

// This function is called by the init macro from lib.rs
pub fn init_condition() {
    start_with_interval_secs(60); // Every minute
                                  //start_with_interval_secs(86400); // Every day
}

/// This function is called every time the timer fires.
/// It will check the last login date of all users and set the condition status of all policies
/// to true if the last login date is older than the allowed number of days.
fn periodic_task() {
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
            // iterate over policy conditions
            for condition in policy.conditions().clone() {
                match &condition {
                    Condition::TimeBasedCondition(tb) => {
                        if condition.evaluate(&user) {
                            // Last login date earlier than allowed, set condition status of all user policies to true
                            ic_cdk::println!("Last login date of user {:?} is older than {:?} days, condition status of all its policies is set to true", user.id, tb.number_of_days_since_last_login);
                            policy.set_condition_status(true);
                            // update policy in policy store
                            let _ = POLICY_STORE.with(|ps| {
                                let mut policy_store = ps.borrow_mut();
                                policy_store.update_policy(policy.clone())
                            });
                        } else {
                            ic_cdk::println!(
                                "Last login date of user {:?} is NOT older than {:?} days!",
                                user.id,
                                tb.number_of_days_since_last_login
                            );
                        }
                    }
                    _ => {}
                }
            }
        }
    }
}
