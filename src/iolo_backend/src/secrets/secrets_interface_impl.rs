use std::cell::RefCell;

use candid::Principal;

use crate::secrets::secret::UpdateSecretArgs;
use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    secrets::secret::SecretSymmetricCryptoMaterial,
    smart_vaults::smart_vault::{SECRET_STORE, USER_STORE},
};

use super::{
    secret::{AddSecretArgs, Secret, SecretListEntry},
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
    args: AddSecretArgs,
    caller: &Principal,
) -> Result<Secret, SmartVaultErr> {
    // generate a new UUID for the secret
    let new_secret_id: UUID = UUID::new_random().await.into();

    // we generate the secret and produce the decryption material
    let secret: Secret = Secret::create_from_add_secret_args(*caller, new_secret_id, args.clone());
    let decryption_material: SecretSymmetricCryptoMaterial = args.symmetric_crypto_material.clone();

    // Add the secret to the secret store (secrets: StableBTreeMap<UUID, Secret, Memory>,)
    SECRET_STORE.with(
        |secret_store_rc: &RefCell<SecretStore>| -> Result<Secret, SmartVaultErr> {
            let mut secret_store = secret_store_rc.borrow_mut();
            secret_store.add_secret(secret.clone())
        },
    )?;

    // add the secret id to the user in the USER_STORE
    USER_STORE.with(|us| {
        let mut user_store = us.borrow_mut();
        user_store.add_secret_to_user(&caller, new_secret_id, decryption_material)
    })?;
    Ok(secret)
}

pub fn get_secret_impl(sid: UUID, _principal: &Principal) -> Result<Secret, SmartVaultErr> {
    let secret = SECRET_STORE.with(|x| {
        let secret_store = x.borrow();
        secret_store.get(&UUID::from(sid.clone()))
    });

    match secret {
        Ok(s) if &s.owner() == _principal => Ok(s),
        Ok(s) => Err(SmartVaultErr::SecretDoesNotExist(s.id().to_string())),
        Err(e) => Err(e),
    }
}

pub fn get_secret_list_impl(principal: &Principal) -> Result<Vec<SecretListEntry>, SmartVaultErr> {
    // get secret ids from user in user store
    let secret_ids: Vec<UUID> = USER_STORE.with(|us| {
        let user_store = us.borrow();
        let user = user_store.get_user(&principal).unwrap();
        user.secrets.clone()
    });

    // get all the corresponding secrets
    let secrets: Vec<Secret> = SECRET_STORE.with(|x| {
        let secret_store = x.borrow();
        let secrets: Vec<Secret> = secret_ids
            .iter()
            .map(|sid| secret_store.get(sid).unwrap())
            .collect();
        secrets
    });

    Ok(secrets.into_iter().map(SecretListEntry::from).collect())
}

pub fn update_secret_impl(
    usa: UpdateSecretArgs,
    principal: &Principal,
) -> Result<Secret, SmartVaultErr> {
    SECRET_STORE.with(|x| {
        let mut secret_store = x.borrow_mut();
        // TODO: check if the secret is in the user vault
        secret_store.update_secret(principal, usa)
    })
}

pub fn remove_secret_impl(secret_id: String, principal: &Principal) -> Result<(), SmartVaultErr> {
    // delete secret from secret store
    SECRET_STORE.with(
        |secret_store_rc: &RefCell<SecretStore>| -> Result<(), SmartVaultErr> {
            let mut secret_store = secret_store_rc.borrow_mut();
            secret_store.remove_secret(principal, &secret_id)
        },
    )?;

    // delete secret from users secret list
    USER_STORE.with(|us| -> Result<(), SmartVaultErr> {
        let mut user_store = us.borrow_mut();
        user_store.remove_secret_from_user(principal, &secret_id)
    })
}

pub fn get_secret_symmetric_crypto_material_impl(
    sid: UUID,
    principal: &Principal,
) -> Result<SecretSymmetricCryptoMaterial, SmartVaultErr> {
    // get symmetric decryption material from user's keybox in the user store
    USER_STORE.with(
        |us| -> Result<SecretSymmetricCryptoMaterial, SmartVaultErr> {
            let user_store = us.borrow();
            let user = user_store.get_user(&principal)?;
            user.key_box()
                .get(&sid)
                .cloned()
                .ok_or_else(|| SmartVaultErr::SecretDecryptionMaterialDoesNotExist(sid.to_string()))
        },
    )
}

#[cfg(test)]
mod tests {

    use candid::Principal;

    use crate::{
        common::{error::SmartVaultErr, uuid::UUID},
        secrets::{
            secret::{AddSecretArgs, SecretSymmetricCryptoMaterial, UpdateSecretArgs},
            secrets_interface_impl::{
                add_secret_impl, get_secret_impl, get_secret_list_impl,
                get_secret_symmetric_crypto_material_impl, remove_secret_impl, update_secret_impl,
            },
        },
        smart_vaults::smart_vault::SECRET_STORE,
        smart_vaults::smart_vault::USER_STORE,
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
        };
        let mut asa: AddSecretArgs = AddSecretArgs {
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

        // check if the secret is in the user object
        USER_STORE.with(|us| {
            let user_store = us.borrow();
            let user = user_store.get_user(&principal).unwrap();
            assert_eq!(user.secrets.len(), 1, "suer should hold 1 secret now");
            assert_eq!(user.secrets[0], added_secret.id().clone().into());
        });

        // get secret from proper interface implementation
        let fetched_secret_res = get_secret_impl(added_secret.id().clone(), &principal);
        assert!(fetched_secret_res.is_ok());
        let mut fetched_secret = fetched_secret_res.unwrap();

        assert_eq!(added_secret.id(), fetched_secret.id());
        assert_eq!(added_secret.name(), fetched_secret.name());
        assert_eq!(added_secret.username(), fetched_secret.username());
        assert_eq!(added_secret.password(), fetched_secret.password());

        // get secret decryption material
        let sscm = get_secret_symmetric_crypto_material_impl(added_secret.id(), &principal);
        assert!(sscm.is_ok());
        assert_eq!(sscm.unwrap().encrypted_symmetric_key, vec![1, 2, 3]);

        // check get secret list
        let secrets_list = get_secret_list_impl(&principal).unwrap();
        assert_eq!(secrets_list.len(), 1, "secrets list is not length 1");

        // add another again
        asa.name = Some("iolo".to_string());
        add_secret_impl(asa.clone(), &principal).await.unwrap();

        // check get secret list
        let secrets_list = get_secret_list_impl(&principal).unwrap();
        assert_eq!(secrets_list.len(), 2);

        // update secret
        let updated_secret: UpdateSecretArgs = UpdateSecretArgs {
            id: fetched_secret.id(),
            category: None,
            name: Some("iolo2024".to_string()),
            username: None,
            password: None,
            url: None,
            notes: None,
        };
        let updated_secret = update_secret_impl(updated_secret, &principal).unwrap();
        assert_eq!(updated_secret.name(), Some("iolo2024".to_string()));

        // delete secret
        let deleted_secret = remove_secret_impl(updated_secret.id().to_string(), &principal);
        assert!(deleted_secret.is_ok());
        let test_fetch = get_secret_impl(added_secret.id().clone(), &principal);
        assert!(test_fetch.is_err());
        assert_eq!(
            test_fetch.unwrap_err(),
            SmartVaultErr::SecretDoesNotExist(updated_secret.id().to_string())
        );

        // check get secret list
        let secrets_list = get_secret_list_impl(&principal).unwrap();
        assert_eq!(secrets_list.len(), 1);
    }

    fn create_principal() -> Principal {
        Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ])
    }
}
