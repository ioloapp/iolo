use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::time;
use serde::Serialize;

use crate::{smart_vaults::user_vault::UserVaultID, utils::time};

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct User {
    pub id: Principal,
    pub name: Option<String>,
    pub email: Option<String>,
    pub user_type: Option<UserType>,
    pub date_created: u64,
    pub date_modified: u64,
    pub date_last_login: Option<u64>,
    pub user_vault_id: Option<UserVaultID>
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct AddUserArgs {
    pub id: Principal,
    pub name: Option<String>,
    pub email: Option<String>,
    pub user_type: Option<UserType>,
}

impl From<AddUserArgs> for User {
    fn from(value: AddUserArgs) -> Self {
        let now = time::get_current_time();
        User {
            id: value.id,
            name: value.name,
            email: value.email,
            user_type: value.user_type,
            date_created: now,
            date_modified: now,
            date_last_login: None,
            user_vault_id: None
        }
    }
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
            email: None,
            user_type: None,
            date_created: now,
            date_modified: now,
            date_last_login: Some(now),
            user_vault_id: None
        }
    }

    pub fn id(&self) -> &Principal {
        &self.id
    }

    pub fn user_vault_id(&self) -> &Option<UserVaultID> {
       &self.user_vault_id
    }

    pub fn set_user_vault(&mut self, user_vault_id: UserVaultID) {
        self.user_vault_id = Some(user_vault_id);
        self.date_modified = time::get_current_time();
    }

    pub fn update_login_date(&mut self) {
        let now = time::get_current_time();
        self.date_last_login = Some(now);
        self.date_modified = now;
    }

    pub fn new_random_with_seed(seed: u8) -> User {
        let p = Principal::from_slice(&[
            seed, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0,
        ]);
        User::new(&p)
    }
}
