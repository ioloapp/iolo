use std::collections::BTreeMap;

use candid::{CandidType, Deserialize};

use crate::common::{error::SmartVaultErr, uuid::UUID};

use super::{secret::Secret, user_vault::UserVault};

#[derive(CandidType, Deserialize, Clone)]
pub struct MasterVault {
    user_vaults: BTreeMap<UUID, UserVault>,
}

impl Default for MasterVault {
    fn default() -> Self {
        Self::new()
    }
}

impl MasterVault {
    pub fn new() -> Self {
        Self {
            user_vaults: BTreeMap::new(),
        }
    }

    pub fn user_vaults(&self) -> &BTreeMap<UUID, UserVault> {
        &self.user_vaults
    }

    pub fn is_user_vault_existing(&self, vault_id: &UUID) -> bool {
        self.user_vaults.contains_key(vault_id)
    }

    fn number_of_user_vaults(&self) -> usize {
        self.user_vaults.len()
    }

    pub fn create_user_vault(&mut self) -> UUID {
        let new_user_vault = UserVault::new();
        let new_user_vault_id = *new_user_vault.id();
        self.user_vaults.insert(new_user_vault_id, new_user_vault);
        new_user_vault_id
    }

    pub fn get_user_vault(&mut self, vault_id: &UUID) -> Result<&UserVault, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        Ok(self.user_vaults.get(vault_id).unwrap())
    }

    // Delete a user_vault from the master_vault
    pub fn remove_user_vault(&mut self, id: &UUID) {
        self.user_vaults.remove(id);
    }

    // Inserts a secret into a user's vault.
    pub fn add_secret(&mut self, vault_id: &UUID, secret: &Secret) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.add_secret(secret);
        Ok(())
    }

    // Replace a secret
    pub fn update_secret(&mut self, vault_id: &UUID, secret: &Secret) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.update_secret(secret);
        Ok(())
    }

    // Remove a secret
    pub fn remove_secret(
        &mut self,
        vault_id: &UUID,
        secret_id: &String,
    ) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.remove_secret(secret_id);
        Ok(())
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::{smart_vaults::secret::SecretCategory, utils::random};

    #[test]
    fn utest_new_master_vault() {
        let master_vault = MasterVault::new();

        assert_eq!(
            master_vault.user_vaults.len(),
            0,
            "master_vault should have 0 user_vaults but has {}",
            master_vault.user_vaults.len()
        );
    }

    #[tokio::test]
    async fn utest_create_user_vault() {
        let mut master_vault = MasterVault::new();

        // no user vault yet
        assert_eq!(master_vault.number_of_user_vaults(), 0);

        // Create a new empty user_vault
        let new_uv_id = master_vault.create_user_vault();

        // new user vault exists
        assert!(master_vault.get_user_vault(&new_uv_id).is_ok());

        // there is a user vault in the master vault
        assert_eq!(master_vault.number_of_user_vaults(), 1);

        // user vault must be empty
        assert_eq!(
            master_vault
                .get_user_vault(&new_uv_id)
                .unwrap()
                .secrets()
                .len(),
            0
        );
    }

    #[tokio::test]
    async fn utest_get_user_vault() {
        let mut master_vault = MasterVault::new();

        // Create a new empty user_vault
        let new_uv_id = master_vault.create_user_vault();

        // new user vault exists
        assert!(master_vault.get_user_vault(&new_uv_id).is_ok());

        // following user vault should not exist
        assert!(master_vault.get_user_vault(&UUID::new()).is_err());
    }

    #[tokio::test]
    async fn utest_remove_user_vault() {
        let mut master_vault = MasterVault::new();

        // no user vault yet
        assert_eq!(master_vault.number_of_user_vaults(), 0);

        // Create a new empty user_vault
        let new_uv_id = master_vault.create_user_vault();

        // new user vault exists
        assert!(master_vault.get_user_vault(&new_uv_id).is_ok());

        // there is a user vault in the master vault
        assert_eq!(master_vault.number_of_user_vaults(), 1);

        master_vault.remove_user_vault(&new_uv_id);

        // new user vault does not exist anymore
        assert!(master_vault.get_user_vault(&new_uv_id).is_err());

        // there is no user vault in the master vault anymore
        assert_eq!(master_vault.number_of_user_vaults(), 0);
    }

    #[tokio::test]
    async fn utest_secrets() {
        let mut master_vault = MasterVault::new();
        let new_uv_id = master_vault.create_user_vault();

        // user vault must be empty
        assert_eq!(
            master_vault
                .get_user_vault(&new_uv_id)
                .unwrap()
                .secrets()
                .len(),
            0
        );

        let mut secret =
            Secret::new(&SecretCategory::Password, &String::from("my-super-secret")).await;

        master_vault.add_secret(&new_uv_id, &secret);
        assert_eq!(
            master_vault
                .get_user_vault(&new_uv_id)
                .unwrap()
                .secrets()
                .len(),
            1
        );
        let secret_name = master_vault
            .get_user_vault(&new_uv_id)
            .unwrap()
            .secrets()
            .get(secret.id())
            .unwrap()
            .name();
        assert_eq!(
            secret_name,
            &String::from("my-super-secret"),
            "secret should have name my-super-secret but has {}",
            secret_name
        );

        secret.set_name(&String::from("my-super-secret-new"));
        master_vault.update_secret(&new_uv_id, &secret);
        let secret_name = master_vault
            .get_user_vault(&new_uv_id)
            .unwrap()
            .secrets()
            .get(secret.id())
            .unwrap()
            .name();
        assert_eq!(
            secret_name, "my-super-secret-new",
            "secret should have name my-super-secret-new but has {}",
            secret_name
        );

        master_vault.remove_secret(&new_uv_id, &secret.id());
        assert_eq!(
            master_vault
                .get_user_vault(&new_uv_id)
                .unwrap()
                .secrets()
                .len(),
            0
        );
    }
}
