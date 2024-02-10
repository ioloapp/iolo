use std::borrow::Cow;
use std::hash::{Hash, Hasher};

use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use serde::Serialize;

use crate::{common::uuid::UUID, users::user::PrincipalID, utils::time};

pub type SecretID = String;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SecretCategory {
    Password,
    Note,
    Document,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Secret {
    pub id: SecretID,
    owner: PrincipalID,
    date_created: u64,
    date_modified: u64,
    category: Option<SecretCategory>,
    name: Option<String>,
    username: Option<Vec<u8>>,
    password: Option<Vec<u8>>,
    url: Option<String>,
    notes: Option<Vec<u8>>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct AddSecretArgs {
    pub category: Option<SecretCategory>,
    pub name: Option<String>,
    pub username: Option<Vec<u8>>,
    pub password: Option<Vec<u8>>,
    pub url: Option<String>,
    pub notes: Option<Vec<u8>>,
    pub encrypted_symmetric_key: Vec<u8>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct UpdateSecretArgs {
    pub id: SecretID,
    pub category: Option<SecretCategory>,
    pub name: Option<String>,
    pub username: Option<Vec<u8>>,
    pub password: Option<Vec<u8>>,
    pub url: Option<String>,
    pub notes: Option<Vec<u8>>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Hash)]
pub struct SecretListEntry {
    pub id: SecretID,
    pub category: Option<SecretCategory>,
    pub name: Option<String>,
}

impl From<Secret> for SecretListEntry {
    fn from(s: Secret) -> Self {
        SecretListEntry {
            id: s.id().to_string(),
            category: s.category(),
            name: s.name(),
        }
    }
}

impl Hash for Secret {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.id.hash(state);
    }
}

impl Eq for Secret {}

impl PartialEq for Secret {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

impl Secret {
    pub async fn new_test_instance() -> Self {
        let now: u64 = time::get_current_time();
        Self {
            id: UUID::new().await,
            owner: Principal::anonymous().to_string(),
            date_created: now,
            date_modified: now,
            category: None,
            name: None,
            username: Option::None,
            password: Option::None,
            url: Option::None,
            notes: Option::None,
        }
    }

    pub fn create_from_add_secret_args(
        owner: PrincipalID,
        secret_id: SecretID,
        asa: AddSecretArgs,
    ) -> Self {
        let now: u64 = time::get_current_time();

        Self {
            id: secret_id,
            owner,
            date_created: now,
            date_modified: now,
            category: asa.category,
            name: asa.name,
            username: asa.username,
            password: asa.password,
            url: asa.url,
            notes: asa.notes,
        }
    }

    pub fn create_from_update_secret_args(
        owner: PrincipalID,
        date_created: u64,
        usa: UpdateSecretArgs,
    ) -> Self {
        let now: u64 = time::get_current_time();

        Self {
            id: usa.id,
            owner,
            date_created,
            date_modified: now,
            category: usa.category,
            name: usa.name,
            username: usa.username,
            password: usa.password,
            url: usa.url,
            notes: usa.notes,
        }
    }

    pub fn id(&self) -> SecretID {
        self.id.clone()
    }

    pub fn date_created(&self) -> &u64 {
        &self.date_created
    }

    pub fn date_modified(&self) -> &u64 {
        &self.date_modified
    }

    pub fn category(&self) -> Option<SecretCategory> {
        self.category
    }

    pub fn name(&self) -> Option<String> {
        self.name.clone()
    }

    pub fn owner(&self) -> PrincipalID {
        self.owner.clone()
    }

    pub fn set_name(&mut self, name: String) {
        self.name = Some(name);
        self.date_modified = time::get_current_time();
    }

    pub fn username(&self) -> Option<&Vec<u8>> {
        self.username.as_ref()
    }

    pub fn set_username(&mut self, username: Vec<u8>) {
        self.username = Some(username);
        self.date_modified = time::get_current_time();
    }

    pub fn password(&self) -> Option<&Vec<u8>> {
        self.password.as_ref()
    }

    pub fn set_password(&mut self, password: Vec<u8>) {
        self.password = Some(password);
        self.date_modified = time::get_current_time();
    }

    pub fn url(&self) -> Option<&String> {
        self.url.as_ref()
    }

    pub fn set_url(&mut self, url: String) {
        self.url = Some(url);
        self.date_modified = time::get_current_time();
    }

    pub fn notes(&self) -> Option<&Vec<u8>> {
        self.notes.as_ref()
    }

    pub fn set_notes(&mut self, notes: Vec<u8>) {
        self.notes = Some(notes);
        self.date_modified = time::get_current_time();
    }
}

impl Storable for Secret {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_new_test_instance() {
        let secret = Secret::new_test_instance().await;

        assert_eq!(secret.date_created(), secret.date_modified());
        assert!(secret.category().is_none());
        assert!(secret.name().is_none());
        assert!(secret.username().is_none());
        assert!(secret.password().is_none());
        assert!(secret.url().is_none());
        assert!(secret.notes().is_none());
    }

    #[tokio::test]
    async fn test_from_add_secret_args() {
        let args = AddSecretArgs {
            category: Some(SecretCategory::Password),
            name: Some("test_name".to_string()),
            username: Some(vec![1, 2, 3]),
            password: Some(vec![4, 5, 6]),
            url: Some("http://test.com".to_string()),
            notes: Some(vec![7, 8, 9]),
            encrypted_symmetric_key: vec![1, 2, 3],
        };

        // let secret: Secret = args.into();
        let secret: Secret = Secret::create_from_add_secret_args(
            Principal::anonymous().to_string(),
            UUID::new().await,
            args,
        );

        assert_eq!(secret.category(), Some(SecretCategory::Password));
        assert_eq!(secret.name(), Some("test_name".to_string()));
        assert_eq!(secret.username(), Some(&vec![1, 2, 3]));
        assert_eq!(secret.password(), Some(&vec![4, 5, 6]));
        assert_eq!(secret.url(), Some(&"http://test.com".to_string()));
        assert_eq!(secret.notes(), Some(&vec![7, 8, 9]));
    }

    #[tokio::test]
    async fn test_setters() {
        let mut secret = Secret::new_test_instance().await;

        // Testing set_name
        let initial_date_modified = *secret.date_modified();
        secret.set_name("new_name".to_string());
        assert_eq!(secret.name(), Some("new_name".to_string()));
        assert!(*secret.date_modified() > initial_date_modified);

        // Testing set_username
        let username_data = vec![1, 2, 3];
        secret.set_username(username_data.clone());
        assert_eq!(secret.username(), Some(&username_data));
        assert!(*secret.date_modified() > initial_date_modified);

        // Testing set_password
        let password_data = vec![4, 5, 6];
        secret.set_password(password_data.clone());
        assert_eq!(secret.password(), Some(&password_data));
        assert!(*secret.date_modified() > initial_date_modified);

        // Testing set_url
        let url_data = "http://test.com".to_string();
        secret.set_url(url_data.clone());
        assert_eq!(secret.url(), Some(&url_data));
        assert!(*secret.date_modified() > initial_date_modified);

        // Testing set_notes
        let notes_data = vec![7, 8, 9];
        secret.set_notes(notes_data.clone());
        assert_eq!(secret.notes(), Some(&notes_data));
        assert!(*secret.date_modified() > initial_date_modified);
    }
}
