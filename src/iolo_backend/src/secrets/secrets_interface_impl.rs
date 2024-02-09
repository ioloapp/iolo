use std::cell::RefCell;

use candid::Principal;

use crate::policies::policies_interface_impl::get_policy_from_policy_store;
use crate::policies::policy::{Policy, PolicyID};
use crate::secrets::secret::{SecretID, UpdateSecretArgs};

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
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
    let new_secret_id: SecretID = UUID::new().await;

    // we generate the secret
    let secret: Secret = Secret::create_from_add_secret_args(
        caller.to_string(),
        new_secret_id.clone(),
        args.clone(),
    );

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
        user_store.add_secret_to_user(
            &caller.to_string(),
            new_secret_id,
            args.encrypted_symmetric_key.clone(),
        )
    })?;
    Ok(secret)
}

pub fn get_secret_impl(sid: SecretID, caller: &Principal) -> Result<Secret, SmartVaultErr> {
    let secret = SECRET_STORE.with(|x| {
        let secret_store = x.borrow();
        secret_store.get(&sid.clone())
    });

    match secret {
        Ok(s) if &s.owner() == &caller.to_string() => Ok(s),
        Ok(s) => Err(SmartVaultErr::SecretDoesNotExist(s.id().to_string())),
        Err(e) => Err(e),
    }
}

pub fn get_secret_list_impl(principal: &Principal) -> Result<Vec<SecretListEntry>, SmartVaultErr> {
    // get secret ids from user in user store
    let secret_ids: Vec<SecretID> = USER_STORE.with(|us| {
        let user_store = us.borrow();
        let user = user_store.get_user(&principal.to_string()).unwrap();
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
        secret_store.update_secret(&principal.to_string(), usa)
    })
}

pub fn remove_secret_impl(secret_id: SecretID, principal: &Principal) -> Result<(), SmartVaultErr> {
    // delete secret from secret store
    SECRET_STORE.with(
        |secret_store_rc: &RefCell<SecretStore>| -> Result<(), SmartVaultErr> {
            let mut secret_store = secret_store_rc.borrow_mut();
            secret_store.remove_secret(&principal.to_string(), &secret_id)
        },
    )?;

    // delete secret from users secret list
    USER_STORE.with(|us| -> Result<(), SmartVaultErr> {
        let mut user_store = us.borrow_mut();
        user_store.remove_secret_from_user(&principal.to_string(), secret_id)
    })
}

pub fn get_encrypted_symmetric_key_impl(
    sid: SecretID,
    principal: &Principal,
) -> Result<Vec<u8>, SmartVaultErr> {
    // get encrypted symmetric key of a secret from user's keybox in the user store
    USER_STORE.with(|us| -> Result<Vec<u8>, SmartVaultErr> {
        let user_store = us.borrow();
        let user = user_store.get_user(&principal.to_string())?;
        user.key_box()
            .get(&sid)
            .cloned()
            .ok_or_else(|| SmartVaultErr::SecretDoesNotExist(sid.to_string()))
    })
}

pub fn get_secret_as_beneficiary_impl(
    secret_id: SecretID,
    policy_id: PolicyID,
    caller: &Principal,
) -> Result<Secret, SmartVaultErr> {
    // fetch policy from policy store and check if caller is beneficiary
    let policy: Policy;
    if let Ok(p) = get_policy_from_policy_store(&policy_id) {
        // check if the caller is a beneficiary of the policy
        if !p.beneficiaries().contains(&caller.to_string()) {
            return Err(SmartVaultErr::CallerNotBeneficiary(policy_id));
        }
        policy = p;
    } else {
        return Err(SmartVaultErr::PolicyDoesNotExist(policy_id));
    }

    // Check that beneficiary is allowed to read policy
    if *policy.conditions_status() {
        let secret = SECRET_STORE.with(|ss| {
            let secret_store = ss.borrow();
            secret_store.get(&secret_id)
        })?;
        return Ok(secret);
    }

    Err(SmartVaultErr::InvalidPolicyCondition)
}

pub fn get_encrypted_symmetric_key_as_beneficiary_impl(
    secret_id: SecretID,
    policy_id: PolicyID,
    caller: &Principal,
) -> Result<Vec<u8>, SmartVaultErr> {
    // fetch policy from policy store and check if caller is beneficiary
    let policy: Policy;
    if let Ok(p) = get_policy_from_policy_store(&policy_id) {
        // check if the caller is a beneficiary of the policy
        if !p.beneficiaries().contains(&caller.to_string()) {
            return Err(SmartVaultErr::CallerNotBeneficiary(policy_id));
        }
        policy = p;
    } else {
        return Err(SmartVaultErr::PolicyDoesNotExist(policy_id));
    }

    // Check that beneficiary is allowed to read policy
    if *policy.conditions_status() {
        return Ok(policy.key_box().get(&secret_id).unwrap().clone());
    }

    Err(SmartVaultErr::InvalidPolicyCondition)
}

#[cfg(test)]
mod tests {
    use candid::Principal;

    use crate::{
        common::error::SmartVaultErr,
        secrets::{
            secret::{AddSecretArgs, UpdateSecretArgs},
            secrets_interface_impl::{
                add_secret_impl, get_encrypted_symmetric_key_impl, get_secret_impl,
                get_secret_list_impl, remove_secret_impl, update_secret_impl,
            },
        },
        smart_vaults::smart_vault::SECRET_STORE,
        smart_vaults::smart_vault::USER_STORE,
        users::{user::AddOrUpdateUserArgs, users_interface_impl::create_user_impl},
    };

    #[tokio::test]
    async fn itest_secret_lifecycle() {
        let principal = create_principal();

        // Create User and store it
        let aua: AddOrUpdateUserArgs = AddOrUpdateUserArgs {
            name: Some("donald".to_string()),
            email: None,
            user_type: None,
        };
        let _new_user = create_user_impl(aua, &principal).await.unwrap();

        // Create Mock Secret
        let encrypted_symmetric_key = vec![1, 2, 3];

        let mut asa: AddSecretArgs = AddSecretArgs {
            category: None,
            name: Some("Google".to_string()),
            username: Some(vec![1, 2, 3]),
            password: Some(vec![1, 2, 3]),
            url: None,
            notes: Some(vec![1, 2, 3]),
            encrypted_symmetric_key,
        };

        // Add Secret
        let added_secret = add_secret_impl(asa.clone(), &principal).await.unwrap();
        assert_eq!(added_secret.name(), asa.name);
        assert_eq!(added_secret.username().cloned(), asa.username);
        assert_eq!(added_secret.password().cloned(), asa.password);

        // Check if the right secret is in secret store
        SECRET_STORE.with(|ss| {
            let secret_store = ss.borrow();
            let secret = secret_store.get(&added_secret.id()).unwrap();
            assert_eq!(secret.id(), added_secret.id());
            assert_eq!(secret.name(), added_secret.name());
            assert_eq!(secret.username().cloned(), added_secret.username().cloned());
            assert_eq!(secret.password().cloned(), added_secret.password().cloned());
        });

        // check if the secret is in the user object
        USER_STORE.with(|us| {
            let user_store = us.borrow();
            let user = user_store.get_user(&principal.to_string()).unwrap();
            assert_eq!(user.secrets.len(), 1, "suer should hold 1 secret now");
            assert_eq!(user.secrets[0], added_secret.id());
        });

        // get secret from proper interface implementation
        let fetched_secret_res = get_secret_impl(added_secret.id().to_string(), &principal);
        assert!(fetched_secret_res.is_ok());
        let fetched_secret = fetched_secret_res.unwrap();

        assert_eq!(added_secret.id(), fetched_secret.id());
        assert_eq!(added_secret.name(), fetched_secret.name());
        assert_eq!(added_secret.username(), fetched_secret.username());
        assert_eq!(added_secret.password(), fetched_secret.password());

        // get secret decryption material
        let enc_sym_key = get_encrypted_symmetric_key_impl(added_secret.id(), &principal);
        assert!(enc_sym_key.is_ok());
        assert_eq!(enc_sym_key.unwrap(), vec![1, 2, 3]);

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
            id: fetched_secret.id().to_string(),
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
        let test_fetch = get_secret_impl(added_secret.id().to_string(), &principal);
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
