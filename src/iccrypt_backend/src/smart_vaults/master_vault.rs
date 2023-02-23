use std::collections::BTreeMap;

use candid::{CandidType, Deserialize, Principal};

use crate::common::user::UserID;
use crate::utils::time;

use super::{
    secret::{Secret, SecretID},
    user_vault::UserVault,
};

pub type UserVaults = BTreeMap<Principal, UserVault>;

#[derive(CandidType, Deserialize, Clone)]
pub struct MasterVault {
    date_created: u64,
    date_modified: u64,
    user_vaults: UserVaults,
}

impl Default for MasterVault {
    fn default() -> Self {
        Self::new()
    }
}

impl MasterVault {
    pub fn new() -> Self {
        let now = time::get_current_time();
        Self {
            date_created: now,
            date_modified: now,
            user_vaults: BTreeMap::new(),
        }
    }

    pub fn date_created(&self) -> &u64 {
        &self.date_created
    }

    pub fn date_modified(&self) -> &u64 {
        &self.date_modified
    }

    pub fn user_vaults(&mut self) -> &mut BTreeMap<UserID, UserVault> {
        &mut self.user_vaults
    }

    pub fn is_user_vault_existing(&self, owner: &UserID) -> bool {
        self.user_vaults.contains_key(owner)
    }
    
    pub fn create_user_vault(&mut self, owner: &UserID) -> Option<&UserVault> {
        if self.user_vaults().contains_key(owner) {
            None
        } else {
            self.user_vaults.insert(*owner, UserVault::new(owner));
            self.user_vaults().get(owner)
        }
    }

    pub fn get_user_vault(&mut self, owner: &UserID) -> Option<&UserVault> {
        self.user_vaults().get(owner)
    }

    // Delete a user_vault from the master_vault
    pub fn remove_user_vault(&mut self, owner: &UserID) {
        self.user_vaults.remove(owner);
    }

    // Inserts a secret into a user's vault.
    pub fn add_secret(&mut self, owner: &UserID, secret: &Secret) {
        let user_vault = self
            .user_vaults()
            .entry(*owner)
            .or_insert_with(|| UserVault::new(owner)); // Get an existing user_vault for the owner or create a new one
        user_vault.add_secret(secret);
    }

    // Replace a secret
    pub fn update_secret(&mut self, owner: &UserID, secret: &Secret) {
        let user_vault = self
            .user_vaults()
            .entry(*owner)
            .or_insert_with(|| UserVault::new(owner)); // Get an existing user_vault for the owner or create a new one
        user_vault.update_secret(secret);
    }

    // Remove a secret
    pub fn remove_secret(&mut self, owner: &UserID, secret_id: &SecretID) {
        let user_vault = self
            .user_vaults()
            .entry(*owner)
            .or_insert_with(|| UserVault::new(owner)); // Get an existing user_vault for the owner or create a new one
        user_vault.remove_secret(secret_id);
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::{common::user::User, smart_vaults::secret::SecretCategory};
    use std::thread;

    #[test]
    fn utest_new_master_vault() {
        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that master_vault has a different creation date
        let master_vault = MasterVault::new();

        assert_eq!(
            master_vault.user_vaults.len(),
            0,
            "master_vault should have 0 user_vaults but has {}",
            master_vault.user_vaults.len()
        );
        assert!(
            master_vault.date_created > before,
            "date_created ({}) must be > before ({})",
            master_vault.date_created,
            before
        );
        assert!(
            master_vault.date_modified == master_vault.date_created,
            "date_modified ({}) must be == date_created ({})",
            master_vault.date_modified,
            master_vault.date_created
        );
    }

    #[tokio::test]
    async fn utest_create_user_vault() {
        let mut master_vault = MasterVault::new();

        // Create a new empty user_vault
        let owner = User::new_random_with_seed(1);
        let user_vault = master_vault.create_user_vault(owner.id()).unwrap();
        assert_eq!(
            user_vault.owner(),
            owner.id(),
            "user_vault_1a should have owner: {},  but has {}",
            owner.id(),
            user_vault.owner()
        );
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

        // Creation of a another user_vault for the same owner should fail
        assert_eq!(
            master_vault.create_user_vault(owner.id()).is_none(),
            true,
            "Same user should not create a 2nd user_vault"
        );

        // Check if user_vault exists
        assert_eq!(
            master_vault.is_user_vault_existing(owner.id()),
            true,
            "user_vault for owner: {} should exist",
            owner.id()
        );
        let owner_2 = User::new_random_with_seed(2);
        assert_eq!(
            master_vault.is_user_vault_existing(owner_2.id()),
            false,
            "user_vault for owner: {} should not exist",
            owner_2.id()
        );

        // Add another user_vault
        let owner_3 = User::new_random_with_seed(3);
        let _user_vault_3 = master_vault.create_user_vault(owner_3.id()); // Create new user_vault
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

        // Create a new empty user_vault
        let owner = User::new_random_with_seed(1);
        let _user_vault = master_vault.create_user_vault(owner.id()).unwrap();

        // Check that get_user_vault returns Some
        assert_eq!(
            master_vault.get_user_vault(owner.id()).is_some(),
            true,
            "get_user_vault should return Some"
        );

        // Check that this get_user_vault returns None
        let owner_2 = User::new_random_with_seed(2);
        assert_eq!(
            master_vault.get_user_vault(owner_2.id()).is_none(),
            true,
            "get_user_vault should return None"
        );

        // Validate user_vault
        let user_vault = master_vault.get_user_vault(owner.id()).unwrap();
        assert_eq!(
            user_vault.owner(),
            owner.id(),
            "user_vault should have owner: {},  but has {}",
            owner.id(),
            user_vault.owner()
        );
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

    #[test]
    fn utest_remove_user_vault() {
        let mut master_vault = MasterVault::new();

        // Create a new empty user_vault
        let owner = User::new_random_with_seed(1);
        let _user_vault = master_vault.create_user_vault(owner.id());
        
        assert_eq!(
            master_vault.user_vaults().len(),
            1,
            "master_vault should have 1 user_vault but has {}",
            master_vault.user_vaults().len()
        );

        master_vault.remove_user_vault(owner.id());
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
        let owner = User::new_random_with_seed(1);
        let user_vault = master_vault.create_user_vault(owner.id()).unwrap();
        assert_eq!(
            user_vault.secrets().len(),
            0,
            "user_vault should have 0 secrets but has {}",
            user_vault.secrets().len()
        );

        let mut secret = Secret::new(
            owner.id(),
            &SecretCategory::Password,
            &String::from("my-super-secret"),
        )
        .await;

        master_vault.add_secret(owner.id(), &secret);
        assert_eq!(
            master_vault
                .get_user_vault(owner.id())
                .unwrap()
                .secrets()
                .len(),
            1,
            "user_vault should have 1 secrets but has {}",
            master_vault
                .get_user_vault(owner.id())
                .unwrap()
                .secrets()
                .len()
        );
        let secret_name = master_vault
            .get_user_vault(owner.id())
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
        master_vault.update_secret(owner.id(), &secret);
        let secret_name = master_vault
            .get_user_vault(owner.id())
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

        master_vault.remove_secret(owner.id(), &secret.id());
        assert_eq!(
            master_vault
                .get_user_vault(owner.id())
                .unwrap()
                .secrets()
                .len(),
            0,
            "user_vault should have 0 secrets but has {}",
            master_vault
                .get_user_vault(owner.id())
                .unwrap()
                .secrets()
                .len()
        );
    }
}
