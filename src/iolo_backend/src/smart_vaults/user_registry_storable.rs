use ic_stable_structures::StableBTreeMap;
use serde::{Serialize, Deserialize};

use crate::common::{memory::{Memory, get_stable_btree_memory}, principal_id::PrincipalId, user::User};

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
