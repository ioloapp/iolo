use std::borrow::Cow;

use candid::{CandidType, Decode, Encode, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use serde::{Deserialize, Serialize};

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    secrets::secret::SecretSymmetricCryptoMaterial,
    user_vaults::user_vault::{KeyBox, UserVaultID},
    utils::time,
};

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct User {
    pub id: Principal,
    pub name: Option<String>,
    pub email: Option<String>,
    pub user_type: Option<UserType>,
    pub date_created: u64,
    pub date_modified: u64,
    pub date_last_login: Option<u64>,
    pub user_vault_id: Option<UserVaultID>,
    // New: Secrets, KeyBox and policies are stored in the user
    pub secrets: Vec<UUID>,
    pub policies: Vec<String>,
    pub key_box: KeyBox,
}

impl Storable for User {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct AddUserArgs {
    pub id: Principal,
    pub name: Option<String>,
    pub email: Option<String>,
    pub user_type: Option<UserType>,
}

impl From<AddUserArgs> for User {
    fn from(value: AddUserArgs) -> Self {
        let now = time::get_current_time();
        User {
            id: value.id,
            name: value.name,
            email: value.email,
            user_type: value.user_type,
            date_created: now,
            date_modified: now,
            date_last_login: None,
            user_vault_id: None,
            secrets: Vec::new(),
            policies: Vec::new(),
            key_box: KeyBox::new(),
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub enum UserType {
    Person,
    Company,
}

impl User {
    pub fn new(id: &Principal, args: AddUserArgs) -> Self {
        let now = time::get_current_time();

        Self {
            id: *id,
            name: args.name,
            email: args.email,
            user_type: args.user_type,
            date_created: now,
            date_modified: now,
            date_last_login: Some(now),
            user_vault_id: None,
            secrets: Vec::new(),
            policies: Vec::new(),
            key_box: KeyBox::new(),
        }
    }

    pub fn id(&self) -> &Principal {
        &self.id
    }

    pub fn user_vault_id(&self) -> &Option<UserVaultID> {
        &self.user_vault_id
    }

    pub fn key_box(&self) -> &KeyBox {
        &self.key_box
    }

    pub fn date_last_login(&self) -> &Option<u64> {
        &self.date_last_login
    }

    pub fn add_secret(
        &mut self,
        secret_id: UUID,
        secret_decryption_material: SecretSymmetricCryptoMaterial,
    ) {
        self.secrets.push(secret_id);
        self.key_box.insert(secret_id, secret_decryption_material);
        self.date_modified = time::get_current_time();
    }

    pub fn remove_secret(&mut self, secret_id: UUID) -> Result<(), SmartVaultErr> {
        // Check if the secret exists in either `secrets` or `key_box`
        let exists_in_secrets = self.secrets.iter().any(|s| s == &secret_id);
        let exists_in_key_box = self.key_box.contains_key(&secret_id);

        if exists_in_secrets || exists_in_key_box {
            // Remove the secret from both collections if it exists
            self.secrets.retain(|s| s != &secret_id);
            self.key_box.remove(&secret_id);

            // Update the date_modified
            self.date_modified = time::get_current_time();

            Ok(())
        } else {
            // Return an error if the secret does not exist in both collections
            Err(SmartVaultErr::SecretDoesNotExist(secret_id.to_string()))
        }
    }

    pub fn add_policy(&mut self, policy_id: String) {
        self.policies.push(policy_id);
        self.date_modified = time::get_current_time();
    }

    pub fn set_user_vault(&mut self, user_vault_id: UserVaultID) {
        self.user_vault_id = Some(user_vault_id);
        self.date_modified = time::get_current_time();
    }

    pub fn update_login_date(&mut self) {
        let now = time::get_current_time();
        self.date_last_login = Some(now);
        self.date_modified = now;
    }
}
