use candid::{CandidType, Deserialize};

use crate::common::user::UserID;
use crate::cryptography::Ciphertext;
use crate::utils::random;
use crate::utils::time;

pub type SecretID = String;

#[derive(Debug, CandidType, Deserialize, Clone, Copy, PartialEq, Eq)]
pub enum SecretCategory {
    Password,
    Note,
    Document,
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
    notes: Option<Ciphertext>
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

    pub fn update(&mut self, secret: Secret) {
        self.date_modified = time::get_current_time();
        self.category = secret.category;
        self.name = secret.name;
        self.username = secret.username;
        self.password = secret.password;
        self.url = secret.url;
        self.notes = secret.notes;
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

    pub fn set_category(&mut self, category: SecretCategory) {
        self.category = category;
        self.date_modified = time::get_current_time();
    }

    pub fn name(&self) -> &Ciphertext {
        &self.name
    }

    pub fn set_name(&mut self, name: String) {
        self.name = name;
        self.date_modified = time::get_current_time();
    }

    pub fn username(&self) -> &Option<Ciphertext> {
        &self.username
    }

    pub fn set_username(&mut self, username: String) {
        self.username = Option::Some(username);
        self.date_modified = time::get_current_time();
    }

    pub fn password(&self) -> &Option<Ciphertext> {
        &self.password
    }

    pub fn set_password(&mut self, password: String) {
        self.password = Option::Some(password);
        self.date_modified = time::get_current_time();
    }

    pub fn url(&self) -> &Option<Ciphertext> {
        &self.url
    }

    pub fn set_url(&mut self, url: String) {
        self.url = Option::Some(url);
        self.date_modified = time::get_current_time();
    }

    pub fn notes(&self) -> &Option<Ciphertext> {
        &self.notes
    }

    pub fn set_notes(&mut self, notes: String) {
        self.notes = Option::Some(notes);
        self.date_modified = time::get_current_time();
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::{common::user::User, smart_vaults::secret::SecretCategory};
    use std::thread;

    #[tokio::test]
    async fn utest_new_secret() {
        let owner: User = User::new_random_with_seed(1);
        let sc: SecretCategory = SecretCategory::Password;
        let name: String = String::from("my-first-secret");

        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different creation date
        let secret: Secret = Secret::new(owner.get_id().clone(), sc.clone(), name.clone()).await;

        assert_eq!(secret.id().len(), 36);
        assert!(
            secret.date_created() > &before,
            "date_created: {} must be greater than before: {}",
            secret.date_created(),
            &before
        );
        assert_eq!(
            secret.date_modified(),
            secret.date_created(),
            "date_created: {} must be equal to date_modified: {}",
            secret.date_created(),
            secret.date_modified()
        );
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

        let mut secret: Secret =
            Secret::new(owner.get_id().clone(), sc.clone(), name.clone()).await;

        // Update category
        let sc_updated = SecretCategory::Note;
        let mut created_before_update = secret.date_created;
        let mut modified_before_update = secret.date_modified;

        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different creation date
        secret.set_category(sc_updated.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Category: date_created: {} must be equal to created_before_update: {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Category: date_modified: {} must be greater than modified_before_update: {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.category(), &sc_updated);

        // Update name
        let name_updated = String::from("my-first-secret-updated");
        created_before_update = secret.date_created;
        modified_before_update = secret.date_modified;
        
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different creation date
        secret.set_name(name_updated.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Name: date_created: {} must be equal to created_before_update: {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Name: date_modified: {} must be greater than modified_before_update: {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.name(), &name_updated);

        // Update username
        let username = String::from("my-username");
        created_before_update = secret.date_created;
        modified_before_update = secret.date_modified;

        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different creation date
        secret.set_username(username.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Username: date_created: {} must be equal to created_before_update: {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Username: date_modified: {} must be greater than modified_before_update: {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.username(), &Option::Some(username));

        // Update password
        let password = String::from("my-password");
        created_before_update = secret.date_created;
        modified_before_update = secret.date_modified;

        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different creation date
        secret.set_password(password.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Password: date_created: {} must be equal to created_before_update: {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Password: date_modified: {} must be greater than modified_before_update: {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.password(), &Option::Some(password));

        // Update url
        let url = String::from("my-url");
        created_before_update = secret.date_created;
        modified_before_update = secret.date_modified;

        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different creation date
        secret.set_url(url.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Url: date_created: {} must be equal to created_before_update: {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Url: date_modified: {} must be greater than modified_before_update: {}",
            secret.date_modified(),
            modified_before_update
        );
        assert_eq!(secret.url(), &Option::Some(url));

        // Updates notes
        let notes = String::from("my-notes");
        created_before_update = secret.date_created;
        modified_before_update = secret.date_modified;
               
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different creation date
        secret.set_notes(notes.clone());
        assert_eq!(
            secret.date_created(),
            &created_before_update,
            "Notes: date_created: {} must be equal to created_before_update: {}",
            secret.date_created(),
            created_before_update
        );
        assert!(
            secret.date_modified() > &modified_before_update,
            "Notes: date_modified: {} must be greater than modified_before_update: {}",
            secret.date_modified(),
            modified_before_update
        );    
        assert_eq!(secret.notes(), &Option::Some(notes));
    }
}
