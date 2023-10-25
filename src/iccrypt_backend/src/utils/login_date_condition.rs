use ic_cdk_timers::TimerId;
use std::{
    cell::RefCell,
    time::Duration,
};
use crate::utils::time;

thread_local! {
    // The global vector to keep multiple timer IDs.
    static TIMER_IDS: RefCell<Vec<TimerId>> = RefCell::new(Vec::new());
}

#[ic_cdk_macros::update]
fn start_with_interval_secs(secs: u64) {
    let secs = Duration::from_secs(secs);
    ic_cdk::println!("Timer canister: Starting a new timer with {secs:?} interval...");

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
    ic_cdk::println!("Current time: {:?}", time::get_current_time());
}