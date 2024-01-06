use candid::{CandidType, Deserialize, Principal};
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
    pub confirmers: Vec<Confirmer>,
    pub quorum: u64, // in absolute numbers
    pub condition_status: bool,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Confirmer {
    pub id: Principal,
    pub status: bool,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub enum Condition {
    TimeBasedCondition(TimeBasedCondition),
    XOutOfYCondition(XOutOfYCondition),
}

impl Condition {
    pub fn evaluate(&self, user: &User) -> bool {
        match self {
            Condition::TimeBasedCondition(condition) => {
                let current_time: u64 = time::get_current_time();

                // Check last login date
                //let max_last_login_time: u64 = tb.number_of_days_since_last_login * 86400 * 1000000000; // in nanoseconds
                let max_last_login_time: u64 = condition.number_of_days_since_last_login * 1000000000; // in nanoseconds
                return if &user.date_last_login.unwrap() < &current_time.saturating_sub(max_last_login_time) {
                    true
                } else {
                    false
                }
            }
            Condition::XOutOfYCondition(condition) => {
                let mut i = 0;
                for confirmer in &condition.confirmers {
                    if confirmer.status == true {
                        i += 1;
                    }
                }
                if i >= condition.quorum {
                    true
                } else {
                    false
                }
            },
        }
    }
}