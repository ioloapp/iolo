use candid::{CandidType, Deserialize};

use std::collections::BTreeMap;

use crate::users::user::User;

use super::secret::{Secret, SecretID};

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct UserSafe {
    owner: User,
    date_created: Option<u64>,
    date_modified: Option<u64>,
    heirs: Vec<String>,
    pub secrets: BTreeMap<SecretID, Secret>,
}

impl UserSafe {
    pub fn new(owner: User) -> Self {
        Self {
            owner,
            date_created: None,
            date_modified: None,
            heirs: vec![],
            secrets: BTreeMap::new(),
        }
    }

    pub fn add_secret(&mut self, secret: Secret) {
        self.secrets.insert(secret.get_id(), secret);
    }

    pub fn remove_secret(&mut self, secret_id: SecretID) {
        self.secrets.remove(&secret_id);
    }

    pub fn update_secret(&mut self, secret: Secret) {
        self.secrets.insert(secret.get_id(), secret);
    }
}
