use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::common::{
    error::SmartVaultErr,
    memory::{get_stable_btree_memory_for_secrets, Memory},
    user::User,
    uuid::UUID,
};

use super::secret::Secret;

#[derive(Serialize, Deserialize)]
pub struct SecretStore {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    // users: StableBTreeMap<u128, u128, Memory>,
    secrets: StableBTreeMap<UUID, Secret, Memory>,
}

fn init_stable_data() -> StableBTreeMap<UUID, Secret, Memory> {
    StableBTreeMap::init(get_stable_btree_memory_for_secrets())
}

impl Default for SecretStore {
    fn default() -> Self {
        Self {
            secrets: init_stable_data(),
        }
    }
}

impl SecretStore {
    pub fn new() -> Self {
        Self {
            secrets: init_stable_data(),
        }
    }
}
