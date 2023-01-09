use candid::{CandidType, Deserialize};

use crate::users::user::UserID;

pub type SecretID = String;

#[derive(Debug, CandidType, Deserialize, Clone, Copy, PartialEq)]
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
    name: String,
    username: String,
    password: String,
    url: String,
}

impl Secret {
    pub fn new(
        owner: UserID,
        category: SecretCategory,
        name: String,
        username: String,
        password: String,
        url: String,
    ) -> Self {
        let mut id = String::from(&name);
        id.push_str(&username);
        id.push_str(&url);
        Self {
            owner,
            id,
            category,
            name,
            username,
            password,
            url,
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

    pub fn username(&self) -> &str {
        &self.username
    }
}

#[cfg(test)]
mod tests {

    use crate::{smart_vaults::secret::SecretCategory, users::user::User};

    use super::*;

    #[test]
    fn utest_secret() {
        let user: User = User::new_random_with_seed(1);
        let sc: SecretCategory = SecretCategory::Password;
        let username: String = String::from("my_username");
        let pwd: String = String::from("my_password");

        let secret: Secret = Secret::new(
            user.get_id(),
            sc,
            "My First PWD".to_string(),
            username.clone(),
            pwd,
            "www.url.com".to_string(),
        );

        assert_eq!(secret.category(), &sc);
        assert_eq!(secret.username(), &username);
    }
}
