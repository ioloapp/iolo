use candid::{CandidType, Deserialize};

use std::collections::BTreeMap;

use crate::common::user::{UserID};
use crate::utils::time;
use super::secret::{SecretID, Secret};

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct UserSafe {
    owner: UserID,
    date_created: u64,
    date_modified: u64,
    secrets: BTreeMap<SecretID, Secret>,
}

impl UserSafe {
    pub fn new(owner: UserID) -> Self {
        let now: u64 = time::get_current_time();

        Self {
            owner,
            date_created: now,
            date_modified: now,
            secrets: BTreeMap::new(),
        }
    }

    pub fn owner(&self) -> &UserID{
        &self.owner
    }

    pub fn date_created(&self) -> &u64{
        &self.date_created
    }

    pub fn date_modified(&self) -> &u64{
        &self.date_modified
    }

    pub fn secrets(&self) -> &BTreeMap<SecretID, Secret> {
        &self.secrets
    }

    pub fn add_secret(&mut self, secret: Secret) {
        self.secrets.insert(secret.id().to_string(), secret);
        self.date_modified = time::get_current_time();
    }

    pub fn remove_secret(&mut self, secret_id: &SecretID) {
        self.secrets.remove(secret_id);
        self.date_modified = time::get_current_time();
    }

    pub fn update_secret(&mut self, secret: Secret) {
        self.secrets.insert(secret.id().to_string(), secret);
        self.date_modified = time::get_current_time();
    }
}

#[cfg(test)]
mod tests {

    use crate::smart_vaults::secret::SecretCategory;
    use crate::common::user::User;
    use std::{thread};
    use super::*;

    #[tokio::test]
    async fn utest_user_safe() {
        
        // Create empty user_safe
        let user: User = User::new_random_with_seed(1);
        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(100)); // Sleep 100 milliseconds to ensure that user_safe has a different creation date
        let mut user_safe: UserSafe = UserSafe::new(user.get_id());

        assert_eq!(user_safe.owner(), &user.get_id(), "Wrong owner: {}", user_safe.owner());
        assert!(user_safe.date_created() > &before, "date_created: {} must be greater than before: {}", user_safe.date_created(), &before);
        assert_eq!(user_safe.date_created(), user_safe.date_modified(), "date_created: {} must be equal to date_modified: {}", user_safe.date_created(), user_safe.date_modified());
        assert_eq!(user_safe.secrets().len(), 0, "Usersafe should have no secrets yet but has {}", user_safe.secrets().len());
        
        // Add secret to user_safe
        let mut secret: Secret = Secret::new(
            user.get_id(),
            SecretCategory::Password,
            String::from("my-first-secret"),
        ).await;
        let mut modified_before_update = user_safe.date_modified;
        let mut created_before_update = user_safe.date_created;
        user_safe.add_secret(secret.clone());

        assert_eq!(user_safe.secrets().len(), 1, "Usersafe should have 1 secret now yet but has {}", user_safe.secrets().len());
        assert!(user_safe.date_modified() > user_safe.date_created(), "date_modified: {} must be greater than date_created: {}", user_safe.date_modified(), user_safe.date_created());
        assert_eq!(user_safe.date_created(), &created_before_update, "date_created: {} must be equal to created_before_update: {}", user_safe.date_created(), created_before_update);
        assert!(user_safe.date_modified() > &modified_before_update, "date_modified: {} must be greater than modified_before_update: {}", user_safe.date_modified(), modified_before_update);

        // Update secret
        let username = String::from("my-username");
        let password = String::from("my-password");
        secret.set_username(username.clone());
        secret.set_password(password.clone());
        modified_before_update = user_safe.date_modified;
        created_before_update = user_safe.date_created;
        user_safe.update_secret(secret);

        assert_eq!(user_safe.secrets().len(), 1, "Usersafe should have 1 secret now yet but has {}", user_safe.secrets().len());
        assert!(user_safe.date_created() < user_safe.date_modified(), "date_modified: {} must be greater than date_created: {}", user_safe.date_modified(), user_safe.date_created());
        assert_eq!(user_safe.date_created(), &created_before_update, "date_created: {} must be equal to created_before_update: {}", user_safe.date_created(), created_before_update);
        assert!(user_safe.date_modified() > &modified_before_update, "date_modified: {} must be greater than modified_before_update: {}", user_safe.date_modified(), modified_before_update);

    }
}
