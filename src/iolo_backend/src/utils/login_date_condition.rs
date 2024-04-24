use std::{cell::RefCell, time::Duration};

use ic_cdk_timers::TimerId;

use crate::policies::conditions_manager::check_time_based_conditions;

thread_local! {
    // The global vector to keep multiple timer IDs.
    static TIMER_IDS: RefCell<Vec<TimerId>> = RefCell::new(Vec::new());
}
// This function is called by the init macro from lib.rs
pub fn init_time_based_conditions_checks() {
    start_with_interval_secs(60); // Every minute
    //start_with_interval_secs(86400); // Every day
}

#[ic_cdk_macros::update]
fn start_with_interval_secs(secs: u64) {
    let secs = Duration::from_secs(secs);

    // Schedule a new periodic task to increment the counter.
    let timer_id = ic_cdk_timers::set_timer_interval(secs, check_time_based_conditions);

    // Add the timer ID to the global vector.
    TIMER_IDS.with(|timer_ids| timer_ids.borrow_mut().push(timer_id));
}
