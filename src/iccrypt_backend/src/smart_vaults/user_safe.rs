use candid::{CandidType, Deserialize};

use std::collections::BTreeMap;

use crate::{common::user::User, utils::time::get_current_time};

use super::secret::{Secret, SecretID};

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct UserSafe {
    owner: User,
    date_created: Option<u64>,
    date_modified: Option<u64>,
    secrets: BTreeMap<SecretID, Secret>,
}

impl UserSafe {
    pub fn new(owner: User) -> Self {
        let time: u64 = get_current_time();

        Self {
            owner,
            date_created: Some(time),
            date_modified: Some(time),
            secrets: BTreeMap::new(),
        }
    }

    pub fn add_secret(&mut self, secret: Secret) {
        self.secrets.insert(secret.id().to_string(), secret);
    }

    pub fn remove_secret(&mut self, secret_id: SecretID) {
        self.secrets.remove(&secret_id);
    }

    pub fn update_secret(&mut self, secret: Secret) {
        self.secrets.insert(secret.id().to_string(), secret);
    }

    pub fn secrets(&self) -> &BTreeMap<SecretID, Secret> {
        &self.secrets
    }
}

#[cfg(test)]
mod tests {

    use crate::smart_vaults::secret::SecretCategory;

    use super::*;

    #[tokio::test]
    async fn utest_user_safe() {
        let user: User = User::new_random_with_seed(1);
        let mut user_safe: UserSafe = UserSafe::new(user.clone());
        assert_eq!(user_safe.secrets().len(), 0, "No secrets yet");

        let secret: Secret = Secret::new(
            user.get_id(),
            SecretCategory::Password,
            "my-first-secret".to_string(),
        ).await;

        user_safe.add_secret(secret.clone());
        assert_eq!(user_safe.secrets().len(), 1, "Has one secret now");

        assert_eq!(
            user_safe.secrets().get(secret.id()).unwrap().category(),
            secret.category(),
            "Has the right category"
        );
    }
}
