use std::cell::RefCell;

use candid::Principal;

use crate::{
    common::{error::SmartVaultErr, uuid::UUID},
    smart_vaults::smart_vault::{USER_STORE, USER_VAULT_STORE},
    user_vaults::user_vault_store::UserVaultStore,
};

use super::{
    user::{AddUserArgs, User},
    user_store::UserStore,
};

// Interface Implementation for Users
pub fn create_user_impl(args: AddUserArgs, caller: &Principal) -> Result<User, SmartVaultErr> {
    // Create user from principal (caller)
    let mut new_user = User::new(caller, args);

    // Let's create the user vault
    let new_user_vault_id: UUID = USER_VAULT_STORE.with(
        |ms: &RefCell<UserVaultStore>| -> Result<UUID, SmartVaultErr> {
            let mut master_vault = ms.borrow_mut();
            Ok(master_vault.create_user_vault())
        },
    )?;

    // // Add the new user vault to the new user
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
