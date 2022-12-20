use std::collections::HashMap;

use candid::{CandidType, Deserialize};

use super::{
    secret::{Secret, SecretID},
    smart_vault::UserID,
};

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct UserSafe {
    owner: UserID,
    date_created: String,
    date_modified: String,
    heirs: Vec<String>,
    pub secrets: HashMap<SecretID, Secret>,
}

impl UserSafe {
    pub fn new(owner: UserID) -> Self {
        Self {
            owner,
            date_created: "now".to_string(),
            date_modified: "now".to_string(),
            heirs: vec![],
            secrets: HashMap::new(),
        }
    }

    pub fn add_secret(&mut self, secret: Secret) {
        self.secrets.insert(secret.get_id(), secret);
    }
}
