use std::{cell::RefCell, collections::BTreeMap};

use candid::{CandidType, Deserialize, Principal};

use crate::common::{error::SmartVaultErr,uuid::UUID};
use crate::common::user::{AddUserArgs, User};
use crate::smart_vaults::testament::TestamentListEntry;

use super::{
    secret::{AddSecretArgs, Secret},
    smart_vault::TESTAMENT_REGISTRY,
    testament::{AddTestamentArgs, Testament},
    testament_registry::TestamentRegistry,
    user_vault::UserVault,
};

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MasterVault {
    user_vaults: BTreeMap<UUID, UserVault>,
}

impl Default for MasterVault {
    fn default() -> Self {
        Self::new()
    }
}

impl MasterVault {
    pub fn new() -> Self {
        Self {
            user_vaults: BTreeMap::new(),
        }
    }

    pub fn user_vaults(&self) -> &BTreeMap<UUID, UserVault> {
        &self.user_vaults
    }

    pub fn is_user_vault_existing(&self, vault_id: &UUID) -> bool {
        self.user_vaults.contains_key(vault_id)
    }

    pub fn create_user_vault(&mut self) -> UUID {
        let new_user_vault = UserVault::new();
        let new_user_vault_id = *new_user_vault.id();
        self.user_vaults.insert(new_user_vault_id, new_user_vault);
        new_user_vault_id
    }

    pub fn get_user_vault(&self, vault_id: &UUID) -> Result<&UserVault, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        Ok(self.user_vaults.get(vault_id).unwrap())
    }

    // Delete a user_vault from the master_vault
    pub fn remove_user_vault(&mut self, id: &UUID) {
        self.user_vaults.remove(id);
    }

    pub fn add_user_secret(
        &mut self,
        vault_id: &UUID,
        asa: AddSecretArgs,
    ) -> Result<Secret, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        let secret: Secret = asa.clone().into();
        let added_secret = user_vault.add_secret(secret)?;

        let decryption_material = asa.symmetric_crypto_material.clone();
        user_vault
            .key_box_mut()
            .insert(added_secret.id().clone(), decryption_material);

        Ok(added_secret)
    }

    // Inserts a testament into a user's vault.
    pub fn add_user_testament(
        &mut self,
        vault_id: &UUID,
        ata: AddTestamentArgs, // might be required later
    ) -> Result<Testament, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let testament: Testament = Testament::from(ata);
        let testament_id = testament.id().clone();
        let heirs = testament.heirs().clone();

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.add_testament(testament.clone())?;

        // Add entry to testament registry (reverse index)
        TESTAMENT_REGISTRY.with(
            |tr: &RefCell<TestamentRegistry>| -> Result<(), SmartVaultErr> {
                let mut testament_registry = tr.borrow_mut();
                for h in heirs {
                    let tle = TestamentListEntry {
                        id: testament.id().clone(),
                        name: testament.name().clone(),
                        testator: testament.testator().clone(),
                        condition_status: testament.condition_status().clone()
                    };
                    testament_registry.add_testament_for_heir(h, tle.clone());
                }
                Ok(())
            },
        )?;

        Ok(user_vault.get_testament(&testament_id).unwrap().clone())
    }

    pub fn update_user_testament(
        &mut self,
        vault_id: &UUID,
        t: Testament,
    ) -> Result<Testament, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }
        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.update_testament(t)
    }

    pub fn update_user_secret(
        &mut self,
        vault_id: &UUID,
        s: Secret,
    ) -> Result<Secret, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.update_secret(s)
    }

    // Remove a secret
    pub fn remove_user_secret(
        &mut self,
        vault_id: &UUID,
        secret_id: &str,
    ) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.remove_secret(secret_id)
    }

    // Remove a testament
    pub fn remove_user_testament(
        &mut self,
        vault_id: &UUID,
        testament_id: &str,
    ) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.remove_testament(testament_id)
    }

    // Add a user to the address_book
    pub fn add_heir(
        &mut self,
        vault_id: &UUID,
        aua: AddUserArgs,
    ) -> Result<User, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        let user: User = aua.clone().into();
        let added_user = user_vault.add_heir(user)?;

        Ok(added_user.clone())
    }

    pub fn update_user_heir (
        &mut self,
        vault_id: &UUID,
        u: User,
    ) -> Result<User, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.update_heir(u)
    }

    pub fn remove_user_heir(
        &mut self,
        vault_id: &UUID,
        user_id: &Principal
    ) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.remove_heir(user_id)
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn utest_new_master_vault() {
        let master_vault = MasterVault::new();

        assert_eq!(
            master_vault.user_vaults.len(),
            0,
            "master_vault should have 0 user_vaults but has {}",
            master_vault.user_vaults.len()
        );
    }

    #[test]
    fn utest_create_user_vault() {
        let mut master_vault = MasterVault::new();

        // no user vault yet
        assert_eq!(master_vault.user_vaults().len(), 0);

        // Create a new empty user_vault
        let new_uv_id = master_vault.create_user_vault();

        // new user vault exists
        assert!(master_vault.get_user_vault(&new_uv_id).is_ok());

        // there is a user vault in the master vault
        assert_eq!(master_vault.user_vaults().len(), 1);

        // user vault must be empty
        assert_eq!(
            master_vault
                .get_user_vault(&new_uv_id)
                .unwrap()
                .secrets()
                .len(),
            0
        );
    }

    #[test]
    fn utest_get_user_vault() {
        let mut master_vault = MasterVault::new();

        // Create a new empty user_vault
        let new_uv_id = master_vault.create_user_vault();

        // new user vault exists
        assert!(master_vault.get_user_vault(&new_uv_id).is_ok());

        // following user vault should not exist
        assert!(master_vault.get_user_vault(&UUID::new()).is_err());
    }

    #[test]
    fn utest_remove_user_vault() {
        let mut master_vault = MasterVault::new();

        // no user vault yet
        assert_eq!(master_vault.user_vaults().len(), 0);

        // Create a new empty user_vault
        let new_uv_id = master_vault.create_user_vault();

        // new user vault exists
        assert!(master_vault.get_user_vault(&new_uv_id).is_ok());

        // there is a user vault in the master vault
        assert_eq!(master_vault.user_vaults().len(), 1);

        master_vault.remove_user_vault(&new_uv_id);

        // new user vault does not exist anymore
        assert!(master_vault.get_user_vault(&new_uv_id).is_err());

        // there is no user vault in the master vault anymore
        assert_eq!(master_vault.user_vaults().len(), 0);
    }

    #[test]
    fn utest_secrets() {
        let mut master_vault = MasterVault::new();
        let new_uv_id = master_vault.create_user_vault();

        // user vault must be empty
        assert_eq!(
            master_vault
                .get_user_vault(&new_uv_id)
                .unwrap()
                .secrets()
                .len(),
            0
        );

        // let secret_for_creation = CreateSecretArgs {
        //     decryption_material: SecretDecryptionMaterial::default(),
        // };

        // let secret = master_vault
        //     .add_user_secret(&new_uv_id, secret_for_creation)
        //     .unwrap();
        // assert_eq!(
        //     master_vault
        //         .get_user_vault(&new_uv_id)
        //         .unwrap()
        //         .secrets()
        //         .len(),
        //     1
        // );
        // let secret_name = master_vault
        //     .get_user_vault(&new_uv_id)
        //     .unwrap()
        //     .secrets()
        //     .get(secret.id())
        //     .unwrap()
        //     .name();
        // assert_eq!(
        //     secret_name,
        //     Some(String::from("my-super-secret")),
        //     "secret should have name my-super-secret but has {:?}",
        //     secret_name
        // );

        // let mut secret_to_update = SecretForUpdate::new(
        //     *secret.id(),
        //     None,
        //     Some("my-super-secret-new".to_string()),
        //     None,
        //     None,
        //     None,
        //     None,
        // );
        // master_vault.update_secret(&new_uv_id, &secret_to_update);
        // let secret_name = master_vault
        //     .get_user_vault(&new_uv_id)
        //     .unwrap()
        //     .secrets()
        //     .get(secret.id())
        //     .unwrap()
        //     .name();
        // assert_eq!(
        //     secret_name,
        //     Some("my-super-secret-new".to_string()),
        //     "secret should have name my-super-secret-new but has {:?}",
        //     secret_name
        // );

        // master_vault.remove_secret(&new_uv_id, &secret.id());
        // assert_eq!(
        //     master_vault
        //         .get_user_vault(&new_uv_id)
        //         .unwrap()
        //         .secrets()
        //         .len(),
        //     0
        // );
    }
}
