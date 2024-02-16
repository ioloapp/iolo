//! Conditions contain the logic required to define the dead man's switch mechanism. There are two type of conditions:
//! 1. Time based conditions - Checks whether a certain time threshold is reached
//! 2. X out of Y conditions - Checks whether X out of Y validators have voted "yes" on the condition

use crate::policies::policy::PolicyID;
use candid::{CandidType, Deserialize};
use serde::Serialize;

use crate::users::user::{PrincipalID, User};
use crate::utils::time;

/// Defines the number of days since the last login of a user.
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct LastLoginTimeCondition {
    pub id: ConditionID,
    pub number_of_days_since_last_login: u64,
    pub condition_status: bool,
}

/// Defines a moment in time in the future upon which a condition is valid
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct FixedDateTimeCondition {
    pub id: ConditionID,
    pub time: u64,
    pub condition_status: bool,
}

/// The X out of Y condition contains a set of validators and defines a quorum.
/// Each validator has its own status (true or false) and the condition is valid if the quorum is reached.
/// Each Validator has to vote for the condition and the condition is valid if the quorum is reached.
/// The overall condition status defines the status of the condition.
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct XOutOfYCondition {
    pub id: ConditionID,
    pub validators: Vec<Validator>,
    pub question: String,
    pub quorum: u64, // in absolute numbers
    pub condition_status: bool,
}

/// Validator is the role a user has when it is part of of a condition and has to vote for it
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Validator {
    pub principal_id: PrincipalID,
    pub status: bool,
}

pub type ConditionID = String;

/// The condition enum contains the two types of conditions: TimeBasedCondition and XOutOfYCondition
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub enum Condition {
    LastLogin(LastLoginTimeCondition),
    XOutOfY(XOutOfYCondition),
    FixedDateTime(FixedDateTimeCondition),
}

trait ConditionStatus {
    fn set_condition_status(&mut self, status: bool);
    fn get_condition_status(&self) -> bool;
}

impl ConditionStatus for LastLoginTimeCondition {
    fn set_condition_status(&mut self, status: bool) {
        self.condition_status = status;
    }

    fn get_condition_status(&self) -> bool {
        self.condition_status
    }
}

impl ConditionStatus for XOutOfYCondition {
    fn set_condition_status(&mut self, status: bool) {
        self.condition_status = status;
    }
    fn get_condition_status(&self) -> bool {
        self.condition_status
    }
}

impl ConditionStatus for FixedDateTimeCondition {
    fn set_condition_status(&mut self, status: bool) {
        self.condition_status = status;
    }
    fn get_condition_status(&self) -> bool {
        self.condition_status
    }
}

impl Condition {
    pub fn evaluate(&self, user: Option<&User>) -> bool {
        match self {
            Condition::LastLogin(condition) => {
                let current_time: u64 = time::get_current_time();

                // Check last login date
                //let max_last_login_time: u64 = tb.number_of_days_since_last_login * 86400 * 1000000000; // in nanoseconds
                let max_last_login_time: u64 =
                    condition.number_of_days_since_last_login * 1000000000; // in nanoseconds
                user.unwrap().date_last_login.unwrap()
                    < current_time.saturating_sub(max_last_login_time)
            }
            Condition::XOutOfY(condition) => {
                let mut i = 0;
                for confirmer in &condition.validators {
                    if confirmer.status {
                        i += 1;
                    }
                }
                i >= condition.quorum
            }
            Condition::FixedDateTime(condition) => {
                let current_time: u64 = time::get_current_time();
                current_time >= condition.time
            }
        }
    }

    pub fn set_condition_status(&mut self, status: bool) {
        match self {
            Condition::LastLogin(c) => c.set_condition_status(status),
            Condition::XOutOfY(c) => c.set_condition_status(status),
            Condition::FixedDateTime(c) => c.set_condition_status(status),
        }
    }

    pub fn get_condition_status(&self) -> bool {
        match self {
            Condition::LastLogin(c) => c.get_condition_status(),
            Condition::XOutOfY(c) => c.get_condition_status(),
            Condition::FixedDateTime(c) => c.get_condition_status(),
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct ConfirmXOutOfYConditionArgs {
    pub policy_id: PolicyID,
    pub status: bool,
}
