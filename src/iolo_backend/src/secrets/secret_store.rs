use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::secrets::secret::UpdateSecretArgs;
use crate::users::user::PrincipalID;
use crate::{
    common::{
        error::SmartVaultErr,
        memory::{get_stable_btree_memory_for_secrets, Memory},
    },
    secrets::secret::Secret,
};

use super::secret::SecretID;

#[derive(Serialize, Deserialize)]
pub struct SecretStore {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    pub secrets: StableBTreeMap<SecretID, Secret, Memory>,
}

fn init_stable_data() -> StableBTreeMap<SecretID, Secret, Memory> {
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

    pub fn get(&self, secret_id: &SecretID) -> Result<Secret, SmartVaultErr> {
        let s = self.secrets.get(secret_id);

        match s {
            Some(s) => Ok(s.clone()),

            None => Err(SmartVaultErr::SecretDoesNotExist(secret_id.to_string())),
        }
    }

    pub fn add_secret(&mut self, secret: Secret) -> Result<Secret, SmartVaultErr> {
        // TODO: DO WE REALLY WANT TO INSERT IF THE SECRET ALREADY EXISTS?
        let secret_id = secret.id();
        let s = self.secrets.insert(secret_id.clone(), secret.clone());
        match s {
            Some(_) => Err(SmartVaultErr::SecretAlreadyExists(secret_id.to_string())),
            None => Ok(secret),
        }
    }

    pub fn update_secret(
        &mut self,
        caller: &PrincipalID,
        usa: UpdateSecretArgs,
    ) -> Result<Secret, SmartVaultErr> {
        let sid = usa.clone().id;

        // Check if the secret exists
        let existing_secret = match self.secrets.get(&sid) {
            Some(s) => s,
            None => return Err(SmartVaultErr::SecretDoesNotExist(sid.clone())),
        };

        // Security check 1: Ensure the caller is the owner of the secret
        if &existing_secret.owner() != caller {
            return Err(SmartVaultErr::SecretDoesNotExist(sid.clone()));
        }

        // Update the secret
        let updated_secret = Secret::create_from_update_secret_args(
            existing_secret.owner(),
            *existing_secret.date_created(),
            usa,
        );
        self.secrets.insert(sid.clone(), updated_secret);

        // Return the updated secret
        Ok(self.secrets.get(&sid).unwrap().clone())
    }

    pub fn delete_secret(
        &mut self,
        caller: &PrincipalID,
        secret_id: &SecretID,
    ) -> Result<(), SmartVaultErr> {
        // Check if the secret exists
        let secret = match self.secrets.get(secret_id) {
            Some(s) => s,
            None => return Err(SmartVaultErr::SecretDoesNotExist(secret_id.to_string())),
        };

        // Check if the caller is the owner of the secret
        if &secret.owner() != caller {
            return Err(SmartVaultErr::SecretDoesNotExist(secret_id.to_string()));
        }

        // Remove the secret since the caller is the owner
        self.secrets.remove(secret_id);
        Ok(())
    }
}

#[cfg(test)]
mod tests {}
