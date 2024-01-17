use std::cell::RefCell;

use candid::Principal;

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    secrets::secret::SecretSymmetricCryptoMaterial,
    smart_vaults::smart_vault::{get_vault_id_for, SECRET_STORE, USER_VAULT_STORE},
    user_vaults::user_vault_store::UserVaultStore,
};

use super::{
    secret::{AddSecretArgs, Secret},
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
            secret_store.add(secret.clone())
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

    // the old way
    // USER_VAULT_STORE.with(
    //     |ms: &RefCell<UserVaultStore>| -> Result<Secret, SmartVaultErr> {
    //         let mut user_vault_store = ms.borrow_mut();
    //         user_vault_store.add_user_secret(&user_vault_id, args)
    //     },
    // )
    Ok(secret)
}

#[cfg(test)]
mod tests {

    use candid::Principal;

    use crate::{
        common::uuid::UUID,
        secrets::{
            ii_secrets::add_secret_impl,
            secret::{AddSecretArgs, SecretSymmetricCryptoMaterial},
        },
        smart_vaults::smart_vault::USER_VAULT_STORE,
        smart_vaults::smart_vault::{get_vault_id_for, SECRET_STORE},
        users::{ii_users::create_user_impl, user::AddUserArgs},
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

        // dump_user_store();
        // dump_user_vault_store();
        // dump_secret_store();
    }

    fn create_principal() -> Principal {
        Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ])
    }
}
