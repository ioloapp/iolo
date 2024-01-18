use std::cell::RefCell;

use candid::{types::principal, Principal};

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    secrets::secret::SecretSymmetricCryptoMaterial,
    smart_vaults::smart_vault::{get_vault_id_for, SECRET_STORE, USER_VAULT_STORE},
    user_vaults::user_vault_store::UserVaultStore,
};

use super::{
    secret::{AddSecretArgs, Secret, SecretID},
    secret_store::SecretStore,
};

/*
 * This is the implementation of the add_secret candid method exposed by the iolo backend.
 * It adds a secret to the user vault by doing the following:
 *
 * 1. Generate a new UUID for the secret
 * 2. Generate the secret and produce the decryption material
 * 3. Add the secret to the secret store
 * 4. Add the secret id to the user vault's secret id list
 */
pub async fn add_secret_impl(
    mut args: AddSecretArgs,
    caller: &Principal,
) -> Result<Secret, SmartVaultErr> {
    let user_vault_id: UUID = get_vault_id_for(caller.clone())?;

    // new: we generate a new UUID for the secret and overwrite it
    args.id = UUID::new_random().await.into();

    // we generate the secret and produce the decryption material
    let secret: Secret = args.clone().into();
    let decryption_material: SecretSymmetricCryptoMaterial = args.symmetric_crypto_material.clone();

    // Add the secret to the secret store (secrets: StableBTreeMap<UUID, Secret, Memory>,)
    SECRET_STORE.with(
        |secret_store_rc: &RefCell<SecretStore>| -> Result<Secret, SmartVaultErr> {
            let mut secret_store = secret_store_rc.borrow_mut();
            secret_store.add_secret(secret.clone())
        },
    )?;

    // add the secret id to the user vault
    USER_VAULT_STORE.with(
        |ms: &RefCell<UserVaultStore>| -> Result<UUID, SmartVaultErr> {
            let mut user_vault_store = ms.borrow_mut();
            user_vault_store.add_user_secret_by_id(
                &user_vault_id,
                &secret.id().clone().into(),
                decryption_material,
            )
        },
    )?;
    Ok(secret)
}

pub fn get_secret_impl(sid: SecretID, principal: &Principal) -> Result<Secret, SmartVaultErr> {
    let _user_vault_id: UUID = get_vault_id_for(principal.clone())?;

    SECRET_STORE.with(|x| {
        let secret_store = x.borrow();
        let secret = secret_store.get(&UUID::from(sid.clone()));
        // TODO: check if the secret is in the user vault
        secret
    })
}

pub fn update_secret_impl(s: Secret, principal: &Principal) -> Result<Secret, SmartVaultErr> {
    let _user_vault_id: UUID = get_vault_id_for(principal.clone())?;

    SECRET_STORE.with(|x| {
        let mut secret_store = x.borrow_mut();
        // TODO: check if the secret is in the user vault
        secret_store.update_secret(s)
    })
}

pub fn remove_secret_impl(secret_id: String, principal: &Principal) -> Result<(), SmartVaultErr> {
    let user_vault_id: UUID = get_vault_id_for(principal.clone())?;

    SECRET_STORE.with(
        |secret_store_rc: &RefCell<SecretStore>| -> Result<(), SmartVaultErr> {
            let mut secret_store = secret_store_rc.borrow_mut();
            secret_store.remove_secret(&user_vault_id, &secret_id)
        },
    )
}

#[cfg(test)]
mod tests {

    use candid::Principal;

    use crate::{
        common::{error::SmartVaultErr, uuid::UUID},
        secrets::{
            secret::{AddSecretArgs, SecretSymmetricCryptoMaterial},
            secrets_interface_impl::{
                add_secret_impl, get_secret_impl, remove_secret_impl, update_secret_impl,
            },
        },
        smart_vaults::smart_vault::USER_VAULT_STORE,
        smart_vaults::smart_vault::{get_vault_id_for, SECRET_STORE},
        users::{user::AddUserArgs, users_interface_impl::create_user_impl},
    };

    #[tokio::test]
    async fn itest_secret_lifecycle() {
        // Create empty user_vault
        let principal = create_principal();

        // Create User and store it
        let aua: AddUserArgs = AddUserArgs {
            id: principal,
            name: Some("donald".to_string()),
            email: None,
            user_type: None,
        };
        let _new_user = create_user_impl(aua, &principal).await.unwrap();

        // Create Mock Secret
        let sscm: SecretSymmetricCryptoMaterial = SecretSymmetricCryptoMaterial {
            encrypted_symmetric_key: vec![1, 2, 3],
            iv: vec![1, 2, 3],
            username_decryption_nonce: Some(vec![1, 2, 3]),
            password_decryption_nonce: Some(vec![1, 2, 3]),
            notes_decryption_nonce: Some(vec![1, 2, 3]),
        };
        let asa: AddSecretArgs = AddSecretArgs {
            id: "".to_string(),
            category: None,
            name: Some("Google".to_string()),
            username: Some(vec![1, 2, 3]),
            password: Some(vec![1, 2, 3]),
            url: None,
            notes: Some(vec![1, 2, 3]),
            symmetric_crypto_material: sscm,
        };

        // Add Secret
        let added_secret = add_secret_impl(asa.clone(), &principal).await.unwrap();
        assert_eq!(added_secret.name(), asa.name);
        assert_eq!(added_secret.username().cloned(), asa.username);
        assert_eq!(added_secret.password().cloned(), asa.password);

        // Check if the right secret is in secret store
        SECRET_STORE.with(|ss| {
            let secret_store = ss.borrow();
            let secret = secret_store
                .get(&UUID::from(added_secret.id().clone()))
                .unwrap();
            assert_eq!(secret.id(), added_secret.id());
            assert_eq!(secret.name(), added_secret.name());
            assert_eq!(secret.username().cloned(), added_secret.username().cloned());
            assert_eq!(secret.password().cloned(), added_secret.password().cloned());
        });

        // check if the secret is in the users user vault
        let user_vault_id = get_vault_id_for(principal.clone()).unwrap();
        USER_VAULT_STORE.with(|user_vault_store_ref| {
            let user_vault_store = user_vault_store_ref.borrow();
            let user_vault = user_vault_store.get_user_vault(&user_vault_id).unwrap();
            assert_eq!(user_vault.secret_ids.len(), 1);
            assert_eq!(user_vault.secret_ids[0], added_secret.id().clone().into());
        });

        // get secret from proper interface implementation
        let fetched_secret_res = get_secret_impl(added_secret.id().clone(), &principal);
        assert!(fetched_secret_res.is_ok());
        let mut fetched_secret = fetched_secret_res.unwrap();

        assert_eq!(added_secret.id(), fetched_secret.id());
        assert_eq!(added_secret.name(), fetched_secret.name());
        assert_eq!(added_secret.username(), fetched_secret.username());
        assert_eq!(added_secret.password(), fetched_secret.password());

        // update secret
        fetched_secret.set_name("iolo".to_string());
        let updated_secret = update_secret_impl(fetched_secret, &principal).unwrap();
        assert_eq!(updated_secret.name(), Some("iolo".to_string()));

        // delete secret
        let deleted_secret = remove_secret_impl(updated_secret.id().to_string(), &principal);
        assert!(deleted_secret.is_ok());
        let test_fetch = get_secret_impl(added_secret.id().clone(), &principal);
        assert!(test_fetch.is_err());
        assert_eq!(
            test_fetch.unwrap_err(),
            SmartVaultErr::SecretDoesNotExist(updated_secret.id().to_string())
        );
    }

    fn create_principal() -> Principal {
        Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ])
    }
}
