use candid::{CandidType, Deserialize, Principal};

use std::collections::BTreeMap;

use crate::{users::user::User, utils::time::get_current_time};

use super::secret::{Secret, SecretID};

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct UserSafe {
    owner: User,
    date_created: Option<u64>,
    date_modified: Option<u64>,
    heirs: Vec<Principal>,
    secrets: BTreeMap<SecretID, Secret>,
}

impl UserSafe {
    pub fn new(owner: User) -> Self {
        let time: u64 = get_current_time();

        Self {
            owner,
            date_created: Some(time),
            date_modified: Some(time),
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

    pub fn get_heirs(&self) -> Vec<Principal> {
        self.heirs.clone()
    }

    pub fn get_secrets(&self) -> BTreeMap<SecretID, Secret> {
        self.secrets.clone()
    }
}

#[cfg(test)]
mod tests {

    use crate::smart_vaults::secret::SecretCategory;

    use super::*;

    #[test]
    fn utest_user_safe() {
        let user: User = User::new_random_with_seed(1);
        let mut user_safe: UserSafe = UserSafe::new(user.clone());
        assert_eq!(user_safe.get_heirs().len(), 0, "No heirs yet");
        assert_eq!(user_safe.get_secrets().len(), 0, "No secrets yet");

        let secret: Secret = Secret::new(
            user.get_id(),
            SecretCategory::Password,
            "My First PWD".to_string(),
            "username@mail.com".to_string(),
            "password".to_string(),
            "www.url.com".to_string(),
        );

        user_safe.add_secret(secret.clone());
        assert_eq!(user_safe.get_secrets().len(), 1, "Has one secret now");

        assert_eq!(
            user_safe
                .get_secrets()
                .get(&secret.get_id())
                .unwrap()
                .get_category(),
            secret.get_category(),
            "Has the right category"
        );
    }
}
