use candid::{CandidType, Deserialize};
use serde::Serialize;

use crate::common::uuid::UUID;
use crate::utils::time;

pub type SecretID = UUID;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Copy, PartialEq, Eq)]
pub enum SecretCategory {
    Password,
    Note,
    Document,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct Secret {
    id: SecretID,
    date_created: u64,
    date_modified: u64,
    category: SecretCategory,
    name: String,
    username: Option<Vec<u8>>,
    password: Option<Vec<u8>>,
    url: Option<String>,
    notes: Option<Vec<u8>>,
}

/// The struct provided by the backend when calling "create_secret". It contains:
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct CreateSecretArgs {
    pub category: SecretCategory,
    pub name: String,
    pub username: Option<Vec<u8>>,
    pub password: Option<Vec<u8>>,
    pub url: Option<String>,
    pub notes: Option<Vec<u8>>,
    // All the information required to decrypt the secret.
    // This material will be stored in the uservault's key box
    pub decryption_material: SecretDecryptionMaterial,
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
    pub fn new(category: SecretCategory, name: String) -> Self {
        let id = UUID::new();
        let now: u64 = time::get_current_time();
        Self {
            id,
            date_created: now,
            date_modified: now,
            category,
            name,
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

    pub fn category(&self) -> &SecretCategory {
        &self.category
    }

    pub fn set_category(&mut self, category: SecretCategory) {
        self.category = category;
        self.date_modified = time::get_current_time();
    }

    pub fn name(&self) -> &String {
        &self.name
    }

    pub fn set_name(&mut self, name: String) {
        self.name = name;
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

impl From<CreateSecretArgs> for Secret {
    fn from(csa: CreateSecretArgs) -> Self {
        let mut secret: Secret = Secret::new(csa.category, csa.name);

        if csa.username.is_some() {
            secret.set_username(csa.username.unwrap());
        }
        if csa.password.is_some() {
            secret.set_password(csa.password.unwrap());
        }
        if csa.url.is_some() {
            secret.set_url(csa.url.unwrap());
        }
        if csa.notes.is_some() {
            secret.set_notes(csa.notes.unwrap());
        }
        secret
    }
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct SecretForUpdate {
    id: UUID,
    category: Option<SecretCategory>,
    name: Option<String>,
    username: Option<String>,
    password: Option<String>,
    url: Option<String>,
    notes: Option<String>,
}

impl SecretForUpdate {
    // new() only needed for unit tests in master_vault.rs!
    pub fn new(
        id: UUID,
        category: Option<SecretCategory>,
        name: Option<String>,
        username: Option<String>,
        password: Option<String>,
        url: Option<String>,
        notes: Option<String>,
    ) -> Self {
        Self {
            id,
            name,
            category,
            username,
            password,
            url,
            notes,
        }
    }

    pub fn id(&self) -> &UUID {
        &self.id
    }

    pub fn category(&self) -> Option<&SecretCategory> {
        self.category.as_ref()
    }

    pub fn name(&self) -> Option<&String> {
        self.name.as_ref()
    }

    pub fn username(&self) -> Option<&String> {
        self.username.as_ref()
    }

    pub fn password(&self) -> Option<&String> {
        self.password.as_ref()
    }

    pub fn url(&self) -> Option<&String> {
        self.url.as_ref()
    }

    pub fn notes(&self) -> Option<&String> {
        self.notes.as_ref()
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
        let secret: Secret = Secret::new(category, name.clone());

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
        assert_eq!(secret.category(), &category);
        assert_eq!(secret.name(), &name);
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

        let mut secret: Secret = Secret::new(category, name);

        // Update category
        let category_updated = SecretCategory::Note;
        let mut created_before_update = secret.date_created;
        let mut modified_before_update = secret.date_modified;
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different update date

        secret.set_category(category_updated);
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Category: date_created {} must be equal to created_before_update {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Category: date_modified {} must be greater than modified_before_update {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.category(), &category_updated);

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
        assert_eq!(secret.name(), &name_updated);

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
        let id = UUID::new();

        // Check return of None
        let secret_for_update = SecretForUpdate::new(id, None, None, None, None, None, None);
        assert!(*secret_for_update.id() == id);
        assert!(secret_for_update.category() == None);
        assert!(secret_for_update.name() == None);
        assert!(secret_for_update.username() == None);
        assert!(secret_for_update.password() == None);
        assert!(secret_for_update.url() == None);
        assert!(secret_for_update.notes() == None);

        // Check return of Some
        let category = Some(SecretCategory::Note);
        let name = Some("my-super-secret-update".to_string());
        let username = Some("my-super-username-update".to_string());
        let password = Some("my-super-password-update".to_string());
        let url = Some("my-super-url-update".to_string());
        let notes = Some("&my-super-notes-update".to_string());
        let secret_for_update = SecretForUpdate::new(
            id,
            category.clone(),
            name.clone(),
            username.clone(),
            password.clone(),
            url.clone(),
            notes.clone(),
        );
        assert!(*secret_for_update.id() == id);
        assert!(secret_for_update.category() == category.as_ref());
        assert!(secret_for_update.name() == name.as_ref());
        assert!(secret_for_update.username() == username.as_ref());
        assert!(secret_for_update.password() == password.as_ref());
        assert!(secret_for_update.url() == url.as_ref());
        assert!(secret_for_update.notes() == notes.as_ref());
    }

    #[test]
    fn utest_secret_create_secret_for_creation() {
        let category = SecretCategory::Document;
        let name = "my-super-secret".to_string();

        // Check return of None
        let secret_for_creation = CreateSecretArgs {
            category: category.clone(),
            name: name.clone(),
            username: None,
            password: None,
            url: None,
            notes: None,
            decryption_material: SecretDecryptionMaterial::default(),
        };
        assert!(secret_for_creation.category == category);
        assert!(secret_for_creation.name == name);
        assert!(secret_for_creation.username == None);
        assert!(secret_for_creation.password == None);
        assert!(secret_for_creation.url == None);
        assert!(secret_for_creation.notes == None);

        // Check return of Some
        let category = SecretCategory::Note;
        let name = "my-super-secret-update".to_string();
        let encrypted_username = Some(vec![1, 2, 3]);
        let encrypted_password = Some(vec![1, 2, 3]);
        let url = Some("my-super-url-update".to_string());
        let encrypted_notes = Some(vec![1, 2, 3]);

        let secret_for_update = CreateSecretArgs {
            category: category.clone(),
            name: name.clone(),
            username: encrypted_username.clone(),
            password: encrypted_password.clone(),
            url: url.clone(),
            notes: encrypted_notes.clone(),
            decryption_material: SecretDecryptionMaterial::default(),
        };

        assert!(secret_for_update.category == category);
        assert!(secret_for_update.name == name);
        assert!(secret_for_update.username == encrypted_username);
        assert!(secret_for_update.password == encrypted_password);
        assert!(secret_for_update.url == url);
        assert!(secret_for_update.notes == encrypted_notes);
    }
}
