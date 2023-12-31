use candid::{CandidType, Deserialize};
use serde::Serialize;

use crate::utils::time;

pub type SecretID = String;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SecretCategory {
    Password,
    Note,
    Document,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct Secret {
    id: String,
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
    pub id: String,
    pub category: Option<SecretCategory>,
    pub name: Option<String>,
    pub username: Option<Vec<u8>>,
    pub password: Option<Vec<u8>>,
    pub url: Option<String>,
    pub notes: Option<Vec<u8>>,
    // All the information required to decrypt the secret.
    // This material will be stored in the uservault's key box
    pub symmetric_crypto_material: SecretSymmetricCryptoMaterial,
}

impl From<AddSecretArgs> for Secret {
    fn from(value: AddSecretArgs) -> Self {
        let now = time::get_current_time();
        Secret {
            id: value.id,
            date_created: now,
            date_modified: now,
            category: value.category,
            name: value.name,
            username: value.username,
            password: value.password,
            url: value.url,
            notes: value.notes,
        }
    }
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
            id: s.id().into(),
            category: s.category(),
            name: s.name(),
        }
    }
}

/// SecretDecryptionMaterial contains all the information required to decrypt a secret:
///
/// 1) The aes gcm decryption key encrypted with the uservault's vetkd key
/// 2) The nonce/iv required to decrypt the decryption key
/// 3) The nonces requried to decrypt the different fields
#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Default)]
pub struct SecretSymmetricCryptoMaterial {
    /// the "decryption key" (encrypted using the uservaults vetkd) required to decrypt username, password and notes
    pub encrypted_symmetric_key: Vec<u8>,
    /// the initialization vector (iv/nonce) to decrypt the encrypted_decryption_key
    pub iv: Vec<u8>,
    /// the iv/nonce required to decrypt the encrypted username using the "decryption key"
    pub username_decryption_nonce: Option<Vec<u8>>,
    /// the iv/nonce required to decrypt the encrypted password using the "decryption key"
    pub password_decryption_nonce: Option<Vec<u8>>,
    /// the iv/nonce required to decrypt the encrypted notes using the "decryption key"
    pub notes_decryption_nonce: Option<Vec<u8>>,
}

impl Secret {
    pub fn new_test_instance() -> Self {
        let now: u64 = time::get_current_time();
        Self {
            id: now.to_string(),
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

    pub fn id(&self) -> &SecretID {
        &self.id
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_test_instance() {
        let secret = Secret::new_test_instance();

        assert_eq!(secret.id(), &secret.date_created().to_string());
        assert_eq!(secret.date_created(), secret.date_modified());
        assert!(secret.category().is_none());
        assert!(secret.name().is_none());
        assert!(secret.username().is_none());
        assert!(secret.password().is_none());
        assert!(secret.url().is_none());
        assert!(secret.notes().is_none());
    }

    #[test]
    fn test_from_add_secret_args() {
        let args = AddSecretArgs {
            id: "test_id".to_string(),
            category: Some(SecretCategory::Password),
            name: Some("test_name".to_string()),
            username: Some(vec![1, 2, 3]),
            password: Some(vec![4, 5, 6]),
            url: Some("http://test.com".to_string()),
            notes: Some(vec![7, 8, 9]),
            symmetric_crypto_material: SecretSymmetricCryptoMaterial {
                encrypted_symmetric_key: vec![1, 2, 3],
                iv: vec![1, 2, 3],
                username_decryption_nonce: Some(vec![1, 2, 3]),
                password_decryption_nonce: Some(vec![1, 2, 3]),
                notes_decryption_nonce: Some(vec![1, 2, 3]),
                // Populate the fields for SecretDecryptionMaterial
                // as per your structure...
            },
        };

        let secret: Secret = args.into();

        assert_eq!(secret.id(), "test_id");
        assert_eq!(secret.category(), Some(SecretCategory::Password));
        assert_eq!(secret.name(), Some("test_name".to_string()));
        assert_eq!(secret.username(), Some(&vec![1, 2, 3]));
        assert_eq!(secret.password(), Some(&vec![4, 5, 6]));
        assert_eq!(secret.url(), Some(&"http://test.com".to_string()));
        assert_eq!(secret.notes(), Some(&vec![7, 8, 9]));
    }

    #[test]
    fn test_setters() {
        let mut secret = Secret::new_test_instance();

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
