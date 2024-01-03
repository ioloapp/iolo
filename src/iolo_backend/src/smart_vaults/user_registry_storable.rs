use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::common::{
    error::SmartVaultErr,
    memory::{get_stable_btree_memory, Memory},
    principal_storable::PrincipalStorable,
    user::User,
};

#[derive(Serialize, Deserialize)]
pub struct UserRegistryStorable {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    // users: StableBTreeMap<u128, u128, Memory>,
    users: StableBTreeMap<PrincipalStorable, User, Memory>,
}

fn init_stable_data() -> StableBTreeMap<PrincipalStorable, User, Memory> {
    StableBTreeMap::init(get_stable_btree_memory())
}

impl Default for UserRegistryStorable {
    fn default() -> Self {
        Self {
            users: init_stable_data(),
        }
    }
}

impl UserRegistryStorable {
    pub fn add_user(&mut self, user: User) -> Result<User, SmartVaultErr> {
        let principal_storable = PrincipalStorable::from(*user.id());
        if self
            .users
            .insert(principal_storable, user.clone())
            .is_some()
        {
            Err(SmartVaultErr::UserAlreadyExists(user.id().to_string()))
        } else {
            self.get_user(&principal_storable)
        }
    }

    pub fn get_user(&self, user_id: &PrincipalStorable) -> Result<User, SmartVaultErr> {
        self.users
            .get(user_id)
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(user_id.to_string()))
    }
}
