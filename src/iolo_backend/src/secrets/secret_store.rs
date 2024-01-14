use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::{
    common::{
        error::SmartVaultErr,
        memory::{get_stable_btree_memory_for_secrets, Memory},
        uuid::UUID,
    },
    secrets::secret::Secret,
};

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

    pub fn get(&self, secret_id: &UUID) -> Result<Secret, SmartVaultErr> {
        let s = self.secrets.get(secret_id);

        match s {
            Some(s) => {
                return Ok(s.clone());
            }
            None => {
                return Err(SmartVaultErr::SecretDoesNotExist(secret_id.to_string()));
            }
        }
    }

    pub fn add(&mut self, secret: Secret) -> Result<Secret, SmartVaultErr> {
        // TODO: DO WE REALLY WANT TO INSERT IF THE SECRET ALREADY EXISTS?
        let secret_id = secret.id.clone();
        let s = self
            .secrets
            .insert(secret_id.clone().into(), secret.clone());
        match s {
            Some(_) => {
                return Err(SmartVaultErr::SecretAlreadyExists(secret_id));
            }
            None => {
                return Ok(secret);
            }
        }
    }
}

#[cfg(test)]
mod tests {}
