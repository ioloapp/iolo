use crate::policies::conditions::Condition;
use crate::smart_vaults::smart_vault::{USER_STORE, USER_VAULT_STORE};
use crate::users::user::User;
use crate::users::user_store::UserStore;
use candid::Principal;
use ic_cdk_timers::TimerId;
use std::collections::BTreeMap;
use std::{cell::RefCell, time::Duration};

thread_local! {
    // The global vector to keep multiple timer IDs.
    static TIMER_IDS: RefCell<Vec<TimerId>> = RefCell::new(Vec::new());
}

/*#[ic_cdk_macros::update]
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
    let users = USER_STORE.with(
        |ur: &RefCell<UserStore>| -> BTreeMap<Principal, User> {
            let user_store = ur.borrow();
            user_store.users().clone()
        },
    );

    // iterate over all existing users
    for user in users.values() {
        // read all testaments of a user
        USER_VAULT_STORE.with(|ms: &RefCell<UserVaultStore>| -> () {
            let mut user_vault_store = ms.borrow_mut();

            // Get all testaments for principal
            let testaments = user_vault_store.get_user_testament_list_mut(&user.user_vault_id.unwrap());
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
}*/
