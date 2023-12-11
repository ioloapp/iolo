use ic_stable_structures::StableBTreeMap;
use serde::{Serialize, Deserialize};

use crate::common::{memory::{Memory, get_stable_btree_memory}, principal_id::PrincipalId, user::User, error::SmartVaultErr};

#[derive(Serialize, Deserialize)]
pub struct UserRegistryStorable {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    // users: StableBTreeMap<u128, u128, Memory>,
	users: StableBTreeMap<PrincipalId, User, Memory>,
}


fn init_stable_data() -> StableBTreeMap<PrincipalId, User, Memory> {
    StableBTreeMap::init(get_stable_btree_memory())
}

impl Default for UserRegistryStorable {
    fn default() -> Self {
        Self {
            users: init_stable_data()
        }
    }
}

impl UserRegistryStorable {

    pub fn add_user(&mut self, user: User) -> Result<User, SmartVaultErr> {
		let principal_id = PrincipalId::from(*user.id());
        if self.users.insert(principal_id, user.clone()).is_some() {
            Err(SmartVaultErr::UserAlreadyExists(user.id().to_string()))
        } else {
            self.get_user(&principal_id)
        }
    }

    pub fn get_user(&self, user_id: &PrincipalId) -> Result<User, SmartVaultErr> {
        self.users
            .get(user_id)
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(user_id.to_string()))
    }
}