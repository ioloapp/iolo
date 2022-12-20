use std::collections::HashMap;

use candid::{CandidType, Deserialize};

use super::{secret::Secret, smart_vault::UserID, user_safe::UserSafe};

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct MasterSafe {
    date_created: String,
    date_modified: String,
    pub user_safes: HashMap<UserID, UserSafe>,
}

impl MasterSafe {
    pub fn new() -> Self {
        Self {
            date_created: "now".to_string(),
            date_modified: "now".to_string(),
            user_safes: HashMap::new(),
        }
    }

    pub fn get_all_user_safes(&self) -> &HashMap<UserID, UserSafe> {
        &self.user_safes
    }

    /// Returns a mutable reference to the user safe
    pub fn get_user_safe(&mut self, user: String) -> Option<&mut UserSafe> {
        if let Some(us) = self.user_safes.get_mut(&user) {
            Some(us)
        } else {
            None
        }
    }

    pub fn open_new_user_safe(&mut self, user: UserID) -> &mut UserSafe {
        let new_user_safe = UserSafe::new(user.clone());
        self.user_safes.insert(user.clone(), new_user_safe);
        self.get_user_safe(user.clone()).unwrap()
    }

    /// Inserts a secret into a user's safe.
    /// If user safe does not exist yet, a new one will be created
    pub fn add_user_secret(&mut self, user: UserID, secret: Secret) {
        if let Some(user_safe) = self.get_user_safe(user.clone()) {
            // the user already has a safe
            user_safe.add_secret(secret);
        } else {
            // open a new user safe and insert the new secret
            self.open_new_user_safe(user.clone()).add_secret(secret);
        }
    }
}
