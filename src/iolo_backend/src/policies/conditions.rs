//! Conditions contain the logic required to define the dead man's switch mechanism. There are two type of conditions:
//! 1. Time based conditions - Checks whether a certain time threshold is reached
//! 2. X out of Y conditions - Checks whether X out of Y validators have voted "yes" on the condition

use candid::{CandidType, Deserialize};
use serde::Serialize;

use crate::users::user::{PrincipalID, User};
use crate::utils::time;

/// Defines the number of days since the last login of a user.
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct TimeBasedCondition {
    pub id: ConditionID,
    pub number_of_days_since_last_login: u64,
    pub condition_status: bool,
}

/// The X out of Y condition contains a set of validators and defines a quorum.
///
/// The overall condition status defines the status of the condition.
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct XOutOfYCondition {
    pub id: ConditionID,
    pub validators: Vec<Validator>,
    pub quorum: u64, // in absolute numbers
    pub condition_status: bool,
}

/// Validator is the role a user has when it is part of of a condition and has to vote for it
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Validator {
    pub id: PrincipalID,
    pub status: bool,
}

pub type ConditionID = String;

/// The condition enum contains the two types of conditions: TimeBasedCondition and XOutOfYCondition
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
                let max_last_login_time: u64 =
                    condition.number_of_days_since_last_login * 1000000000; // in nanoseconds
                user.date_last_login.unwrap() < current_time.saturating_sub(max_last_login_time)
            }
            Condition::XOutOfYCondition(condition) => {
                let mut i = 0;
                for confirmer in &condition.validators {
                    if confirmer.status {
                        i += 1;
                    }
                }
                i >= condition.quorum
            }
        }
    }
}
