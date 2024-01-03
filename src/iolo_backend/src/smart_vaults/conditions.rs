use candid::{CandidType, Deserialize};
use serde::Serialize;
use crate::common::user::User;
use crate::utils::time;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct TimeBasedCondition {
    pub number_of_days_since_last_login: u64,
    pub condition_status: bool,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct XOutOfYCondition {
    pub number_of_members_total: u64,
    pub quorum: u64,
    pub condition_status: bool,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub enum Condition {
    TimeBasedCondition(TimeBasedCondition),
    XOutOfYCondition(XOutOfYCondition),
}

impl Condition {
    pub fn evaluate(&self, user: &User) -> bool {
        match self {
            Condition::TimeBasedCondition(tb) => {
                let current_time: u64 = time::get_current_time();

                // Check last login date
                let max_last_login_time: u64 = tb.number_of_days_since_last_login * 86400 * 1000000000; // in nanoseconds
                return if &user.date_last_login.unwrap() < &current_time.saturating_sub(max_last_login_time) {
                    true
                } else {
                    false
                }
            },
            Condition::XOutOfYCondition(xy) => {
                println!("Evaluating XOutOfYCondition");
                xy.condition_status
            },
        }
    }
}