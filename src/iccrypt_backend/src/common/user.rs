use crate::utils::time;
use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

use super::uuid::UUID;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Copy)]
pub struct User {
    id: Principal,
    date_created: u64,
    date_modified: u64,
    date_last_login: Option<u64>,
    user_vault_id: UUID,
}

impl User {
    pub fn new(id: &Principal) -> Self {
        let now = time::get_current_time();
        Self {
            id: *id,
            date_created: now,
            date_modified: now,
            date_last_login: None,
            user_vault_id: UUID::new(),
        }
    }

    pub fn id(&self) -> &Principal {
        &self.id
    }

    pub fn user_vault_id(&self) -> &UUID {
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
