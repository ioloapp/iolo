use candid::{CandidType, Deserialize};

use crate::common::user::UserID;
use crate::cryptography::Ciphertext;

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
    owner: UserID,
    category: SecretCategory,
    name: Ciphertext,
    username: Option<Ciphertext>,
    password: Option<Ciphertext>,
    url: Option<Ciphertext>,
    notes: Option<Ciphertext>,
}

impl Secret {
    pub fn new(
        owner: UserID,
        category: SecretCategory,
        name: String
    ) -> Self {
        let mut id = String::from(&name);
        id.push_str(&owner.to_text());
        Self {
            id,
            owner,
            category,
            name,
            username: Option::None,
            password: Option::None,
            url: Option::None,
            notes: Option::None,
        }
    }

    pub fn id(&self) -> &str {
        &self.id
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

    pub fn set_username(&mut self, username: String) {
        self.username = Option::Some(username);
    }

    pub fn password(&self) -> &Option<Ciphertext> {
        &self.password
    }

    pub fn set_password(&mut self, password: String) {
        self.password = Option::Some(password);
    }

    pub fn url(&self) -> &Option<Ciphertext> {
        &self.url
    }

    pub fn set_url(&mut self, url: String) {
        self.url = Option::Some(url);
    }

    pub fn notes(&self) -> &Option<Ciphertext> {
        &self.notes
    }

    pub fn set_notes(&mut self, notes: String) {
        self.notes = Option::Some(notes);
    }
}

#[cfg(test)]
mod tests {

    use crate::{common::user::User, smart_vaults::secret::SecretCategory};

    use super::*;

    #[test]
    fn utest_secret_minimal() {
        let owner: User = User::new_random_with_seed(1);
        let sc: SecretCategory = SecretCategory::Password;
        let name: String = String::from("my-first-secret");

        let secret: Secret = Secret::new(
            owner.get_id().clone(),
            sc.clone(),
            name.clone()
        );

        let mut id = String::new();
        id.push_str(&name);
        id.push_str(&owner.get_id().to_string());
        assert_eq!(secret.id(), &id);
        assert_eq!(secret.owner(), &owner.get_id());
        assert_eq!(secret.category(), &sc);
        assert_eq!(secret.name(), &name);
        assert_eq!(secret.username(), &Option::None);
        assert_eq!(secret.password(), &Option::None);
        assert_eq!(secret.url(), &Option::None);
        assert_eq!(secret.notes(), &Option::None);
    }

    #[test]
    fn utest_secret_maximal() {
        let owner: User = User::new_random_with_seed(1);
        let sc: SecretCategory = SecretCategory::Password;
        let name: String = String::from("my-first-secret");

        let mut secret: Secret = Secret::new(
            owner.get_id().clone(),
            sc.clone(),
            name.clone()
        );

        let mut id = String::new();
        id.push_str(&name);
        id.push_str(&owner.get_id().to_string());
        assert_eq!(secret.id(), &id);
        assert_eq!(secret.owner(), &owner.get_id());
        assert_eq!(secret.category(), &sc);
        assert_eq!(secret.name(), &name);

        let username = String::from("my-username");
        let password = String::from("my-password");
        let url = String::from("my-url");
        let notes = String::from("my-notes");
        secret.set_username(username.clone());
        secret.set_password(password.clone());
        secret.set_url(url.clone());
        secret.set_notes(notes.clone());
        assert_eq!(secret.username(), &Option::Some(username));
        assert_eq!(secret.password(), &Option::Some(password));
        assert_eq!(secret.url(), &Option::Some(url));
        assert_eq!(secret.notes(), &Option::Some(notes));
    }
}
