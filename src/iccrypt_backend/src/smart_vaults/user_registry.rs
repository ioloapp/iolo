use std::collections::BTreeMap;

use candid::{CandidType, Deserialize};

use crate::common::{
    error::SmartVaultErr,
    user::{User, UserID},
};

#[derive(Debug, CandidType, Deserialize)]
pub struct UserRegistry {
    users: BTreeMap<UserID, User>,
}

impl UserRegistry {
    pub fn new() -> Self {
        Self {
            users: BTreeMap::new(),
        }
    }

    pub fn create_new_user(&mut self, user_id: &UserID) -> Result<&User, SmartVaultErr> {
        let new_user = User::new(user_id);
        if self.users.insert(*user_id, new_user).is_some() {
            Err(SmartVaultErr::UserAlreadyExists(user_id.to_string()))
        } else {
            self.get_user(user_id)
        }
    }

    pub fn get_user(&self, user_id: &UserID) -> Result<&User, SmartVaultErr> {
        self.users
            .get(user_id)
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(user_id.to_string()))
    }

    pub fn delete_user(&mut self, user_id: &UserID) -> Result<User, SmartVaultErr> {
        self.users
            .remove(user_id)
            .ok_or_else(|| SmartVaultErr::UserDeletionFailed(user_id.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use candid::Principal;

    use crate::{
        common::{error::SmartVaultErr, user::UserID},
        smart_vaults::user_registry::UserRegistry,
    };

    #[tokio::test]
    async fn utest_user_registry() {
        // Create empty user_vault
        let principal: UserID = Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);

        let principal_2: UserID = Principal::from_slice(&[
            1, 2, 3, 4, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);

        let mut user_registry: UserRegistry = UserRegistry::new();

        assert!(user_registry.create_new_user(&principal).is_ok());
        // no duplicates
        assert_eq!(
            user_registry.create_new_user(&principal).unwrap_err(),
            SmartVaultErr::UserAlreadyExists(principal.to_string())
        );

        assert!(user_registry.get_user(&principal).is_ok());
        assert_eq!(
            user_registry.get_user(&principal_2).unwrap_err(),
            SmartVaultErr::UserDoesNotExist(principal_2.to_string())
        );
    }
}
