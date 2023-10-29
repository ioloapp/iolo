use ic_cdk_timers::TimerId;
use std::{
    cell::RefCell,
    time::Duration,
};
use candid::Principal;
use crate::smart_vaults::smart_vault::{USER_REGISTRY};
use crate::smart_vaults::user_registry::UserRegistry;
use crate::utils::time;

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
    start_with_interval_secs(60);
}

fn periodic_task() {
    // read last login date of all users
    let users = USER_REGISTRY.with(
        |ur: &RefCell<UserRegistry>| -> Vec<(Principal, u64)> {
            let user_registry = ur.borrow();
            user_registry.get_all_last_login_dates()
        },
    );


    let current_time: u64 = time::get_current_time();
    let max_last_login_time: u64 = 60 * 1000000000; // in nanoseconds

    // iterate over all last login dates
    for (principal, last_login_date) in &users {
        if last_login_date < &current_time.saturating_sub(max_last_login_time) {
            // Last login date earlier than allowed, set condition status of all user testaments to true
            ic_cdk::println!("Last login date of user {:?} is older than 60s, condition status of all its testaments is set to true", principal.to_text());
            // TODO
        }
    }
}