use std::{borrow::Cow, collections::BTreeMap};

use candid::{CandidType, Decode, Encode, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use serde::{Deserialize, Serialize};

use crate::{
    common::error::SmartVaultErr,
    secrets::secret::{SecretID},
    utils::time,
};

use super::contact::Contact;

pub type KeyBox = BTreeMap<SecretID, Vec<u8>>;
pub type PrincipalID = String;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct User {
    pub id: PrincipalID,
    pub name: Option<String>,
    pub email: Option<String>,
    pub user_type: Option<UserType>,
    pub date_created: u64,
    pub date_modified: u64,
    pub date_last_login: Option<u64>,
    pub contacts: Vec<Contact>, // TODO: make hashset?
    // New: Secrets, KeyBox and policies are stored in the user
    pub secrets: Vec<SecretID>, // TODO: make hashset?
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
pub struct AddOrUpdateUserArgs {
    pub name: Option<String>,
    pub email: Option<String>,
    pub user_type: Option<UserType>,
}

impl From<AddOrUpdateUserArgs> for User {
    fn from(value: AddOrUpdateUserArgs) -> Self {
        let now = time::get_current_time();
        User {
            id: Principal::anonymous().to_string(),
            name: value.name,
            email: value.email,
            user_type: value.user_type,
            date_created: now,
            date_modified: now,
            date_last_login: None,
            contacts: Vec::new(),
            secrets: Vec::new(),
            policies: Vec::new(),
            key_box: KeyBox::new(),
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Hash)]
pub enum UserType {
    Person,
    Company,
}

impl User {
    pub fn new(id: PrincipalID, args: AddOrUpdateUserArgs) -> Self {
        let now = time::get_current_time();

        Self {
            id,
            name: args.name,
            email: args.email,
            user_type: args.user_type,
            date_created: now,
            date_modified: now,
            date_last_login: Some(now),
            contacts: Vec::new(),
            secrets: Vec::new(),
            policies: Vec::new(),
            key_box: KeyBox::new(),
        }
    }

    pub fn id(&self) -> &PrincipalID {
        &self.id
    }

    pub fn key_box(&self) -> &KeyBox {
        &self.key_box
    }

    pub fn policies(&self) -> &Vec<String> {
        &self.policies
    }

    pub fn date_last_login(&self) -> &Option<u64> {
        &self.date_last_login
    }

    pub fn add_secret(
        &mut self,
        secret_id: SecretID,
        encrypted_symmetric_key: Vec<u8>,
    ) {
        self.secrets.push(secret_id.clone());
        self.key_box.insert(secret_id, encrypted_symmetric_key);
        self.date_modified = time::get_current_time();
    }

    pub fn remove_secret(&mut self, secret_id: &SecretID) -> Result<(), SmartVaultErr> {
        // Check if the secret exists in either `secrets` or `key_box`
        let exists_in_secrets = self.secrets.iter().any(|s| s == secret_id);
        let exists_in_key_box = self.key_box.contains_key(secret_id);

        if exists_in_secrets || exists_in_key_box {
            // Remove the secret from both collections if it exists
            self.secrets.retain(|s| s != secret_id);
            self.key_box.remove(secret_id);

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

    pub fn update_login_date(&mut self) {
        let now = time::get_current_time();
        self.date_last_login = Some(now);
        self.date_modified = now;
    }
}
