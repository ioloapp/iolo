use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::{
    common::{
        error::SmartVaultErr,
        memory::{get_stable_btree_memory_for_users, Memory},
        principal_storable::PrincipalStorable,
    },
    users::user::User,
};

#[derive(Serialize, Deserialize)]
pub struct UserStore {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    // users: StableBTreeMap<u128, u128, Memory>,
    pub users: StableBTreeMap<PrincipalStorable, User, Memory>,
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

        if self.users.contains_key(&principal_storable) {
            Err(SmartVaultErr::UserAlreadyExists(user.id().to_string()))
        } else {
            self.users.insert(principal_storable, user.clone());
            self.get_user(user.id())
        }
    }

    pub fn update_user(&mut self, user: User, caller: &Principal) -> Result<User, SmartVaultErr> {
        let principal_storable = PrincipalStorable::from(*caller);

        // Only name, email and user_type can be updated
        if let Some(mut existing_user) = self.users.remove(&principal_storable) {
            existing_user.name = user.name.clone();
            existing_user.email = user.email.clone();
            existing_user.user_type = user.user_type.clone();
            self.users.insert(principal_storable, existing_user);
            self.get_user(caller)
        } else {
            Err(SmartVaultErr::UserDoesNotExist(caller.to_string()))
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

    use crate::{
        common::error::SmartVaultErr,
        users::user::{AddUserArgs, User},
        users::user_store::UserStore,
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