use std::{cell::RefCell, collections::BTreeMap};

use candid::{CandidType, Deserialize, Principal};

use crate::common::{error::SmartVaultErr, uuid::UUID};
use crate::policies::conditions::Condition;
use crate::policies::policy::{AddPolicyArgs, Policy, PolicyID};
use crate::policies::policy_registries::{
    PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE,
    PolicyRegistryForValidators_DO_NOT_USE_ANYMORE,
};
use crate::secrets::secret::SecretSymmetricCryptoMaterial;
use crate::smart_vaults::smart_vault::{
    POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE,
    POLICY_REGISTRY_FOR_VALIDATORS_DO_NOT_USE_ANYMORE,
};
use crate::user_vaults::user_vault::UserVault;
use crate::users::user::{AddUserArgs, User};

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserVaultStore_DO_NOT_USE_ANYMORE {
    pub user_vaults: BTreeMap<UUID, UserVault>,
}

impl Default for UserVaultStore_DO_NOT_USE_ANYMORE {
    fn default() -> Self {
        Self::new()
    }
}

impl UserVaultStore_DO_NOT_USE_ANYMORE {
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

    pub async fn create_and_add_user_vault(&mut self) -> UUID {
        let new_user_vault = UserVault::new().await;
        let new_user_vault_id = *new_user_vault.id();
        self.user_vaults.insert(new_user_vault_id, new_user_vault);
        new_user_vault_id
    }

    pub fn add_user_vault(&mut self, new_user_vault: UserVault) -> UUID {
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

    // Delete a user_vault from the user vault store
    pub fn remove_user_vault(&mut self, id: &UUID) {
        self.user_vaults.remove(id);
    }

    pub fn add_user_secret(
        &mut self,
        vault_id: &UUID,
        secret_id: &UUID,
        decryption_material: SecretSymmetricCryptoMaterial,
    ) -> Result<UUID, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.add_secret_id(*secret_id)?;

        user_vault
            .key_box_mut()
            .insert(secret_id.clone(), decryption_material);

        Ok(secret_id.to_owned())
    }

    // Inserts a policy into a user's vault.
    pub fn add_user_policy(
        &mut self,
        vault_id: &UUID,
        ata: AddPolicyArgs, // might be required later
    ) -> Result<Policy, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        // TODO: complete user vautl store will be deleted

        let p = Principal::from_slice(&[0; 29]);

        let policy: Policy = Policy::from_add_policy_args("not needed anymore", &p, ata);
        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.add_policy(policy.clone())?;

        // Add entry to policy registry for beneficiaries (reverse index)
        POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE.with(
            |tr: &RefCell<PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE>| -> Result<(), SmartVaultErr> {
                let mut policy_registry = tr.borrow_mut();
                policy_registry.add_policy_to_registry(&policy);
                Ok(())
            },
        )?;

        // Add entry to policy registry for validators (reverse index) if there is a XOutOfYCondition
        for condition in policy.conditions().iter() {
            match condition {
                Condition::XOutOfYCondition(xoutofy) => {
                    POLICY_REGISTRY_FOR_VALIDATORS_DO_NOT_USE_ANYMORE.with(
                        |pr: &RefCell<PolicyRegistryForValidators_DO_NOT_USE_ANYMORE>| -> Result<(), SmartVaultErr> {
                            let mut policy_registry = pr.borrow_mut();
                            policy_registry.add_policy_to_registry(
                                &xoutofy.validators,
                                &policy.id(),
                                &policy.owner(),
                            );
                            Ok(())
                        },
                    )?;
                }
                _ => {}
            }
        }

        Ok(user_vault.get_policy(policy.id()).unwrap().clone())
    }

    pub fn update_user_policy(
        &mut self,
        vault_id: &UUID,
        t: Policy,
    ) -> Result<Policy, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }
        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();

        // Update policy registry for beneficiaries
        let t_old = user_vault.get_policy(t.id())?;
        POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE.with(
            |tr: &RefCell<PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE>| -> Result<(), SmartVaultErr> {
                let mut policy_registry = tr.borrow_mut();
                policy_registry.update_policy_in_registry(&t, t_old);
                Ok(())
            },
        )?;

        // Update policy registry for beneficiaries
        POLICY_REGISTRY_FOR_VALIDATORS_DO_NOT_USE_ANYMORE.with(
            |tr: &RefCell<PolicyRegistryForValidators_DO_NOT_USE_ANYMORE>| -> Result<(), SmartVaultErr> {
                let mut policy_registry = tr.borrow_mut();
                policy_registry.update_policy_in_registry(&t, t_old);
                Ok(())
            },
        )?;

        // Update real policy
        user_vault.update_policy(t)
    }

    pub fn get_user_policy_list_mut(
        &mut self,
        vault_id: &UUID,
    ) -> Result<Vec<&mut Policy>, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }
        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();

        Ok(user_vault.policies_mut().values_mut().collect())
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

    // Remove a policy
    pub fn remove_user_policies(
        &mut self,
        vault_id: &UUID,
        policy_id: &PolicyID,
    ) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        let policy = user_vault.get_policy(policy_id)?;
        POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE.with(
            |pr: &RefCell<PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE>| -> Result<(), SmartVaultErr> {
                let mut policy_registry = pr.borrow_mut();
                policy_registry.remove_policy_from_registry(policy);
                Ok(())
            },
        )?;
        user_vault.remove_policy(policy_id)
    }

    // Add a user to the address_book
    pub fn add_contact(
        &mut self,
        vault_id: &UUID,
        aua: AddUserArgs,
    ) -> Result<User, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        let user: User = aua.clone().into();
        let added_user = user_vault.add_contact(user)?;

        Ok(added_user.clone())
    }

    pub fn update_user_contact(
        &mut self,
        vault_id: &UUID,
        u: User,
    ) -> Result<User, SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.update_contact(u)
    }

    pub fn remove_user_contact(
        &mut self,
        vault_id: &UUID,
        user_id: &Principal,
    ) -> Result<(), SmartVaultErr> {
        if !self.user_vaults.contains_key(vault_id) {
            return Err(SmartVaultErr::UserVaultDoesNotExist(vault_id.to_string()));
        }

        let user_vault = self.user_vaults.get_mut(vault_id).unwrap();
        user_vault.remove_contact(user_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn utest_new_user_vault_store() {
        let user_vault_store = UserVaultStore_DO_NOT_USE_ANYMORE::new();

        assert_eq!(
            user_vault_store.user_vaults.len(),
            0,
            "user vault store should have 0 user_vaults but has {}",
            user_vault_store.user_vaults.len()
        );
    }

    #[tokio::test]
    async fn utest_create_user_vault() {
        let mut user_vault_store = UserVaultStore_DO_NOT_USE_ANYMORE::new();

        // no user vault yet
        assert_eq!(user_vault_store.user_vaults().len(), 0);

        // Create a new empty user_vault
        let new_uv_id = user_vault_store.create_and_add_user_vault().await;

        // new user vault exists
        assert!(user_vault_store.get_user_vault(&new_uv_id).is_ok());

        // there is a user vault in the user vault store
        assert_eq!(user_vault_store.user_vaults().len(), 1);

        // user vault must be empty
        assert_eq!(
            user_vault_store
                .get_user_vault(&new_uv_id)
                .unwrap()
                .secrets()
                .len(),
            0
        );
    }

    #[tokio::test]
    async fn utest_get_user_vault() {
        let mut user_vault_store = UserVaultStore_DO_NOT_USE_ANYMORE::new();

        // Create a new empty user_vault
        let new_uv_id = user_vault_store.create_and_add_user_vault().await;

        // new user vault exists
        assert!(user_vault_store.get_user_vault(&new_uv_id).is_ok());

        // following user vault should not exist
        assert!(user_vault_store.get_user_vault(&UUID::new()).is_err());
    }

    #[tokio::test]
    async fn utest_remove_user_vault() {
        let mut user_vault_store = UserVaultStore_DO_NOT_USE_ANYMORE::new();

        // no user vault yet
        assert_eq!(user_vault_store.user_vaults().len(), 0);

        // Create a new empty user_vault
        let new_uv_id = user_vault_store.create_and_add_user_vault().await;

        // new user vault exists
        assert!(user_vault_store.get_user_vault(&new_uv_id).is_ok());

        // there is a user vault in the user vault store
        assert_eq!(user_vault_store.user_vaults().len(), 1);

        user_vault_store.remove_user_vault(&new_uv_id);

        // new user vault does not exist anymore
        assert!(user_vault_store.get_user_vault(&new_uv_id).is_err());

        // there is no user vault in the user vault store anymore
        assert_eq!(user_vault_store.user_vaults().len(), 0);
    }

    #[tokio::test]
    async fn utest_user_vault_store() {
        let mut user_vault_store = UserVaultStore_DO_NOT_USE_ANYMORE::new();
        let new_uv_id = user_vault_store.create_and_add_user_vault().await;

        // user vault must be empty
        assert_eq!(
            user_vault_store
                .get_user_vault(&new_uv_id)
                .unwrap()
                .secrets()
                .len(),
            0
        );

        // let secret_for_creation = CreateSecretArgs {
        //     decryption_material: SecretDecryptionMaterial::default(),
        // };

        // let secret = user_vault_store
        //     .add_user_secret(&new_uv_id, secret_for_creation)
        //     .unwrap();
        // assert_eq!(
        //     user_vault_store
        //         .get_user_vault(&new_uv_id)
        //         .unwrap()
        //         .secrets()
        //         .len(),
        //     1
        // );
        // let secret_name = user_vault_store
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
        // user_vault_store.update_secret(&new_uv_id, &secret_to_update);
        // let secret_name = user_vault_store
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

        // user_vault_store.remove_secret(&new_uv_id, &secret.id());
        // assert_eq!(
        //     user_vault_store
        //         .get_user_vault(&new_uv_id)
        //         .unwrap()
        //         .secrets()
        //         .len(),
        //     0
        // );
    }
}
