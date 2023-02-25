use candid::{CandidType, Deserialize};
use serde::Serialize;

use std::collections::BTreeMap;

use super::secret::{Secret, SecretID};
use crate::common::user::UserID;
use crate::utils::time;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct UserVault {
    owner: UserID,
    date_created: u64,
    date_modified: u64,
    secrets: BTreeMap<SecretID, Secret>,
}

impl UserVault {
    pub fn new(owner: &UserID) -> Self {
        let now: u64 = time::get_current_time();

        Self {
            owner: *owner,
            date_created: now,
            date_modified: now,
            secrets: BTreeMap::new(),
        }
    }

    pub fn owner(&self) -> &UserID {
        &self.owner
    }

    pub fn date_created(&self) -> &u64 {
        &self.date_created
    }

    pub fn date_modified(&self) -> &u64 {
        &self.date_modified
    }

    pub fn secrets(&self) -> &BTreeMap<SecretID, Secret> {
        &self.secrets
    }

    pub fn add_secret(&mut self, secret: &Secret) {
        self.secrets.insert(secret.id().to_string(), secret.clone());
        self.date_modified = time::get_current_time();
    }

    pub fn remove_secret(&mut self, secret_id: &SecretID) {
        self.secrets.remove(secret_id);
        self.date_modified = time::get_current_time();
    }

    pub fn update_secret(&mut self, secret: &Secret) {
        self.secrets.insert(secret.id().to_string(), secret.clone());
        self.date_modified = time::get_current_time();
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::common::user::User;
    use crate::smart_vaults::secret::SecretCategory;
    use std::thread;

    #[tokio::test]
    async fn utest_user_vault() {
        // Create empty user_vault
        let user: User = User::new_random_with_seed(1);
        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(100)); // Sleep 100 milliseconds to ensure that user_vault has a different creation date
        let mut user_vault: UserVault = UserVault::new(&user.id());

        assert_eq!(
            user_vault.owner(),
            user.id(),
            "Wrong owner: {}",
            user_vault.owner()
        );
        assert!(
            user_vault.date_created() > &before,
            "date_created: {} must be greater than before: {}",
            user_vault.date_created(),
            &before
        );
        assert_eq!(
            user_vault.date_created(),
            user_vault.date_modified(),
            "date_created: {} must be equal to date_modified: {}",
            user_vault.date_created(),
            user_vault.date_modified()
        );
        assert_eq!(
            user_vault.secrets().len(),
            0,
            "user_vault should have no secrets yet but has {}",
            user_vault.secrets().len()
        );

        // Add secret to user_vault
        let mut secret: Secret = Secret::new(
            &user.id(),
            &SecretCategory::Password,
            &String::from("my-first-secret"),
        )
        .await;
        let mut modified_before_update = user_vault.date_modified;
        let mut created_before_update = user_vault.date_created;
        user_vault.add_secret(&secret);

        assert_eq!(
            user_vault.secrets().len(),
            1,
            "user_vault should have 1 secret now yet but has {}",
            user_vault.secrets().len()
        );
        assert!(
            user_vault.date_modified() > user_vault.date_created(),
            "date_modified: {} must be greater than date_created: {}",
            user_vault.date_modified(),
            user_vault.date_created()
        );
        assert_eq!(
            user_vault.date_created(),
            &created_before_update,
            "date_created: {} must be equal to created_before_update: {}",
            user_vault.date_created(),
            created_before_update
        );
        assert!(
            user_vault.date_modified() > &modified_before_update,
            "date_modified: {} must be greater than modified_before_update: {}",
            user_vault.date_modified(),
            modified_before_update
        );

        // Update secret
        let username = String::from("my-username");
        let password = String::from("my-password");
        secret.set_username(&username);
        secret.set_password(&password);
        modified_before_update = user_vault.date_modified;
        created_before_update = user_vault.date_created;
        user_vault.update_secret(&secret);

        assert_eq!(
            user_vault.secrets().len(),
            1,
            "user_vault should have 1 secret now yet but has {}",
            user_vault.secrets().len()
        );
        assert!(
            user_vault.date_created() < user_vault.date_modified(),
            "date_modified: {} must be greater than date_created: {}",
            user_vault.date_modified(),
            user_vault.date_created()
        );
        assert_eq!(
            user_vault.date_created(),
            &created_before_update,
            "date_created: {} must be equal to created_before_update: {}",
            user_vault.date_created(),
            created_before_update
        );
        assert!(
            user_vault.date_modified() > &modified_before_update,
            "date_modified: {} must be greater than modified_before_update: {}",
            user_vault.date_modified(),
            modified_before_update
        );
    }
}
