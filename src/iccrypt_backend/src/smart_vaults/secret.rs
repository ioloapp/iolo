use candid::{CandidType, Deserialize};

use crate::common::user::UserID;
use crate::cryptography::Ciphertext;
use crate::utils::random;
use crate::utils::time;

pub type SecretID = String;

#[derive(Debug, CandidType, Deserialize, Clone, Copy, PartialEq, Eq)]
pub enum SecretCategory {
    Password,
    Wallet,
    Note,
}

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct Secret {
    id: SecretID,
    date_created: u64,
    date_modified: u64,
    owner: UserID,
    category: SecretCategory,
    name: Ciphertext,
    username: Option<Ciphertext>,
    password: Option<Ciphertext>,
    url: Option<Ciphertext>,
    notes: Option<Ciphertext>,
}

impl Secret {
    pub async fn new(owner: UserID, category: SecretCategory, name: String) -> Self {
        
        let id = random::get_new_uuid().await;
        let now: u64 = time::get_current_time();
        Self {
            id,
            date_created: now,
            date_modified: now,
            owner,
            category,
            name,
            username: Option::None,
            password: Option::None,
            url: Option::None,
            notes: Option::None,
        }
    }

    pub fn update(&mut self, category: Option<SecretCategory>, name: Option<String>, username: Option<String>, password: Option<String>, url: Option<String>, notes: Option<String>) {
        let mut is_updated: bool = false;

        if category.is_some() {
            self.category = category.unwrap();
            is_updated = true;
        }

        if name.is_some() {
            self.name = name.unwrap();
            is_updated = true;
        }
                
        if username.is_some() {
            self.username = username;
            is_updated = true;
        }

        if password.is_some() {
            self.password = password;
            is_updated = true;
        }

        if url.is_some() {
            self.url = url;
            is_updated = true;
        }

        if notes.is_some() {
            self.notes = notes;
            is_updated = true;
        }

        if is_updated {
            self.date_modified = time::get_current_time();
        }

    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn date_created(&self) -> &u64 {
        &self.date_created
    }

    pub fn date_modified(&self) -> &u64 {
        &self.date_modified
    }

    pub fn owner(&self) -> &UserID {
        &self.owner
    }

    pub fn category(&self) -> &SecretCategory {
        &self.category
    }

    pub fn name(&self) -> &Ciphertext {
        &self.name
    }

    pub fn username(&self) -> &Option<Ciphertext> {
        &self.username
    }

    pub fn password(&self) -> &Option<Ciphertext> {
        &self.password
    }

    pub fn url(&self) -> &Option<Ciphertext> {
        &self.url
    }

    pub fn notes(&self) -> &Option<Ciphertext> {
        &self.notes
    }
}

#[cfg(test)]
mod tests {

    use crate::{common::user::User, smart_vaults::secret::SecretCategory};
    use std::{thread};
    use super::*;

    #[tokio::test]
    async fn utest_new_secret_minimal() {
        let owner: User = User::new_random_with_seed(1);
        let sc: SecretCategory = SecretCategory::Password;
        let name: String = String::from("my-first-secret");

        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(100)); // Sleep 100 milliseconds to ensure that secret has a different creation date
        let secret: Secret = Secret::new(owner.get_id().clone(), sc.clone(), name.clone()).await;

        assert_eq!(secret.id().len(), 36);
        assert!(secret.date_created() > &before, "date_created: {} must be greater than before: {}", secret.date_created(), &before);
        assert_eq!(secret.date_modified(), secret.date_created(), "date_created: {} must be equal to date_modified: {}", secret.date_created(), secret.date_modified());
        assert_eq!(secret.owner(), &owner.get_id());
        assert_eq!(secret.category(), &sc);
        assert_eq!(secret.name(), &name);
        assert_eq!(secret.username(), &Option::None);
        assert_eq!(secret.password(), &Option::None);
        assert_eq!(secret.url(), &Option::None);
        assert_eq!(secret.notes(), &Option::None);
    }

    #[tokio::test]
    async fn utest_update_secret() {

        // Create secret
        let owner: User = User::new_random_with_seed(1);
        let sc: SecretCategory = SecretCategory::Password;
        let name: String = String::from("my-first-secret");
        
        let mut secret: Secret = Secret::new(owner.get_id().clone(), sc.clone(), name.clone()).await;

        // Update optional fields username, password, url and notes
        let username = String::from("my-username");
        let password = String::from("my-password");
        let url = String::from("my-url");
        let notes = String::from("my-notes");
        let created_before_update = secret.date_created;
        let mut modified_before_update = secret.date_modified;

        secret.update(Option::None, Option::None, Option::Some(username.clone()), Option::Some(password.clone()), Option::Some(url.clone()), Option::Some(notes.clone()));
        
        assert!(secret.date_created() < secret.date_modified(), "date_modified: {} must be greater than date_created: {}", secret.date_modified(), secret.date_created());
        assert_eq!(secret.date_created(), &created_before_update, "date_created: {} must be equal to created_before_update: {}", secret.date_created(), created_before_update);
        assert!(secret.date_modified() > &modified_before_update, "date_modified: {} must be greater than modified_before_update: {}", secret.date_modified(), modified_before_update);
        assert_eq!(secret.username(), &Option::Some(username));
        assert_eq!(secret.password(), &Option::Some(password));
        assert_eq!(secret.url(), &Option::Some(url));
        assert_eq!(secret.notes(), &Option::Some(notes));

        // Update mandatory fields name and category
        let sc_updated = SecretCategory::Note;
        let name_updated = String::from("my-first-secret-updated");
        modified_before_update = secret.date_modified;

        secret.update(Option::Some(sc_updated.clone()), Option::Some(name_updated.clone()), Option::None,Option::None,Option::None,Option::None);
        
        assert!(secret.date_modified() > &modified_before_update, "date_modified: {} must be greater than modified_before_update: {}", secret.date_modified(), modified_before_update);
        assert_eq!(secret.category(), &sc_updated);
        assert_eq!(secret.name(), &name_updated);
    }

   
}
