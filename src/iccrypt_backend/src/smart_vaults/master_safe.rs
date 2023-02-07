use std::collections::BTreeMap;

use candid::{CandidType, Deserialize};

use crate::common::user::{UserID};
use crate::utils::time;

use super::{
    secret::{Secret, SecretID},
    user_safe::UserSafe,
};

pub type UserSafes = BTreeMap<UserID, UserSafe>;

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

    // Returns a mutable reference to the user safe
    // Creates a new one if not existing
    pub fn get_or_create_user_safe(&mut self, owner: UserID) -> &mut UserSafe {
        self.user_safes().entry(owner).or_insert(UserSafe::new(owner)) // Get existing user_safe or create new one
    }

    // Delete a user_safe from the master_safe
    pub fn remove_user_safe(&mut self, owner: UserID) {
        self.user_safes.remove(&owner);
    }

    // Inserts a secret into a user's safe.
    pub fn add_secret(&mut self, owner: UserID, secret: Secret) {
        let user_safe = self.get_or_create_user_safe(owner);
        user_safe.add_secret(secret);
    }

    // Replace a secret
    pub fn update_secret(&mut self, owner: UserID, secret: Secret) {
        let user_safe = self.get_or_create_user_safe(owner);
        user_safe.update_secret(secret);
        
    }

    // Remove a secret
    pub fn remove_secret(&mut self, owner: UserID, secret_id: &SecretID) {
        let user_safe = self.get_or_create_user_safe(owner);
        user_safe.remove_secret(secret_id);
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::{common::user::{User}, smart_vaults::secret::SecretCategory};
    use std::thread;

    #[test]
    fn utest_new_master_safe() {
        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that master_safe has a different creation date
        let master_safe = MasterSafe::new();

        assert_eq!(master_safe.user_safes.len(), 0, "master_safe should have 0 user_safes but has {}", master_safe.user_safes.len());
        assert!(master_safe.date_created > before, "date_created ({}) must be > before ({})", master_safe.date_created, before);
        assert!(master_safe.date_modified == master_safe.date_created, "date_modified ({}) must be == date_created ({})", master_safe.date_modified, master_safe.date_created);
    }

    #[tokio::test]
    async fn utest_get_or_create_user_safe() {
        let mut master_safe = MasterSafe::new();
  
        // Create a new empty user_safe and obtain a mutable reference
        let owner = User::new_random_with_seed(1).get_id();
        let user_safe_1 = master_safe.get_or_create_user_safe(owner);
        //assert_eq!(master_safe.user_safes().len() , 1, "master_safe should have 1 user_safe but has {}", master_safe.user_safes().len());

        // Add a secret to the user_safe to ensure we got back a mutable reference from 'get_or_create_user_safe()' (create part)
        user_safe_1.add_secret(Secret::new(owner, SecretCategory::Password, String::from("my-super-secret")).await);  // Works, so it's a mutable reference
        assert_eq!(user_safe_1.secrets().len(), 1, "user_safe in master_safe should have 1 secret but has {}", user_safe_1.secrets().len());

        // Add another user_safe
        let owner_2 = User::new_random_with_seed(2).get_id();
        master_safe.get_or_create_user_safe(owner_2); // Create new user_safe
        assert_eq!(master_safe.user_safes().len(), 2, "master_safe should have 2 user_safes but has {}", master_safe.user_safes().len());

        let user_safe_2 = master_safe.get_or_create_user_safe(owner_2); // This is now not the create function but the get part...
        assert_eq!(user_safe_2.secrets().len(), 0, "user_safe_2 should have 0 secrets but has {}", user_safe_2.secrets().len());

        // Add a secret to the user_safe to ensure we got back a mutable reference from 'get_or_create_user_safe()' (get part)
        user_safe_2.add_secret(Secret::new(owner, SecretCategory::Password, String::from("my-super-secret")).await);  // Works, so it's a mutable reference
        assert_eq!(user_safe_2.secrets().len(), 1, "user_safe in master_safe should have 1 secret but has {}", user_safe_2.secrets().len());
        
    }

    #[test]
    fn utest_remove_user_safe() {
        let mut master_safe = MasterSafe::new();
        let owner = User::new_random_with_seed(1).get_id();
        master_safe.get_or_create_user_safe(owner);
        assert_eq!(master_safe.user_safes().len() , 1, "master_safe should have 1 user_safe but has {}", master_safe.user_safes().len());

        master_safe.remove_user_safe(owner);
        assert_eq!(master_safe.user_safes().len() , 0, "master_safe should have 0 user_safe but has {}", master_safe.user_safes().len());
    }

    #[tokio::test]
    async fn utest_secrets() {
        let mut master_safe = MasterSafe::new();
        let owner = User::new_random_with_seed(1).get_id();
        let user_safe = master_safe.get_or_create_user_safe(owner);
        assert_eq!(user_safe.secrets().len(), 0, "user_safe should have 0 secrets but has {}", user_safe.secrets().len());

        let mut secret = Secret::new(owner, SecretCategory::Password, String::from("my-super-secret")).await;
        user_safe.add_secret(secret.clone());
        assert_eq!(user_safe.secrets().len(), 1, "user_safe should have 1 secrets but has {}", user_safe.secrets().len());
        assert_eq!(user_safe.secrets().get(secret.id()).unwrap().name(), "my-super-secret", "secret should have name my-super-secret but has {}", user_safe.secrets().get(secret.id()).unwrap().name());

        secret.set_name(String::from("my-super-secret-new"));
        user_safe.update_secret(secret.clone());
        assert_eq!(user_safe.secrets().get(secret.id()).unwrap().name(), "my-super-secret-new", "secret should have name my-super-secret-new but has {}", user_safe.secrets().get(secret.id()).unwrap().name());

        user_safe.remove_secret(secret.id());
        assert_eq!(user_safe.secrets().len(), 0, "user_safe should have 0 secrets but has {}", user_safe.secrets().len());
    }
}