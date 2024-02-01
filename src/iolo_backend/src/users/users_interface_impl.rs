use std::cell::RefCell;

use candid::Principal;

use crate::{common::error::SmartVaultErr, smart_vaults::smart_vault::USER_STORE};

use super::{
    contact::{AddContactArgs, Contact},
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

pub fn get_current_user_impl(user: &Principal) -> Result<User, SmartVaultErr> {
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

pub fn add_contact_impl(args: AddContactArgs, caller: &Principal) -> Result<(), SmartVaultErr> {
    let contact = Contact::from(args);

    // add contact to user store (caller)
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<(), SmartVaultErr> {
        let mut user_store = ur.borrow_mut();
        user_store.add_contact(*caller, contact)
    })?;

    Ok(())
}

pub fn get_contact_list_impl(caller: &Principal) -> Result<Vec<Contact>, SmartVaultErr> {
    // add contact to user store (caller)
    USER_STORE.with(
        |ur: &RefCell<UserStore>| -> Result<Vec<Contact>, SmartVaultErr> {
            let user_store = ur.borrow();
            user_store.get_contact_list(*caller)
        },
    )
}

pub fn remove_contact_impl(contact: Contact, caller: &Principal) -> Result<(), SmartVaultErr> {
    USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<(), SmartVaultErr> {
        let mut user_store = ur.borrow_mut();
        user_store.remove_contact(*caller, contact)
    })?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use std::cell::RefCell;

    use candid::Principal;
    use rand::Rng;

    use crate::{
        common::error::SmartVaultErr,
        smart_vaults::smart_vault::USER_STORE,
        users::{
            contact::AddContactArgs,
            user::AddUserArgs,
            user_store::UserStore,
            users_interface_impl::{
                add_contact_impl, create_user_impl, delete_user_impl, get_contact_list_impl,
                get_current_user_impl, remove_contact_impl, update_user_impl,
                update_user_login_date_impl,
            },
        },
    };

    #[tokio::test]
    async fn itest_user_lifecycle() {
        // Create test user
        let principal = create_principal();
        let contact_principal = create_principal();

        // Create User and store it
        let aua: AddUserArgs = AddUserArgs {
            id: principal,
            name: Some("donald".to_string()),
            email: None,
            user_type: None,
        };
        let created_user = create_user_impl(aua, &principal).await.unwrap();
        let fetched_user = get_current_user_impl(&principal).unwrap();
        assert_eq!(&created_user.id(), &fetched_user.id());
        assert_eq!(&created_user.email, &fetched_user.email);
        assert!(&created_user.contacts.is_empty());

        // test get contact list
        let contact_list = get_contact_list_impl(&principal).unwrap();
        assert_eq!(contact_list.len(), 0);

        // add contact
        let aca: AddContactArgs = AddContactArgs {
            id: contact_principal,
            name: Some("my contact".to_string()),
            email: None,
            user_type: None,
        };
        let add_contact_result = add_contact_impl(aca, &principal);
        assert!(add_contact_result.is_ok());
        let mut fetched_user = get_current_user_impl(&principal).unwrap();
        assert!(fetched_user.contacts.len() == 1);
        assert!(fetched_user.contacts[0].id == contact_principal);
        assert_eq!(
            fetched_user.contacts[0].name,
            Some("my contact".to_string())
        );

        // test get contact list
        let contact_list = get_contact_list_impl(&principal).unwrap();
        assert_eq!(contact_list.len(), 1);

        // update contact

        // update user
        fetched_user.email = Some("donald@ducktown.com".to_string());
        update_user_impl(fetched_user.clone(), &principal).unwrap();
        let fetched_user = get_current_user_impl(&principal).unwrap();
        assert_eq!(fetched_user.email, Some("donald@ducktown.com".to_string()));

        // update login date
        let old_login_date = fetched_user.date_last_login().clone().unwrap();
        std::thread::sleep(std::time::Duration::from_millis(1));
        update_user_login_date_impl(&principal).unwrap();
        let fetched_user = get_current_user_impl(&principal).unwrap();
        let new_login_date = fetched_user.date_last_login().clone().unwrap();
        assert!(new_login_date > old_login_date);

        // remove contact
        let contact = fetched_user.contacts[0].clone();
        remove_contact_impl(contact, &principal).unwrap();
        let contact_list = get_contact_list_impl(&principal).unwrap();
        assert_eq!(contact_list.len(), 0);

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
        // create random u8
        let mut rng = rand::thread_rng();

        // create random u8 array
        let mut random_u8_array: [u8; 29] = [0; 29];
        rng.fill(&mut random_u8_array[..]);
        Principal::from_slice(&random_u8_array)
    }
}
