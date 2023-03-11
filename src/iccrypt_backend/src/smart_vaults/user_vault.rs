use candid::{CandidType, Deserialize};
use serde::Serialize;

use std::collections::BTreeMap;

use super::secret::Secret;
use crate::common::uuid::UUID;
use crate::utils::time;
use crate::SmartVaultErr;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct UserVault {
    id: UUID,
    date_created: u64,
    date_modified: u64,
    secrets: BTreeMap<UUID, Secret>,
}

impl Default for UserVault {
    fn default() -> Self {
        Self::new()
    }
}

impl UserVault {
    pub fn new() -> Self {
        let now: u64 = time::get_current_time();
        let uuid = UUID::new();
        Self {
            id: uuid,
            date_created: now,
            date_modified: now,
            secrets: BTreeMap::new(),
        }
    }

    pub fn id(&self) -> &UUID {
        &self.id
    }

    pub fn date_created(&self) -> &u64 {
        &self.date_created
    }

    pub fn date_modified(&self) -> &u64 {
        &self.date_modified
    }

    pub fn secrets(&self) -> &BTreeMap<UUID, Secret> {
        &self.secrets
    }

    pub fn get_secret(&mut self, secret_id: &UUID) -> Result<&Secret, SmartVaultErr> {     
        self.secrets.get(secret_id).ok_or_else(|| SmartVaultErr::SecretDoesNotExist(secret_id.to_string()))
    }

    pub fn get_secret_mut(&mut self, secret_id: &UUID) -> Result<&mut Secret, SmartVaultErr> {     
        self.secrets.get_mut(secret_id).ok_or_else(|| SmartVaultErr::SecretDoesNotExist(secret_id.to_string()))
    }

    pub fn add_secret(&mut self, secret: &Secret) {
        
        self.secrets.insert(*secret.id(), secret.clone());
        self.date_modified = time::get_current_time();
    }

    pub fn remove_secret(&mut self, secret_id: &UUID) {
        self.secrets.remove(secret_id);
        self.date_modified = time::get_current_time();
    }

    pub fn update_secret(&mut self, secret: &Secret) -> Result<(), SmartVaultErr> {
        if !self.secrets.contains_key(secret.id()) {
            return Err(SmartVaultErr::SecretDoesNotExist(secret.id().to_string()));
        }
        self.secrets.insert(*secret.id(), secret.clone());
        self.date_modified = time::get_current_time();
        Ok(())
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::smart_vaults::secret::SecretCategory;
    use std::thread;

    #[test]
    fn utest_user_vault() {
        // Create empty user_vault
        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(100)); // Sleep 100 milliseconds to ensure that user_vault has a different creation date
        let mut user_vault: UserVault = UserVault::new();

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
        let mut secret: Secret =
            Secret::new(&SecretCategory::Password, &String::from("my-first-secret"));
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
