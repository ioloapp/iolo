use candid::{CandidType, Deserialize};

use super::smart_vault::UserID;

pub type SecretID = String;

#[derive(Debug, CandidType, Deserialize, Clone, Copy)]
pub enum SecretCategory {
    Password,
    Wallet,
    Note,
}

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct Secret {
    id: String,
    owner: UserID,
    category: SecretCategory,
    name: String,
    username: String,
    password: String,
    url: String,
}

impl Secret {
    pub fn new(
        owner: UserID,
        category: SecretCategory,
        name: String,
        username: String,
        password: String,
        url: String,
    ) -> Self {
        let mut id = String::from(&name);
        id.push_str(&username);
        id.push_str(&url);
        Self {
            owner,
            id,
            category,
            name,
            username,
            password,
            url,
        }
    }

    pub fn get_id(&self) -> String {
        self.id.clone()
    }

    pub fn get_owner(&self) -> UserID {
        self.owner.clone()
    }
}
