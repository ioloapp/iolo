use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

pub type UserID = Principal;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct User {
    id: UserID,
    // heirs: Vec<UserID>,
    date_created: Option<u64>,
    last_login: Option<u64>,
}

impl User {
    pub fn new(id: Principal) -> Self {
        Self {
            id,
            // heirs: vec![],
            date_created: None,
            last_login: None,
        }
    }

    pub fn get_id(&self) -> UserID {
        self.id
    }

    pub fn new_random_with_seed(seed: u8) -> User {
        let p = Principal::from_slice(&[
            seed, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0,
        ]);
        User::new(p)
    }
}
