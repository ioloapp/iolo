use candid::{CandidType, Deserialize};
use serde::Serialize;

use crate::utils::time;

pub type SecretID = String;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Copy, PartialEq, Eq)]
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
    pub secret: Secret,
    // All the information required to decrypt the secret.
    // This material will be stored in the uservault's key box
    pub decryption_material: SecretDecryptionMaterial,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
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

/// SecretDecryptionMaterial contains all the information required to
/// decrypt a secret:
/// 1) The aes gcm decryption key encrypted with the uservault's vetkd key
/// 2) The nonce/iv required to decrypt the decryption key
/// 3) The nonces requried to decrypt the different fields
#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Default)]
pub struct SecretDecryptionMaterial {
    // the "decryption key" (encrypted using the uservaults vetkd) required to decrypt username, password and notes
    pub encrypted_decryption_key: Vec<u8>,
    // the initialization vector (iv/nonce) to decrypt the encrypted_decryption_key
    pub iv: Vec<u8>,
    // the iv/nonce required to decrypt the encrypted username using the "decryption key"
    pub username_decryption_nonce: Option<Vec<u8>>,
    // the iv/nonce required to decrypt the encrypted password using the "decryption key"
    pub password_decryption_nonce: Option<Vec<u8>>,
    // the iv/nonce required to decrypt the encrypted notes using the "decryption key"
    pub notes_decryption_nonce: Option<Vec<u8>>,
}

impl Secret {
    pub fn new() -> Self {
        let id = time::get_current_time().to_string();
        let now: u64 = time::get_current_time();
        Self {
            id,
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

impl Default for Secret {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::smart_vaults::secret::SecretCategory;
    use std::thread;

    #[test]
    fn utest_secret_create_secret() {
        let category: SecretCategory = SecretCategory::Password;
        let name: String = String::from("my-first-secret");

        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different creation date
        let secret: Secret = Secret::new();

        assert!(
            secret.date_created() > &before,
            "date_created {} must be greater than before: {}",
            secret.date_created(),
            &before
        );
        assert_eq!(
            secret.date_modified(),
            secret.date_created(),
            "date_created {} must be equal to date_modified {}",
            secret.date_created(),
            secret.date_modified()
        );

        assert_eq!(secret.name(), Some(name));
        assert_eq!(secret.username(), Option::None);
        assert_eq!(secret.password(), Option::None);
        assert_eq!(secret.url(), Option::None);
        assert_eq!(secret.notes(), Option::None);
    }

    #[test]
    fn utest_secret_update_secret() {
        // Create secret
        let category: SecretCategory = SecretCategory::Password;
        let name: String = String::from("my-first-secret");

        let mut secret: Secret = Secret::new();

        // Update category
        let category_updated = SecretCategory::Note;
        let mut created_before_update = secret.date_created;
        let mut modified_before_update = secret.date_modified;
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different update date

        // Update name
        let name_updated = String::from("my-first-secret-updated");
        created_before_update = secret.date_created;
        modified_before_update = secret.date_modified;
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different update date

        secret.set_name(name_updated.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Name: date_created {} must be equal to created_before_update {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Name: date_modified {} must be greater than modified_before_update {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.name(), Some(name_updated));

        // Update username
        let encrypted_username = vec![1, 2, 3];
        created_before_update = secret.date_created;
        modified_before_update = secret.date_modified;
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different update date

        secret.set_username(encrypted_username.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Username: date_created {} must be equal to created_before_update {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Username: date_modified {} must be greater than modified_before_update {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.username(), Option::Some(&encrypted_username));

        // Update password
        let encrypted_password = vec![1, 2, 3];
        created_before_update = secret.date_created;
        modified_before_update = secret.date_modified;
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different update date

        secret.set_password(encrypted_password.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Password: date_created {} must be equal to created_before_update {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Password: date_modified {} must be greater than modified_before_update {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.password(), Option::Some(&encrypted_password));

        // Update url
        let url = String::from("my-url");
        created_before_update = secret.date_created;
        modified_before_update = secret.date_modified;
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different update date

        secret.set_url(url.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Url: date_created {} must be equal to created_before_update {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Url: date_modified {} must be greater than modified_before_update {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.url(), Option::Some(&url));

        // Updates notes
        let encrypted_notes = vec![1, 2, 3];
        created_before_update = secret.date_created;
        modified_before_update = secret.date_modified;
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different update date

        secret.set_notes(encrypted_notes.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Notes: date_created {} must be equal to created_before_update {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Notes: date_modified {} must be greater than modified_before_update {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.notes(), Option::Some(&encrypted_notes));
    }

    #[test]
    fn utest_secret_create_secret_for_update() {
        let id = "UUID::new()";

        // Check return of None
        // let secret_for_update = SecretForUpdate::new(id, None, None, None, None, None, None);
        // assert!(*secret_for_update.id() == id);
        // assert!(secret_for_update.category() == None);
        // assert!(secret_for_update.name() == None);
        // assert!(secret_for_update.username() == None);
        // assert!(secret_for_update.password() == None);
        // assert!(secret_for_update.url() == None);
        // assert!(secret_for_update.notes() == None);

        // Check return of Some
        let category = Some(SecretCategory::Note);
        let name = Some("my-super-secret-update".to_string());
        let username = Some("my-super-username-update".to_string());
        let password = Some("my-super-password-update".to_string());
        let url = Some("my-super-url-update".to_string());
        let notes = Some("&my-super-notes-update".to_string());
        // let secret_for_update = SecretForUpdate::new(
        //     id,
        //     category.clone(),
        //     name.clone(),
        //     username.clone(),
        //     password.clone(),
        //     url.clone(),
        //     notes.clone(),
        // );
        // assert!(*secret_for_update.id() == id);
        // assert!(secret_for_update.category() == category.as_ref());
        // assert!(secret_for_update.name() == name.as_ref());
        // assert!(secret_for_update.username() == username.as_ref());
        // assert!(secret_for_update.password() == password.as_ref());
        // assert!(secret_for_update.url() == url.as_ref());
        // assert!(secret_for_update.notes() == notes.as_ref());
    }

    #[test]
    fn utest_secret_create_secret_for_creation() {
        // let category = SecretCategory::Document;
        // let name = "my-super-secret".to_string();

        // // Check return of None
        // let secret_for_creation = CreateSecretArgs {
        //     decryption_material: SecretDecryptionMaterial::default(),
        // };

        // // Check return of Some
        // let category = SecretCategory::Note;
        // let name = "my-super-secret-update".to_string();
        // let encrypted_username = Some(vec![1, 2, 3]);
        // let encrypted_password = Some(vec![1, 2, 3]);
        // let url = Some("my-super-url-update".to_string());
        // let encrypted_notes = Some(vec![1, 2, 3]);

        // let secret_for_update = CreateSecretArgs {
        //     decryption_material: SecretDecryptionMaterial::default(),
        // };
    }
}
