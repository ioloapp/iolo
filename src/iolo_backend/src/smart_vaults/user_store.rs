use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::common::{
    error::SmartVaultErr,
    memory::{get_stable_btree_memory_for_users, Memory},
    principal_storable::PrincipalStorable,
    user::User,
};

#[derive(Serialize, Deserialize)]
pub struct UserStore {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    // users: StableBTreeMap<u128, u128, Memory>,
    users: StableBTreeMap<PrincipalStorable, User, Memory>,
}

fn init_stable_data() -> StableBTreeMap<PrincipalStorable, User, Memory> {
    StableBTreeMap::init(get_stable_btree_memory_for_users())
}

impl Default for UserStore {
    fn default() -> Self {
        Self {
            users: init_stable_data(),
        }
    }
}

impl UserStore {
    pub fn new() -> Self {
        Self {
            users: init_stable_data(),
        }
    }

    pub fn add_user(&mut self, user: User) -> Result<User, SmartVaultErr> {
        let principal_storable = PrincipalStorable::from(*user.id());
        if self
            .users
            .insert(principal_storable, user.clone())
            .is_some()
        {
            Err(SmartVaultErr::UserAlreadyExists(user.id().to_string()))
        } else {
            self.get_user(user.id())
        }
    }

    pub fn update_user(&mut self, user: User) -> Result<User, SmartVaultErr> {
        let principal_storable = PrincipalStorable::from(*user.id());
        if self
            .users
            .insert(principal_storable, user.clone())
            .is_some()
        {
            self.get_user(user.id())
        } else {
            Err(SmartVaultErr::UserDoesNotExist(user.id().to_string()))
        }
    }

    pub fn get_user(&self, user_id: &Principal) -> Result<User, SmartVaultErr> {
        self.users
            .get(&PrincipalStorable::from(user_id.clone()))
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(user_id.to_string()))
    }

    pub fn delete_user(&mut self, user_id: &Principal) -> Result<User, SmartVaultErr> {
        self.users
            .remove(&PrincipalStorable::from(user_id.clone()))
            .ok_or_else(|| SmartVaultErr::UserDeletionFailed(user_id.to_string()))
    }

    // pub fn get_user_mut(&mut self, user_id: &PrincipalStorable) -> Result<&mut User, SmartVaultErr> {
    //     self.users
    //         .get_mut(user_id)
    //         .ok_or_else(|| SmartVaultErr::UserDoesNotExist(user_id.to_string()))
    // }

    pub fn get_all_last_login_dates(&self) -> Vec<(Principal, u64)> {
        self.users
            .iter()
            .filter_map(|(principal_storable, user)| {
                if let Some(login_date) = user.date_last_login {
                    Some((Principal::from(principal_storable.clone()), login_date))
                } else {
                    None
                }
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use candid::Principal;

    use crate::common::user::AddUserArgs;
    use crate::{
        common::{error::SmartVaultErr, user::User},
        smart_vaults::user_store::UserStore,
    };

    #[tokio::test]
    async fn utest_user_store() {
        // Create empty user_vault
        let principal: Principal = Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);

        let principal_2: Principal = Principal::from_slice(&[
            1, 2, 3, 4, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);

        let args = AddUserArgs {
            id: principal.clone(),
            name: None,
            email: None,
            user_type: None,
        };
        let new_user = User::new(&principal, args);

        let mut user_store: UserStore = UserStore::new();

        assert!(user_store.add_user(new_user.clone()).is_ok());
        // no duplicates
        assert_eq!(
            user_store.add_user(new_user.clone()).unwrap_err(),
            SmartVaultErr::UserAlreadyExists(principal.to_string())
        );

        assert!(user_store.get_user(&principal).is_ok());
        assert_eq!(
            user_store.get_user(&principal_2).unwrap_err(),
            SmartVaultErr::UserDoesNotExist(principal_2.to_string())
        );
    }
}