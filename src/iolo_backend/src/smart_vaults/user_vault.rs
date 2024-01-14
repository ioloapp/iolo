use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

use std::collections::BTreeMap;

use super::secret::{Secret, SecretID, SecretSymmetricCryptoMaterial};
use super::testament::{Testament, TestamentID};
use crate::common::uuid::UUID;
use crate::users::user::User;
use crate::utils::time;
use crate::SmartVaultErr;

pub type UserVaultID = UUID;
pub type KeyBox = BTreeMap<SecretID, SecretSymmetricCryptoMaterial>;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct UserVault {
    id: UserVaultID,
    date_created: u64,
    date_modified: u64,
    /// The secrets
    secrets: BTreeMap<SecretID, Secret>, // TODO: remove this field

    // New: Secrets are stored as UUIDs in the user vault.
    pub secret_ids: Vec<UUID>,

    /// Contains all the keys required to decrypt the secrets:
    /// Every secret is encrypted by using dedicated key.
    /// This key is itself encrypted using the UserVault decryption key,
    /// which itself is derived by vetkd.
    key_box: KeyBox, // TODO: make getter and setter
    testaments: BTreeMap<TestamentID, Testament>,
    heirs: BTreeMap<Principal, User>,
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
            secret_ids: Vec::new(),
            key_box: BTreeMap::new(),
            testaments: BTreeMap::new(),
            heirs: BTreeMap::new(),
        }
    }

    pub fn id(&self) -> &UserVaultID {
        &self.id
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

    // TODO: make proper CRUD functions
    pub fn key_box_mut(&mut self) -> &mut KeyBox {
        &mut self.key_box
    }

    pub fn key_box(&self) -> &KeyBox {
        &self.key_box
    }

    pub fn get_secret(&self, secret_id: &str) -> Result<&Secret, SmartVaultErr> {
        self.secrets
            .get(secret_id)
            .ok_or_else(|| SmartVaultErr::SecretDoesNotExist(secret_id.to_string()))
    }

    pub fn get_secret_mut(&mut self, secret_id: &str) -> Result<&mut Secret, SmartVaultErr> {
        self.secrets
            .get_mut(secret_id)
            .ok_or_else(|| SmartVaultErr::SecretDoesNotExist(secret_id.to_string()))
    }

    pub fn add_secret(&mut self, secret: Secret) -> Result<Secret, SmartVaultErr> {
        let sid = secret.id().clone();
        if self.secrets.contains_key(secret.id()) {
            return Err(SmartVaultErr::SecretAlreadyExists(sid.to_string()));
        }

        self.secrets.insert(secret.id().clone(), secret);
        self.date_modified = time::get_current_time();
        Ok(self.secrets.get(&sid).unwrap().clone())
    }

    pub fn remove_secret(&mut self, secret_id: &str) -> Result<(), SmartVaultErr> {
        if !self.secrets.contains_key(secret_id) {
            return Err(SmartVaultErr::SecretDoesNotExist(secret_id.to_string()));
        }
        self.secrets.remove(secret_id);
        self.date_modified = time::get_current_time();
        Ok(())
    }

    pub fn update_secret(&mut self, secret: Secret) -> Result<Secret, SmartVaultErr> {
        let sid = secret.id().clone();
        if !self.secrets.contains_key(secret.id()) {
            return Err(SmartVaultErr::SecretDoesNotExist(secret.id().to_string()));
        }

        self.secrets.insert(sid.clone(), secret);
        self.date_modified = time::get_current_time();
        Ok(self.secrets.get(&sid).unwrap().clone())
    }

    pub fn update_testament(&mut self, mut t: Testament) -> Result<Testament, SmartVaultErr> {
        if !self.testaments.contains_key(t.id()) {
            return Err(SmartVaultErr::SecretDoesNotExist(t.id().to_string()));
        }
        let tid = t.id().clone();

        // condition_status cannot be updated
        t.set_condition_status(
            self.testaments
                .get(t.id())
                .unwrap()
                .conditions_status()
                .clone(),
        );

        self.testaments.insert(t.id().clone(), t);
        self.date_modified = time::get_current_time();
        Ok(self.testaments.get(&tid).unwrap().clone())
    }

    pub fn testaments(&self) -> &BTreeMap<TestamentID, Testament> {
        &self.testaments
    }

    pub fn testaments_mut(&mut self) -> &mut BTreeMap<TestamentID, Testament> {
        &mut self.testaments
    }

    pub fn add_testament(&mut self, testament: Testament) -> Result<(), SmartVaultErr> {
        if self.testaments.contains_key(testament.id()) {
            return Err(SmartVaultErr::SecretAlreadyExists(
                testament.id().to_string(),
            ));
        }

        self.testaments.insert(testament.id().clone(), testament);
        self.date_modified = time::get_current_time();
        Ok(())
    }

    pub fn get_testament(&self, testament_id: &TestamentID) -> Result<&Testament, SmartVaultErr> {
        self.testaments
            .get(testament_id)
            .ok_or_else(|| SmartVaultErr::TestamentDoesNotExist(testament_id.to_string()))
    }

    pub fn remove_testament(&mut self, testament_id: &TestamentID) -> Result<(), SmartVaultErr> {
        if !self.testaments.contains_key(testament_id) {
            return Err(SmartVaultErr::TestamentDoesNotExist(
                testament_id.to_string(),
            ));
        }
        self.testaments.remove(testament_id);
        self.date_modified = time::get_current_time();
        Ok(())
    }

    pub fn heirs(&self) -> &BTreeMap<Principal, User> {
        &self.heirs
    }

    pub fn get_heir(&self, user_id: &Principal) -> Result<&User, SmartVaultErr> {
        self.heirs
            .get(user_id)
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(user_id.to_string()))
    }

    pub fn add_heir(&mut self, user: User) -> Result<&User, SmartVaultErr> {
        if self.heirs.insert(*user.id(), user.clone()).is_some() {
            Err(SmartVaultErr::UserAlreadyExists(user.id().to_string()))
        } else {
            self.date_modified = time::get_current_time();
            self.get_heir(user.id())
        }
    }

    pub fn update_heir(&mut self, user: User) -> Result<User, SmartVaultErr> {
        let uid = user.id().clone();
        if !self.heirs.contains_key(user.id()) {
            return Err(SmartVaultErr::UserDoesNotExist(user.id().to_string()));
        }

        self.heirs.insert(uid.clone(), user);
        self.date_modified = time::get_current_time();
        Ok(self.heirs.get(&uid).unwrap().clone())
    }

    pub fn remove_heir(&mut self, user_id: &Principal) -> Result<(), SmartVaultErr> {
        if !self.heirs.contains_key(user_id) {
            return Err(SmartVaultErr::UserDoesNotExist(user_id.to_string()));
        }
        self.heirs.remove(user_id);
        self.date_modified = time::get_current_time();
        Ok(())
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use std::thread;

    #[test]
    fn utest_user_vault_create_uservault() {
        // Create empty user_vault
        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(100)); // Sleep 100 milliseconds to ensure that user_vault has a different creation date
        let user_vault: UserVault = UserVault::new();

        // Check dates
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

        // Create 2nd user_vault
        let user_vault_2: UserVault = UserVault::new();
        assert_ne!(
            user_vault.id(),
            user_vault_2.id(),
            "user_vault.id {} must not be equal to user_vault_2.id {}",
            user_vault.id(),
            user_vault_2.id()
        );
    }

    #[test]
    fn utest_user_vault_add_secret() {
        // Create empty user_vault
        let mut user_vault: UserVault = UserVault::new();

        // Create secret stuff...
        let _secret_name = String::from("my-first-secret");
        let secret: Secret = Secret::new_test_instance();
        let modified_before_update = user_vault.date_modified;
        let created_before_update = user_vault.date_created;

        // Add secret to user_vault
        assert_eq!(user_vault.add_secret(secret.clone()), Ok(secret.clone()));

        // Same secret cannot be added twice
        assert_eq!(
            user_vault.add_secret(secret.clone()),
            Err(SmartVaultErr::SecretAlreadyExists(secret.id().to_string())),
            "Error must be {:?} but is {:?}",
            SmartVaultErr::SecretAlreadyExists(secret.id().to_string()),
            user_vault.add_secret(secret.clone())
        );

        // Check dates
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

        // Check secrets() function
        assert_eq!(
            user_vault.secrets().len(),
            1,
            "user_vault should have 1 secret now yet but has {}",
            user_vault.secrets().len()
        );
        assert!(
            user_vault.secrets().get(secret.id()).is_some(),
            "Secret with id {} is not existing in user_vault",
            secret.id()
        );

        // Check get_secret()
        assert_eq!(
            user_vault.get_secret(secret.id()).unwrap().name(),
            None,
            "secret.name must be None but is {:?}",
            user_vault.get_secret(secret.id()).unwrap().name(),
        );
        let uuid = "UUID::new()";
        assert_eq!(
            user_vault.get_secret(&uuid),
            Err(SmartVaultErr::SecretDoesNotExist(uuid.to_string())),
            "Error must be {:?} but is {:?}",
            SmartVaultErr::SecretDoesNotExist(uuid.to_string()),
            user_vault.get_secret(&uuid)
        );

        // Check get_secret_mut()
        let secret_mut = user_vault.get_secret_mut(secret.id()).unwrap();
        let uuid = "UUID::new()";
        assert_eq!(
            user_vault.get_secret_mut(&uuid),
            Err(SmartVaultErr::SecretDoesNotExist(uuid.to_string()))
        );
    }

    #[test]
    fn utest_user_vault_update_secret() {
        // Create empty user_vault
        let mut user_vault: UserVault = UserVault::new();

        // Add secret to user_vault
        let secret_name = String::from("my-first-secret");
        let mut secret: Secret = Secret::new_test_instance();
        let mut modified_before_update = user_vault.date_modified;
        let mut created_before_update = user_vault.date_created;
        user_vault.add_secret(secret.clone());

        // Update secret
        let username = String::from("my-username");
        let password = String::from("my-password");
        secret.set_username(username.as_bytes().to_vec());
        secret.set_password(password.as_bytes().to_vec());
        modified_before_update = user_vault.date_modified;
        created_before_update = user_vault.date_created;
        assert_eq!(user_vault.update_secret(secret.clone()), Ok(secret));
        assert_eq!(
            user_vault.secrets().len(),
            1,
            "user_vault should have 1 secret now yet but has {}",
            user_vault.secrets().len()
        );

        // Check dates
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

    #[test]
    fn utest_user_vault_remove_secret() {
        // Create empty user_vault
        let mut user_vault: UserVault = UserVault::new();

        // Add secret to user_vault
        let secret_name = String::from("my-first-secret");
        let secret: Secret = Secret::new_test_instance();
        let mut modified_before_update = user_vault.date_modified;
        let mut created_before_update = user_vault.date_created;
        user_vault.add_secret(secret.clone());

        // Remove secret
        modified_before_update = user_vault.date_modified;
        created_before_update = user_vault.date_created;
        assert_eq!(user_vault.remove_secret(secret.id()), Ok(()));
        assert_eq!(
            user_vault.secrets().len(),
            0,
            "user_vault should have 0 secret now yet but has {}",
            user_vault.secrets().len()
        );

        // Check dates
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
