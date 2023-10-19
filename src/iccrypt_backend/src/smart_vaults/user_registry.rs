use std::collections::BTreeMap;

use candid::{CandidType, Deserialize, Principal};

use crate::common::{error::SmartVaultErr, user::User};

#[derive(Debug, CandidType, Deserialize)]
pub struct UserRegistry {
    users: BTreeMap<Principal, User>,
}

impl Default for UserRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl UserRegistry {
    pub fn new() -> Self {
        Self {
            users: BTreeMap::new(),
        }
    }

    pub fn add_user(&mut self, user: User) -> Result<&User, SmartVaultErr> {
        if self.users.insert(*user.id(), user.clone()).is_some() {
            Err(SmartVaultErr::UserAlreadyExists(user.id().to_string()))
        } else {
            self.get_user(user.id())
        }
    }

    pub fn get_user(&self, user_id: &Principal) -> Result<&User, SmartVaultErr> {
        self.users
            .get(user_id)
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(user_id.to_string()))
    }

    pub fn delete_user(&mut self, user_id: &Principal) -> Result<User, SmartVaultErr> {
        self.users
            .remove(user_id)
            .ok_or_else(|| SmartVaultErr::UserDeletionFailed(user_id.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use candid::Principal;

    use crate::{
        common::{error::SmartVaultErr, user::User},
        smart_vaults::user_registry::UserRegistry,
    };

    #[tokio::test]
    async fn utest_user_registry() {
        // Create empty user_vault
        let principal: Principal = Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);

        let principal_2: Principal = Principal::from_slice(&[
            1, 2, 3, 4, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);

        let new_user = User::new(&principal);

        let mut user_registry: UserRegistry = UserRegistry::new();

        assert!(user_registry.add_user(new_user.clone()).is_ok());
        // no duplicates
        assert_eq!(
            user_registry.add_user(new_user.clone()).unwrap_err(),
            SmartVaultErr::UserAlreadyExists(principal.to_string())
        );

        assert!(user_registry.get_user(&principal).is_ok());
        assert_eq!(
            user_registry.get_user(&principal_2).unwrap_err(),
            SmartVaultErr::UserDoesNotExist(principal_2.to_string())
        );
    }
}
