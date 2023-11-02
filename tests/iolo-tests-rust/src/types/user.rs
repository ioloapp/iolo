use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct User {
    pub id: Principal,
    pub date_created: u64,
    pub date_modified: u64,
    pub date_last_login: Option<u64>,
    pub user_vault_id: u128, // TODO make option
}
