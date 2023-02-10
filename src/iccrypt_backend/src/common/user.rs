use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

pub type UserID = Principal;
use crate::utils::time;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct User {
    id: UserID,
    date_created: u64,
    date_modified: u64,
    last_login: Option<u64>,
}

impl User {
    pub fn new(id: &UserID) -> Self {
        let now = time::get_current_time();
        Self {
            id: *id,
            date_created: now,
            date_modified: now,
            last_login: None,
        }
    }

    pub fn id(&self) -> &UserID {
        &self.id
    }

    pub fn new_random_with_seed(seed: u8) -> User {
        let p = Principal::from_slice(&[
            seed, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0,
        ]);
        User::new(&p)
    }
}
