use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

use crate::{smart_vaults::user_vault::UserVaultID, utils::time};

use super::uuid::UUID;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct User {
    pub id: Principal,
    pub name: Option<String>,
    pub first_name: Option<String>,
    pub email: Option<String>,
    pub user_type: Option<UserType>,
    pub date_created: u64,
    pub date_modified: u64,
    pub date_last_login: Option<u64>,
    pub user_vault_id: UUID, //TODO make option
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub enum UserType {
    Person,
    Company,
}

impl User {
    pub fn new(id: &Principal) -> Self {
        let now = time::get_current_time();

        Self {
            id: *id,
            name: None,
            first_name: None,
            email: None,
            user_type: None,
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
