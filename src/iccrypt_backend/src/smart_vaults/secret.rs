use candid::{CandidType, Deserialize};
use serde::Serialize;

use crate::common::uuid::UUID;
use crate::utils::time;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Copy, PartialEq, Eq)]
pub enum SecretCategory {
    Password,
    Note,
    Document,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct SecretForCreation {
    category: SecretCategory,
    name: String,
    username: Option<String>,
    password: Option<String>,
    url: Option<String>,
    notes: Option<String>,
}

impl SecretForCreation {
    pub fn new(name: String, category: SecretCategory) -> Self {
        Self {
            name,
            category,
            username: None,
            password: None,
            url: None,
            notes: None
        }
    }

    pub fn category(&self) -> &SecretCategory {
        &self.category
    }

    pub fn name(&self) -> &String {
        &self.name
    }

    pub fn username(&self) -> &Option<String> {
        &self.username
    }

    pub fn password(&self) -> &Option<String> {
        &self.password
    }

    pub fn url(&self) -> &Option<String> {
        &self.url
    }

    pub fn notes(&self) -> &Option<String> {
        &self.notes
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
    pub fn new() -> Self {
        let id = UUID::new();
        Self {
            id,
            name: None,
            category: None,
            username: None,
            password: None,
            url: None,
            notes: None
        }
    }

    pub fn id(&self) -> &UUID {
        &self.id
    }

    pub fn set_id(&mut self, id: UUID) {
        // needed for unit tests
        self.id = id;
    }

    pub fn category(&self) -> &Option<SecretCategory> {
        &self.category
    }

    pub fn name(&self) -> &Option<String> {
        &self.name
    }

    pub fn set_name(&mut self, name: String) {
        // needed for unit tests
        self.name = Some(name);
    }

    pub fn username(&self) -> &Option<String> {
        &self.username
    }

    pub fn password(&self) -> &Option<String> {
        &self.password
    }

    pub fn url(&self) -> &Option<String> {
        &self.url
    }

    pub fn notes(&self) -> &Option<String> {
        &self.notes
    }
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Secret {
    id: UUID,
    date_created: u64,
    date_modified: u64,
    category: SecretCategory,
    name: String,
    username: Option<String>,
    password: Option<String>,
    url: Option<String>,
    notes: Option<String>,
}

impl Secret {
    pub fn new(category: &SecretCategory, name: &str) -> Self {
        let id = UUID::new();
        let now: u64 = time::get_current_time();
        Self {
            id,
            date_created: now,
            date_modified: now,
            category: *category,
            name: name.to_string(),
            username: Option::None,
            password: Option::None,
            url: Option::None,
            notes: Option::None,
        }
    }

    pub fn id(&self) -> &UUID {
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

    pub fn set_category(&mut self, category: &SecretCategory) {
        self.category = *category;
        self.date_modified = time::get_current_time();
    }

    pub fn name(&self) -> &String {
        &self.name
    }

    pub fn set_name(&mut self, name: &str) {
        self.name = name.to_string();
        self.date_modified = time::get_current_time();
    }

    pub fn username(&self) -> &Option<String> {
        &self.username
    }

    pub fn set_username(&mut self, username: &str) {
        self.username = Option::Some(username.to_string());
        self.date_modified = time::get_current_time();
    }

    pub fn password(&self) -> &Option<String> {
        &self.password
    }

    pub fn set_password(&mut self, password: &str) {
        self.password = Option::Some(password.to_string());
        self.date_modified = time::get_current_time();
    }

    pub fn url(&self) -> &Option<String> {
        &self.url
    }

    pub fn set_url(&mut self, url: &str) {
        self.url = Option::Some(url.to_string());
        self.date_modified = time::get_current_time();
    }

    pub fn notes(&self) -> &Option<String> {
        &self.notes
    }

    pub fn set_notes(&mut self, notes: &str) {
        self.notes = Option::Some(notes.to_string());
        self.date_modified = time::get_current_time();
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::smart_vaults::secret::SecretCategory;
    use std::thread;

    #[test]
    fn utest_new_secret() {
        let sc: SecretCategory = SecretCategory::Password;
        let name: String = String::from("my-first-secret");

        let before = time::get_current_time();
        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different creation date
        let secret: Secret = Secret::new(&sc, &name);

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
        assert_eq!(secret.category(), &sc);
        assert_eq!(secret.name(), &name);
        assert_eq!(secret.username(), &Option::None);
        assert_eq!(secret.password(), &Option::None);
        assert_eq!(secret.url(), &Option::None);
        assert_eq!(secret.notes(), &Option::None);
    }

    #[test]
    fn utest_update_secret() {
        // Create secret
        let sc: SecretCategory = SecretCategory::Password;
        let name: String = String::from("my-first-secret");

        let mut secret: Secret = Secret::new(&sc, &name);

        // Update category
        let sc_updated = SecretCategory::Note;
        let mut created_before_update = secret.date_created;
        let mut modified_before_update = secret.date_modified;

        thread::sleep(std::time::Duration::from_millis(10)); // Sleep 10 milliseconds to ensure that secret has a different creation date
        secret.set_category(&sc_updated);
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
        secret.set_name(&name_updated);
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
        secret.set_username(&username);
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
        secret.set_password(&password);
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
        secret.set_url(&url);
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
        secret.set_notes(&notes);
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
