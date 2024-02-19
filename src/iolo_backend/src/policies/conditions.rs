//! Conditions contain the logic required to define the dead man's switch mechanism. There are two type of conditions:
//! 1. Time based conditions - Checks whether a certain time threshold is reached
//! 2. X out of Y conditions - Checks whether X out of Y validators have voted "yes" on the condition

use crate::common::uuid::UUID;
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

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct UpdateLastLoginTimeCondition {
    pub id: Option<ConditionID>,
    pub number_of_days_since_last_login: u64,
}

/// Defines a moment in time in the future upon which a condition is valid
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct FixedDateTimeCondition {
    pub id: ConditionID,
    pub time: u64,
    pub condition_status: bool,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct UpdateFixedDateTimeCondition {
    pub id: Option<ConditionID>,
    pub time: u64,
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

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct UpdateXOutOfYCondition {
    pub id: Option<ConditionID>,
    pub validators: Vec<Validator>,
    pub question: String,
    pub quorum: u64, // in absolute numbers
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

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub enum UpdateCondition {
    LastLogin(UpdateLastLoginTimeCondition),
    XOutOfY(UpdateXOutOfYCondition),
    FixedDateTime(UpdateFixedDateTimeCondition),
}

impl UpdateCondition {
    pub fn id(&self) -> Option<ConditionID> {
        match self {
            UpdateCondition::LastLogin(update) => update.id.clone(),
            UpdateCondition::XOutOfY(update) => update.id.clone(),
            UpdateCondition::FixedDateTime(update) => update.id.clone(),
        }
    }
}

/**
 * Conditon status trait and implementation
 */
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

/**
 * Conditon updates trait and implementation
 */
pub trait ConditionUpdate {
    fn update_condition(&mut self, update: UpdateCondition) -> Condition;
}

impl ConditionUpdate for Condition {
    fn update_condition(&mut self, update: UpdateCondition) -> Condition {
        match self {
            Condition::LastLogin(condition) => {
                if let UpdateCondition::LastLogin(update) = update {
                    condition.number_of_days_since_last_login =
                        update.number_of_days_since_last_login;
                    return Condition::LastLogin(condition.clone());
                }
            }
            Condition::XOutOfY(condition) => {
                if let UpdateCondition::XOutOfY(update) = update {
                    condition.validators = update.validators;
                    condition.question = update.question;
                    condition.quorum = update.quorum;
                    return Condition::XOutOfY(condition.clone());
                }
            }
            Condition::FixedDateTime(condition) => {
                if let UpdateCondition::FixedDateTime(update) = update {
                    condition.time = update.time;
                    return Condition::FixedDateTime(condition.clone());
                }
            }
        }
        // Return the unchanged condition if no matching update was found.
        self.clone()
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

    pub fn id(&self) -> ConditionID {
        match self {
            Condition::LastLogin(cond) => cond.id.clone(),
            Condition::XOutOfY(cond) => cond.id.clone(),
            Condition::FixedDateTime(cond) => cond.id.clone(),
        }
    }

    // create condition from UpdateCondition
    pub async fn from_update_condition(update: UpdateCondition) -> Self {
        let new_condition_id = UUID::new().await;
        match update {
            UpdateCondition::LastLogin(update) => Condition::LastLogin(LastLoginTimeCondition {
                id: new_condition_id,
                number_of_days_since_last_login: update.number_of_days_since_last_login,
                condition_status: false,
            }),
            UpdateCondition::XOutOfY(update) => Condition::XOutOfY(XOutOfYCondition {
                id: new_condition_id,
                validators: update.validators,
                question: update.question,
                quorum: update.quorum,
                condition_status: false,
            }),
            UpdateCondition::FixedDateTime(update) => {
                Condition::FixedDateTime(FixedDateTimeCondition {
                    id: new_condition_id,
                    time: update.time,
                    condition_status: false,
                })
            }
        }
    }

    // create updatecondition from condition
    pub fn into_update_condition(&self) -> UpdateCondition {
        match self {
            Condition::LastLogin(cond) => {
                UpdateCondition::LastLogin(UpdateLastLoginTimeCondition {
                    id: Some(cond.id.clone()),
                    number_of_days_since_last_login: cond.number_of_days_since_last_login,
                })
            }
            Condition::XOutOfY(cond) => UpdateCondition::XOutOfY(UpdateXOutOfYCondition {
                id: Some(cond.id.clone()),
                validators: cond.validators.clone(),
                question: cond.question.clone(),
                quorum: cond.quorum,
            }),
            Condition::FixedDateTime(cond) => {
                UpdateCondition::FixedDateTime(UpdateFixedDateTimeCondition {
                    id: Some(cond.id.clone()),
                    time: cond.time,
                })
            }
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct ConfirmXOutOfYConditionArgs {
    pub policy_id: PolicyID,
    pub status: bool,
}
