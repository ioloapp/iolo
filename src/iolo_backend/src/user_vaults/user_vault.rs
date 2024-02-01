use std::collections::BTreeMap;

use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

use crate::common::uuid::UUID;
use crate::policies::policy::{Policy, PolicyID};
use crate::secrets::secret::{Secret, SecretID, SecretSymmetricCryptoMaterial};
use crate::SmartVaultErr;
use crate::users::user::User;
use crate::utils::time;

pub type UserVaultID = UUID;
pub type KeyBox = BTreeMap<UUID, SecretSymmetricCryptoMaterial>;

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
    policies: BTreeMap<PolicyID, Policy>,
    beneficiaries: BTreeMap<Principal, User>,
}

impl Default for UserVault {
    fn default() -> Self {
        Self::new_sync()
    }
}

impl UserVault {
    pub async fn new() -> Self {
        let now: u64 = time::get_current_time();
        let uuid = UUID::new_random().await;
        Self {
            id: uuid,
            date_created: now,
            date_modified: now,
            secrets: BTreeMap::new(),
            secret_ids: Vec::new(),
            key_box: BTreeMap::new(),
            policies: BTreeMap::new(),
            beneficiaries: BTreeMap::new(),
        }
    }

    pub fn new_sync() -> Self {
        let now: u64 = time::get_current_time();
        let uuid = UUID::new();
        Self {
            id: uuid,
            date_created: now,
            date_modified: now,
            secrets: BTreeMap::new(),
            secret_ids: Vec::new(),
            key_box: BTreeMap::new(),
            policies: BTreeMap::new(),
            beneficiaries: BTreeMap::new(),
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

    // // TODO: remove this function eventually. it is not required anymore. we use the add_secret_id
    // pub fn add_secret(&mut self, secret: Secret) -> Result<Secret, SmartVaultErr> {
    //     let sid = secret.id().clone();
    //     if self.secrets.contains_key(secret.id()) {
    //         return Err(SmartVaultErr::SecretAlreadyExists(sid.to_string()));
    //     }

    //     self.secrets.insert(secret.id().clone(), secret);
    //     self.date_modified = time::get_current_time();
    //     Ok(self.secrets.get(&sid).unwrap().clone())
    // }

    pub fn add_secret_id(&mut self, secret_id: UUID) -> Result<(), SmartVaultErr> {
        if self.secret_ids.contains(&secret_id) {
            return Err(SmartVaultErr::SecretAlreadyExists(secret_id.to_string()));
        }

        self.secret_ids.push(secret_id);
        self.date_modified = time::get_current_time();
        Ok(())
    }

    pub fn remove_secret(&mut self, secret_id: &str) -> Result<(), SmartVaultErr> {
        if !self.secrets.contains_key(secret_id) {
            return Err(SmartVaultErr::SecretDoesNotExist(secret_id.to_string()));
        }
        self.secrets.remove(secret_id);
        self.date_modified = time::get_current_time();
        Ok(())
    }

    // pub fn update_secret(&mut self, secret: Secret) -> Result<Secret, SmartVaultErr> {
    //     let sid = secret.id().clone();
    //     if !self.secrets.contains_key(secret.id()) {
    //         return Err(SmartVaultErr::SecretDoesNotExist(secret.id().to_string()));
    //     }

    //     self.secrets.insert(sid.clone(), secret);
    //     self.date_modified = time::get_current_time();
    //     Ok(self.secrets.get(&sid).unwrap().clone())
    // }

    pub fn update_policy(&mut self, mut t: Policy) -> Result<Policy, SmartVaultErr> {
        if !self.policies.contains_key(t.id()) {
            return Err(SmartVaultErr::SecretDoesNotExist(t.id().to_string()));
        }
        let tid = t.id().clone();

        // condition_status cannot be updated
        t.set_condition_status(*self.policies.get(t.id()).unwrap().conditions_status());

        self.policies.insert(t.id().clone(), t);
        self.date_modified = time::get_current_time();
        Ok(self.policies.get(&tid).unwrap().clone())
    }

    pub fn policies(&self) -> &BTreeMap<PolicyID, Policy> {
        &self.policies
    }

    pub fn policies_mut(&mut self) -> &mut BTreeMap<PolicyID, Policy> {
        &mut self.policies
    }

    pub fn add_policy(&mut self, policy: Policy) -> Result<(), SmartVaultErr> {
        if self.policies.contains_key(policy.id()) {
            return Err(SmartVaultErr::SecretAlreadyExists(policy.id().to_string()));
        }

        self.policies.insert(policy.id().clone(), policy);
        self.date_modified = time::get_current_time();
        Ok(())
    }

    pub fn get_policy(&self, policy_id: &PolicyID) -> Result<&Policy, SmartVaultErr> {
        self.policies
            .get(policy_id)
            .ok_or_else(|| SmartVaultErr::PolicyDoesNotExist(policy_id.to_string()))
    }

    pub fn remove_policy(&mut self, policy_id: &PolicyID) -> Result<(), SmartVaultErr> {
        if !self.policies.contains_key(policy_id) {
            return Err(SmartVaultErr::PolicyDoesNotExist(policy_id.to_string()));
        }
        self.policies.remove(policy_id);
        self.date_modified = time::get_current_time();
        Ok(())
    }

    pub fn beneficiaries(&self) -> &BTreeMap<Principal, User> {
        &self.beneficiaries
    }

    pub fn get_beneficiary(&self, user_id: &Principal) -> Result<&User, SmartVaultErr> {
        self.beneficiaries
            .get(user_id)
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(user_id.to_string()))
    }

    pub fn add_beneficiary(&mut self, user: User) -> Result<&User, SmartVaultErr> {
        if self
            .beneficiaries
            .insert(*user.id(), user.clone())
            .is_some()
        {
            Err(SmartVaultErr::UserAlreadyExists(user.id().to_string()))
        } else {
            self.date_modified = time::get_current_time();
            self.get_beneficiary(user.id())
        }
    }

    pub fn update_beneficiary(&mut self, user: User) -> Result<User, SmartVaultErr> {
        let uid = *user.id();
        if !self.beneficiaries.contains_key(user.id()) {
            return Err(SmartVaultErr::UserDoesNotExist(user.id().to_string()));
        }

        self.beneficiaries.insert(uid, user);
        self.date_modified = time::get_current_time();
        Ok(self.beneficiaries.get(&uid).unwrap().clone())
    }

    pub fn remove_beneficiary(&mut self, user_id: &Principal) -> Result<(), SmartVaultErr> {
        if !self.beneficiaries.contains_key(user_id) {
            return Err(SmartVaultErr::UserDoesNotExist(user_id.to_string()));
        }
        self.beneficiaries.remove(user_id);
        self.date_modified = time::get_current_time();
        Ok(())
    }
}
