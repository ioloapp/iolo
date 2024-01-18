use std::cell::RefCell;

use candid::Principal;

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    smart_vaults::smart_vault::{get_vault_id_for, USER_STORE, USER_VAULT_STORE},
    user_vaults::{user_vault::UserVault, user_vault_store::UserVaultStore},
};

use super::{
    user::{AddUserArgs, User},
    user_store::UserStore,
};

/**
 * This is the implementation for the interface create_user method
 */
pub async fn create_user_impl(
    args: AddUserArgs,
    caller: &Principal,
) -> Result<User, SmartVaultErr> {
    // Create user from principal (caller)
    let mut new_user = User::new(caller, args);
    let new_user_vault = UserVault::new().await;

    // Let's create the user vault
    let new_user_vault_id = USER_VAULT_STORE.with(
        |user_vault_store_rc: &RefCell<UserVaultStore>| -> Result<UUID, SmartVaultErr> {
            let mut user_vault_store = user_vault_store_rc.borrow_mut();
            Ok(user_vault_store.add_user_vault(new_user_vault))
        },
    )?;

    // Add the new user vault to the new user
    new_user.set_user_vault(new_user_vault_id);

    // // Store the new user
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
        let mut user_store = ur.borrow_mut();
        match user_store.add_user(new_user) {
            Ok(u) => Ok(u.clone()),
            Err(e) => Err(e),
        }
    })
}

pub fn get_user(user: &Principal) -> Result<User, SmartVaultErr> {
    // get current user
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
        let user_store = ur.borrow();
        match user_store.get_user(&user) {
            Ok(u) => Ok(u.clone()),
            Err(e) => Err(e),
        }
    })
}

pub fn delete_user_impl(principal: &Principal) -> Result<(), SmartVaultErr> {
    // let principal = get_caller();
    let user_vault_id: UUID = get_vault_id_for(principal.to_owned())?;

    USER_VAULT_STORE.with(|ms: &RefCell<UserVaultStore>| {
        let mut master_vault = ms.borrow_mut();
        master_vault.remove_user_vault(&user_vault_id);
    });

    // delete the user
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
        let mut user_store = ur.borrow_mut();
        user_store.delete_user(&principal)
    })?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use std::cell::RefCell;

    use candid::Principal;

    use crate::{
        common::{error::SmartVaultErr, uuid::UUID},
        smart_vaults::smart_vault::{USER_STORE, USER_VAULT_STORE},
        user_vaults::user_vault_store::UserVaultStore,
        users::{
            user::AddUserArgs,
            user_store::UserStore,
            users_interface_impl::{create_user_impl, delete_user_impl, get_user},
        },
    };

    #[tokio::test]
    async fn itest_user_lifecycle() {
        // Create test user
        let principal = create_principal();

        // Create User and store it
        let aua: AddUserArgs = AddUserArgs {
            id: principal,
            name: Some("donald".to_string()),
            email: None,
            user_type: None,
        };
        let created_user = create_user_impl(aua, &principal).await.unwrap();
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

        // delete user
        let _deleted_user = delete_user_impl(&principal);

        // assert that user is deleted
        USER_STORE.with(|ur: &RefCell<UserStore>| {
            let user_store = ur.borrow();
            let user = user_store.get_user(&principal);
            assert!(user.is_err());
            assert!(
                matches!(user, Err(SmartVaultErr::UserDoesNotExist(_))),
                "Expected UserDoesNotExist Error"
            );
        });

        // assert that user vault is deleted
        USER_VAULT_STORE.with(|ms: &RefCell<UserVaultStore>| {
            let user_vault_store = ms.borrow();
            let uv = user_vault_store.get_user_vault(&user_vault_id);
            assert!(uv.is_err());
            assert!(
                matches!(uv, Err(SmartVaultErr::UserVaultDoesNotExist(_))),
                "Expected UserVaultDoesNotExist Error"
            );
        });
    }

    fn create_principal() -> Principal {
        Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ])
    }
}
