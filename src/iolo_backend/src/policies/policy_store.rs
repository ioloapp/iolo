use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::common::{
    memory::{get_stable_btree_memory_for_policies, Memory},
    uuid::UUID,
};

use super::policy::Policy;

#[derive(Serialize, Deserialize)]
pub struct PolicyStore {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    // users: StableBTreeMap<u128, u128, Memory>,
    pub policies: StableBTreeMap<UUID, Policy, Memory>,
}

fn init_stable_data() -> StableBTreeMap<UUID, Policy, Memory> {
    StableBTreeMap::init(get_stable_btree_memory_for_policies())
}

impl Default for PolicyStore {
    fn default() -> Self {
        Self {
            policies: init_stable_data(),
        }
    }
}

impl PolicyStore {
    pub fn new() -> Self {
        Self {
            policies: init_stable_data(),
        }
    }
}
