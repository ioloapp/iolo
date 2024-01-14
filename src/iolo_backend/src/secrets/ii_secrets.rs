use std::cell::RefCell;

use candid::Principal;

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    smart_vaults::smart_vault::{get_vault_id_for, SECRET_STORE, USER_VAULT_STORE},
    user_vaults::user_vault_store::UserVaultStore,
};

use super::{
    secret::{AddSecretArgs, Secret},
    secret_store::SecretStore,
};

pub async fn add_secret_impl(
    mut args: AddSecretArgs,
    caller: &Principal,
) -> Result<Secret, SmartVaultErr> {
    let user_vault_id: UUID = get_vault_id_for(caller.clone())?;

    // new: we generate a new UUID for the secret and overwrite it
    args.id = UUID::new_random().await.into();
    let secret: Secret = args.clone().into();

    // we add the secret to the secret store
    let test = SECRET_STORE.with(
        |secret_store_rc: &RefCell<SecretStore>| -> Result<Secret, SmartVaultErr> {
            let mut secret_store = secret_store_rc.borrow_mut();
            secret_store.add(secret)
        },
    );

    // TODO: user_vault_store::add_user_secret_id() must be newly implemented

    USER_VAULT_STORE.with(
        |ms: &RefCell<UserVaultStore>| -> Result<Secret, SmartVaultErr> {
            let mut user_vault_store = ms.borrow_mut();
            user_vault_store.add_user_secret(&user_vault_id, args)
        },
    )
}

#[cfg(test)]
mod tests {
    use std::cell::RefCell;

    use candid::Principal;

    use crate::{
        common::uuid::UUID,
        secrets::{
            ii_secrets::add_secret_impl,
            secret::{AddSecretArgs, SecretSymmetricCryptoMaterial},
        },
        smart_vaults::smart_vault::{get_user, SECRET_STORE, USER_STORE, USER_VAULT_STORE},
        user_vaults::user_vault_store::UserVaultStore,
        users::{ii_users::create_user_impl, user::AddUserArgs, user_store::UserStore},
    };

    #[tokio::test]
    async fn sv_test_secret_lifecycle() {
        // Create empty user_vault
        let principal = create_principal();

        // Create User and store it
        let aua: AddUserArgs = AddUserArgs {
            id: principal,
            name: Some("donald".to_string()),
            email: None,
            user_type: None,
        };
        let created_user = create_user_impl(aua, &principal).unwrap();
        let fetched_user = get_user(&principal).unwrap();
        assert_eq!(&created_user.id(), &fetched_user.id());
        assert_eq!(&created_user.email, &fetched_user.email);

        // Check if user vault exists
        let user_vault_id: UUID = USER_STORE.with(|ur: &RefCell<UserStore>| {
            let user_store = ur.borrow();
            let user = user_store.get_user(&principal); //.unwrap();
            assert!(user.is_ok());
            user.unwrap().user_vault_id.unwrap()
        });
        USER_VAULT_STORE.with(|ms: &RefCell<UserVaultStore>| {
            let user_vault_store = ms.borrow();
            let uv = user_vault_store.get_user_vault(&user_vault_id);
            assert!(uv.is_ok());
            // user vault needs to be empty
            assert!(uv.unwrap().secret_ids.is_empty());
        });

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
            assert_eq!(secret.name(), added_secret.name());
            assert_eq!(secret.username().cloned(), added_secret.username().cloned());
            assert_eq!(secret.password().cloned(), added_secret.password().cloned());
        });
    }

    fn create_principal() -> Principal {
        Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ])
    }
}
