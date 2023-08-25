use crate::{smart_vaults::user_vault::UserVaultID, utils::time};
use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

use super::uuid::UUID;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Copy)]
pub struct User {
    id: Principal,
    date_created: u64,
    date_modified: u64,
    date_last_login: Option<u64>,
    user_vault_id: UUID, // TODO make option
}

impl User {
    pub fn new(id: &Principal) -> Self {
        let now = time::get_current_time();

        Self {
            id: *id,
            date_created: now,
            date_modified: now,
            date_last_login: None,
            user_vault_id: UUID::new_empty(), // TODO: empty not okay. use None
        }
    }

    pub fn id(&self) -> &Principal {
        &self.id
    }

    pub fn user_vault_id(&self) -> &UserVaultID {
        &self.user_vault_id
    }

    pub fn set_user_vault(&mut self, user_vault_id: UserVaultID) {
        self.user_vault_id = user_vault_id;
    }

    pub fn new_random_with_seed(seed: u8) -> User {
        let p = Principal::from_slice(&[
            seed, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0,
        ]);
        User::new(&p)
    }
}
