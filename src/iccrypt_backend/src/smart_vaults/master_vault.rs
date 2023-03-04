use std::collections::BTreeMap;

use candid::{CandidType, Deserialize};

use crate::common::{error::SmartVaultErr};

use super::{
    secret::{Secret, SecretCategory},
    user_vault::UserVault,
};

#[derive(CandidType, Deserialize, Clone)]
pub struct MasterVault {
    user_vaults: BTreeMap<String, UserVault>,
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

    pub fn user_vaults(&mut self) -> &mut BTreeMap<String, UserVault> {
        &mut self.user_vaults
    }

    pub fn is_user_vault_existing(&self, id: &String) -> bool {
        self.user_vaults.contains_key(id)
    }

    pub async fn create_user_vault(&mut self) -> &UserVault {
        // This if section can be replaced with .try_insert() once it's not experimental anymore...
        let user_vault = UserVault::new().await;
        self.user_vaults.insert(user_vault.id().clone(), user_vault.clone());
        self.user_vaults.get(user_vault.id()).unwrap()
    }

    pub fn get_user_vault(&mut self, vault_id: &String) -> Result<&UserVault, SmartVaultErr>  {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(*vault_id));
        }

        Ok(self.user_vaults().get(vault_id).unwrap())
    }

    // Delete a user_vault from the master_vault
    pub fn remove_user_vault(&mut self, id: &String) {
        self.user_vaults.remove(id);
    }

    // Inserts a secret into a user's vault.
    pub fn add_secret(&mut self, vault_id: &String, secret: &Secret) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(*vault_id));
        }

        let user_vault = self
            .user_vaults()
            .get(vault_id).unwrap();
        user_vault.add_secret(secret);
        Ok(())
    }

    // Replace a secret
    pub fn update_secret(&mut self, vault_id: &String, secret: &Secret) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(*vault_id));
        }

        let user_vault = self
            .user_vaults()
            .get(vault_id).unwrap();
        user_vault.update_secret(secret);
        Ok(())
    }

    // Remove a secret
    pub fn remove_secret(&mut self, vault_id: &String, secret_id: &String) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(*vault_id));
        }

        let user_vault = self
            .user_vaults()
            .get(vault_id).unwrap();
        user_vault.remove_secret(secret_id);
        Ok(())
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::utils::random;

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

        // Create a new empty user_vault
        let user_vault = master_vault.create_user_vault().await;
        assert_eq!(user_vault.id().len(), 36);
        assert_eq!(
            user_vault.secrets().len(),
            0,
            "user_vault_1a should have 0 secrets but has {}",
            user_vault.secrets().len()
        );
        assert_eq!(
            master_vault.user_vaults().len(),
            1,
            "master_vault should have 1 user_vault but has {}",
            master_vault.user_vaults().len()
        );

        // Check if user_vault exists
        assert_eq!(
            master_vault.is_user_vault_existing(user_vault.id()),
            true,
            "user_vault with id {} should exist",
            user_vault.id()
        );
        let id = random::get_new_uuid().await;
        assert_eq!(
            master_vault.is_user_vault_existing(&id),
            false,
            "user_vault with id {} should not exist",
            id
        );

        // Add another user_vault
        let _user_vault_2 = master_vault.create_user_vault();
        assert_eq!(
            master_vault.user_vaults().len(),
            2,
            "master_vault should have 2 user_vaults but has {}",
            master_vault.user_vaults().len()
        );
    }

    #[tokio::test]
    async fn utest_get_user_vault() {
        let mut master_vault = MasterVault::new();
        let user_vault = master_vault.create_user_vault().await;

        // Check that get_user_vault returns Some
        assert_eq!(
            master_vault.get_user_vault(user_vault.id()).is_ok(),
            true,
            "get_user_vault should return Ok"
        );

        // Check that this get_user_vault returns Err
        let id = random::get_new_uuid().await;
        assert_eq!(
            master_vault.get_user_vault(&id).is_err(),
            true,
            "get_user_vault should return Err"
        );

        // Validate user_vault
        let user_vault = master_vault.get_user_vault(user_vault.id()).unwrap();
        assert_eq!(
            user_vault.secrets().len(),
            0,
            "user_vault should have 0 secrets but has {}",
            user_vault.secrets().len()
        );
        assert_eq!(
            master_vault.user_vaults().len(),
            1,
            "master_vault should have 1 user_vault but has {}",
            master_vault.user_vaults().len()
        );
    }

    #[tokio::test]
    async fn utest_remove_user_vault() {
        let mut master_vault = MasterVault::new();

        // Create a new empty user_vault
        let user_vault = master_vault.create_user_vault().await;

        assert_eq!(
            master_vault.user_vaults().len(),
            1,
            "master_vault should have 1 user_vault but has {}",
            master_vault.user_vaults().len()
        );

        master_vault.remove_user_vault(user_vault.id());
        assert_eq!(
            master_vault.user_vaults().len(),
            0,
            "master_vault should have 0 user_vault but has {}",
            master_vault.user_vaults().len()
        );
    }

    #[tokio::test]
    async fn utest_secrets() {
        let mut master_vault = MasterVault::new();
        let user_vault = master_vault.create_user_vault().await;
        assert_eq!(
            user_vault.secrets().len(),
            0,
            "user_vault should have 0 secrets but has {}",
            user_vault.secrets().len()
        );

        let mut secret =
            Secret::new(&SecretCategory::Password, &String::from("my-super-secret")).await;

        master_vault.add_secret(user_vault.id(), &secret);
        assert_eq!(
            master_vault
                .get_user_vault(user_vault.id())
                .unwrap()
                .secrets()
                .len(),
            1,
            "user_vault should have 1 secrets but has {}",
            master_vault
                .get_user_vault(user_vault.id())
                .unwrap()
                .secrets()
                .len()
        );
        let secret_name = master_vault
            .get_user_vault(user_vault.id())
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
        master_vault.update_secret(user_vault.id(), &secret);
        let secret_name = master_vault
            .get_user_vault(user_vault.id())
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

        master_vault.remove_secret(user_vault.id(), &secret.id());
        assert_eq!(
            master_vault
                .get_user_vault(user_vault.id())
                .unwrap()
                .secrets()
                .len(),
            0,
            "user_vault should have 0 secrets but has {}",
            master_vault
                .get_user_vault(user_vault.id())
                .unwrap()
                .secrets()
                .len()
        );
    }
}
