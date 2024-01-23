use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::{
    common::{
        error::SmartVaultErr,
        memory::{get_stable_btree_memory_for_secrets, Memory},
        uuid::UUID,
    },
    secrets::secret::Secret,
    utils::time,
};

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
        let s = self.secrets.insert(secret_id, secret.clone());
        match s {
            Some(_) => {
                return Err(SmartVaultErr::SecretAlreadyExists(secret_id.to_string()));
            }
            None => {
                return Ok(secret);
            }
        }
    }

    pub fn update_secret(
        &mut self,
        caller: &Principal,
        secret: Secret,
    ) -> Result<Secret, SmartVaultErr> {
        let sid = UUID::from(secret.id());

        // Check if the secret exists
        let existing_secret = match self.secrets.get(&sid) {
            Some(s) => s,
            None => return Err(SmartVaultErr::SecretDoesNotExist(secret.id().to_string())),
        };

        // Security check 1: Ensure the caller is the owner of the secret
        if &existing_secret.owner() != caller {
            return Err(SmartVaultErr::OnlyOwnerCanUpdateSecret(
                secret.id().to_string(),
            ));
        }

        // Security check 2: Prevent changing the owner of the secret
        if secret.owner() != existing_secret.owner() {
            return Err(SmartVaultErr::OwnerCannotBeChanged(secret.id().to_string()));
        }

        // Update the secret
        self.secrets.insert(sid, secret);

        // Return the updated secret
        Ok(self.secrets.get(&sid).unwrap().clone())
    }

    pub fn remove_secret(
        &mut self,
        caller: &Principal,
        secret_id: &str,
    ) -> Result<(), SmartVaultErr> {
        let sid = UUID::from(secret_id);

        // Check if the secret exists
        let secret = match self.secrets.get(&sid) {
            Some(s) => s,
            None => return Err(SmartVaultErr::SecretDoesNotExist(secret_id.to_string())),
        };

        // Check if the caller is the owner of the secret
        if &secret.owner() != caller {
            return Err(SmartVaultErr::OnlyOwnerCanDeleteSecret(
                secret_id.to_string(),
            ));
        }

        // Remove the secret since the caller is the owner
        self.secrets.remove(&sid);
        Ok(())
    }
}

#[cfg(test)]
mod tests {}
