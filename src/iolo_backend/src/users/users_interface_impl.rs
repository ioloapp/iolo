use std::cell::RefCell;

use candid::Principal;

use crate::{common::error::SmartVaultErr, smart_vaults::smart_vault::USER_STORE};

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
    let new_user = User::new(caller, args);

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

pub fn update_user_impl(user: User, principal: &Principal) -> Result<User, SmartVaultErr> {
    // Update the user
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
        let mut user_store = ur.borrow_mut();
        match user_store.update_user(user, principal) {
            Ok(u) => Ok(u.clone()),
            Err(e) => Err(e),
        }
    })
}

pub fn update_user_login_date_impl(principal: &Principal) -> Result<User, SmartVaultErr> {
    // get current user
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<User, SmartVaultErr> {
        let mut user_store = ur.borrow_mut();
        user_store.update_user_login_date(principal)
    })
}

pub fn delete_user_impl(principal: &Principal) -> Result<(), SmartVaultErr> {
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
        common::error::SmartVaultErr,
        smart_vaults::smart_vault::USER_STORE,
        users::{
            user::AddUserArgs,
            user_store::UserStore,
            users_interface_impl::{
                create_user_impl, delete_user_impl, get_user, update_user_impl,
                update_user_login_date_impl,
            },
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
        let mut fetched_user = get_user(&principal).unwrap();
        assert_eq!(&created_user.id(), &fetched_user.id());
        assert_eq!(&created_user.email, &fetched_user.email);

        fetched_user.email = Some("donald@ducktown.com".to_string());

        // update user
        update_user_impl(fetched_user.clone(), &principal).unwrap();
        let fetched_user = get_user(&principal).unwrap();
        assert_eq!(fetched_user.email, Some("donald@ducktown.com".to_string()));

        // update login date
        let old_login_date = fetched_user.date_last_login().clone().unwrap();
        std::thread::sleep(std::time::Duration::from_millis(1));
        update_user_login_date_impl(&principal).unwrap();
        let fetched_user = get_user(&principal).unwrap();
        let new_login_date = fetched_user.date_last_login().clone().unwrap();
        assert!(new_login_date > old_login_date);

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
    }

    fn create_principal() -> Principal {
        Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ])
    }
}
