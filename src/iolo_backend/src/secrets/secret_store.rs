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

use super::secret;

#[derive(Serialize, Deserialize)]
pub struct SecretStore {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    // users: StableBTreeMap<u128, u128, Memory>,
    pub secrets: StableBTreeMap<UUID, Secret, Memory>,
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

    pub fn add_secret(&mut self, secret: Secret) -> Result<Secret, SmartVaultErr> {
        // TODO: DO WE REALLY WANT TO INSERT IF THE SECRET ALREADY EXISTS?
        let secret_id: UUID = secret.id().clone().into();
        let s = self
            .secrets
            .insert(secret_id.clone().into(), secret.clone());
        match s {
            Some(_) => {
                return Err(SmartVaultErr::SecretAlreadyExists(secret_id.to_string()));
            }
            None => {
                return Ok(secret);
            }
        }
    }

    pub fn update_secret(&mut self, secret: Secret) -> Result<Secret, SmartVaultErr> {
        let sid = UUID::from(secret.id().clone());
        if !self.secrets.contains_key(&sid) {
            return Err(SmartVaultErr::SecretDoesNotExist(secret.id().to_string()));
        }

        self.secrets.insert(sid.clone(), secret);
        // self.date_modified = time::get_current_time();
        Ok(self.secrets.get(&sid).unwrap().clone())
    }

    pub fn remove_secret(
        &mut self,
        _user_vault_id: &UUID,
        secret_id: &str,
    ) -> Result<(), SmartVaultErr> {
        let sid = UUID::from(secret_id);
        if !self.secrets.contains_key(&sid) {
            return Err(SmartVaultErr::SecretDoesNotExist(secret_id.to_string()));
        }

        // TODO: check if the secret is in the user vault
        self.secrets.remove(&sid);
        Ok(())
    }
}

#[cfg(test)]
mod tests {}
