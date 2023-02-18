use std::collections::BTreeMap;

use candid::{CandidType, Deserialize, Principal};

use crate::common::user::UserID;
use crate::utils::time;

use super::{
    secret::{Secret, SecretID},
    user_safe::UserSafe,
};

pub type UserSafes = BTreeMap<Principal, UserSafe>;

#[derive(CandidType, Deserialize, Clone)]
pub struct MasterSafe {
    date_created: u64,
    date_modified: u64,
    user_safes: UserSafes,
}

impl Default for MasterSafe {
    fn default() -> Self {
        Self::new()
    }
}

impl MasterSafe {
    pub fn new() -> Self {
        let now = time::get_current_time();
        Self {
            date_created: now,
            date_modified: now,
            user_safes: BTreeMap::new(),
        }
    }

    pub fn date_created(&self) -> &u64 {
        &self.date_created
    }

    pub fn date_modified(&self) -> &u64 {
        &self.date_modified
    }

    pub fn user_safes(&mut self) -> &mut BTreeMap<UserID, UserSafe> {
        &mut self.user_safes
    }

    pub fn is_user_safe_existing(&self, owner: &UserID) -> bool {
        self.user_safes.contains_key(owner)
    }
    // Returns a immuntable reference to the user safe
    // Creates a new one if not existing
    pub fn get_or_create_user_safe(&mut self, owner: &UserID) -> &UserSafe {
        self.user_safes()
            .entry(*owner)
            .or_insert_with(|| UserSafe::new(owner)) // Get an existing user_safe for the owner or create a new one
    }

    // Delete a user_safe from the master_safe
    pub fn remove_user_safe(&mut self, owner: &UserID) {
        self.user_safes.remove(owner);
    }

    // Inserts a secret into a user's safe.
    pub fn add_secret(&mut self, owner: &UserID, secret: &Secret) {
        let user_safe = self
            .user_safes()
            .entry(*owner)
            .or_insert_with(|| UserSafe::new(owner)); // Get an existing user_safe for the owner or create a new one
        user_safe.add_secret(secret);
    }

    // Replace a secret
    pub fn update_secret(&mut self, owner: &UserID, secret: &Secret) {
        let user_safe = self
            .user_safes()
            .entry(*owner)
            .or_insert_with(|| UserSafe::new(owner)); // Get an existing user_safe for the owner or create a new one
        user_safe.update_secret(secret);
    }

    // Remove a secret
    pub fn remove_secret(&mut self, owner: &UserID, secret_id: &SecretID) {
        let user_safe = self
            .user_safes()
            .entry(*owner)
            .or_insert_with(|| UserSafe::new(owner)); // Get an existing user_safe for the owner or create a new one
        user_safe.remove_secret(secret_id);
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::{common::user::User, smart_vaults::secret::SecretCategory};
    use std::thread;

    #[test]
    fn utest_new_master_safe() {
        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that master_safe has a different creation date
        let master_safe = MasterSafe::new();

        assert_eq!(
            master_safe.user_safes.len(),
            0,
            "master_safe should have 0 user_safes but has {}",
            master_safe.user_safes.len()
        );
        assert!(
            master_safe.date_created > before,
            "date_created ({}) must be > before ({})",
            master_safe.date_created,
            before
        );
        assert!(
            master_safe.date_modified == master_safe.date_created,
            "date_modified ({}) must be == date_created ({})",
            master_safe.date_modified,
            master_safe.date_created
        );
    }

    #[tokio::test]
    async fn utest_get_or_create_user_safe() {
        let mut master_safe = MasterSafe::new();

        // Create a new empty user_safe
        let owner = User::new_random_with_seed(1);
        let user_safe_1a = master_safe.get_or_create_user_safe(owner.id()); // This is the create part (.or_insert())
        assert_eq!(
            user_safe_1a.owner(),
            owner.id(),
            "user_safe_1a should have owner: {},  but has {}",
            owner.id(),
            user_safe_1a.owner()
        );
        assert_eq!(
            user_safe_1a.secrets().len(),
            0,
            "user_safe_1a should have 0 secrets but has {}",
            user_safe_1a.secrets().len()
        );
        assert_eq!(
            master_safe.user_safes().len(),
            1,
            "master_safe should have 1 user_safe but has {}",
            master_safe.user_safes().len()
        );

        let user_safe_1b = master_safe.get_or_create_user_safe(owner.id()); // This is the get part (.entry())
        assert_eq!(
            user_safe_1b.owner(),
            owner.id(),
            "user_safe_1b should have owner: {},  but has {}",
            owner.id(),
            user_safe_1b.owner()
        );
        assert_eq!(
            user_safe_1b.secrets().len(),
            0,
            "user_safe_1b should have 0 secrets but has {}",
            user_safe_1b.secrets().len()
        );
        assert_eq!(
            master_safe.user_safes().len(),
            1,
            "master_safe should have 1 user_safe but has {}",
            master_safe.user_safes().len()
        );

        // Add another user_safe
        let owner_2 = User::new_random_with_seed(2);
        let _user_safe_2 = master_safe.get_or_create_user_safe(owner_2.id()); // Create new user_safe
        assert_eq!(
            master_safe.user_safes().len(),
            2,
            "master_safe should have 2 user_safes but has {}",
            master_safe.user_safes().len()
        );

        // Check if user_safe exists
        assert_eq!(
            master_safe.is_user_safe_existing(owner.id()),
            true,
            "user_safe for owner: {} should exist",
            owner.id()
        );
        let owner_3 = User::new_random_with_seed(3);
        assert_eq!(
            master_safe.is_user_safe_existing(owner_3.id()),
            false,
            "user_safe for owner: {} should not exist",
            owner_3.id()
        );
    }

    #[test]
    fn utest_remove_user_safe() {
        let mut master_safe = MasterSafe::new();
        let owner = User::new_random_with_seed(1);
        master_safe.get_or_create_user_safe(owner.id());
        assert_eq!(
            master_safe.user_safes().len(),
            1,
            "master_safe should have 1 user_safe but has {}",
            master_safe.user_safes().len()
        );

        master_safe.remove_user_safe(owner.id());
        assert_eq!(
            master_safe.user_safes().len(),
            0,
            "master_safe should have 0 user_safe but has {}",
            master_safe.user_safes().len()
        );
    }

    #[tokio::test]
    async fn utest_secrets() {
        let mut master_safe = MasterSafe::new();
        let owner = User::new_random_with_seed(1);
        let user_safe = master_safe.get_or_create_user_safe(owner.id());
        assert_eq!(
            user_safe.secrets().len(),
            0,
            "user_safe should have 0 secrets but has {}",
            user_safe.secrets().len()
        );

        let mut secret = Secret::new(
            owner.id(),
            &SecretCategory::Password,
            &String::from("my-super-secret"),
        )
        .await;
        master_safe.add_secret(owner.id(), &secret);
        assert_eq!(
            master_safe
                .get_or_create_user_safe(owner.id())
                .secrets()
                .len(),
            1,
            "user_safe should have 1 secrets but has {}",
            master_safe
                .get_or_create_user_safe(owner.id())
                .secrets()
                .len()
        );
        let secret_name = master_safe
            .get_or_create_user_safe(owner.id())
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
        master_safe.update_secret(owner.id(), &secret);
        let secret_name = master_safe
            .get_or_create_user_safe(owner.id())
            .secrets()
            .get(secret.id())
            .unwrap()
            .name();
        assert_eq!(
            secret_name, "my-super-secret-new",
            "secret should have name my-super-secret-new but has {}",
            secret_name
        );

        master_safe.remove_secret(owner.id(), &secret.id());
        assert_eq!(
            master_safe
                .get_or_create_user_safe(owner.id())
                .secrets()
                .len(),
            0,
            "user_safe should have 0 secrets but has {}",
            master_safe
                .get_or_create_user_safe(owner.id())
                .secrets()
                .len()
        );
    }
}
