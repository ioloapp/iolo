use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

use crate::utils::time;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct User {
    id: Principal,
    date_created: u64,
    date_modified: u64,
    date_last_login: Option<u64>,
    user_vault_id: String,
}

impl User {
    pub fn new(id: &Principal) -> Self {
        let now = time::get_current_time();
        Self {
            id: *id,
            date_created: now,
            date_modified: now,
            date_last_login: None,
            user_vault_id: "".to_string(),
        }
    }

    pub fn id(&self) -> &Principal {
        &self.id
    }

    pub fn user_vault_id(&self) -> &String {
        &self.user_vault_id
    }

    pub fn new_random_with_seed(seed: u8) -> User {
        let p = Principal::from_slice(&[
            seed, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0,
        ]);
        User::new(&p)
    }
}
