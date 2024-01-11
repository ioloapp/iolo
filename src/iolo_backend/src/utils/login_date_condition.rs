use ic_cdk_timers::TimerId;
use std::{
    cell::RefCell,
    time::Duration,
};
use std::collections::BTreeMap;
use candid::Principal;
use crate::common::user::User;
use crate::smart_vaults::conditions::Condition;
use crate::smart_vaults::master_vault::MasterVault;
use crate::smart_vaults::smart_vault::{MASTERVAULT, USER_REGISTRY};
use crate::smart_vaults::user_registry::UserRegistry;

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

fn periodic_task() {
    // read all users
    let users = USER_REGISTRY.with(
        |ur: &RefCell<UserRegistry>| -> BTreeMap<Principal, User> {
            let user_registry = ur.borrow();
            user_registry.users().clone()
        },
    );

    // iterate over all existing users
    for user in users.values() {
        // read all testaments of a user
        MASTERVAULT.with(|ms: &RefCell<MasterVault>| -> () {
            let mut master_vault = ms.borrow_mut();

            // Get all testaments for principal
            let testaments = master_vault.get_user_testament_list_mut(&user.user_vault_id.unwrap());
            if let Err(e) = &testaments {
                ic_cdk::println!("ERROR: {:?}", e);
            }

            // Iterate over testaments and update condition status
            for testament in testaments.unwrap() {

                // iterate over testament.conditions
                for i in 0..testament.conditions().conditions.len() {
                    let condition = &testament.conditions().conditions[i]; // Immutable borrow here
                    match condition {
                        Condition::TimeBasedCondition(tb) => {
                            if condition.evaluate(&user) {
                                // Last login date earlier than allowed, set condition status of all user testaments to true
                                ic_cdk::println!("Last login date of user {:?} is older than {:?} days, condition status of all its testaments is set to true", user.id.to_text(), tb.number_of_days_since_last_login);
                                testament.set_condition_status(true);
                            } else {
                                ic_cdk::println!("Last login date of user {:?} is NOT older than {:?} days!", user.id.to_text(), tb.number_of_days_since_last_login);
                            }
                        }
                        _ => {}
                    }
                }
            }
        });
    }
}