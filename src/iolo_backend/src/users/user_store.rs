use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::users::user::AddOrUpdateUserArgs;
use crate::{
    common::{
        error::SmartVaultErr,
        memory::{get_stable_btree_memory_for_users, Memory},
        uuid::UUID,
    },
    secrets::secret::SecretSymmetricCryptoMaterial,
    users::user::User,
    utils::time,
};

use super::contact::Contact;
use super::user::PrincipalID;

#[derive(Serialize, Deserialize)]
pub struct UserStore {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    pub users: StableBTreeMap<PrincipalID, User, Memory>,
}

fn init_stable_data() -> StableBTreeMap<PrincipalID, User, Memory> {
    StableBTreeMap::init(get_stable_btree_memory_for_users())
}

impl Default for UserStore {
    fn default() -> Self {
        Self {
            users: init_stable_data(),
        }
    }
}

impl UserStore {
    pub fn new() -> Self {
        Self {
            users: init_stable_data(),
        }
    }

    pub fn add_user(&mut self, user: User) -> Result<User, SmartVaultErr> {
        // let principal_storable = PrincipalStorable::from(*user.id());
        let user_id = user.id().to_owned();

        if self.users.contains_key(&user_id) {
            Err(SmartVaultErr::UserAlreadyExists(user.id().to_string()))
        } else {
            self.users.insert(user_id.clone(), user.clone());
            self.get_user(&user_id)
        }
    }

    pub fn update_user(
        &mut self,
        args: AddOrUpdateUserArgs,
        caller: &PrincipalID,
    ) -> Result<User, SmartVaultErr> {
        // let principal_storable = PrincipalStorable::from(*caller);

        if let Some(mut existing_user) = self.users.remove(caller) {
            let now = time::get_current_time();
            existing_user.date_modified = now;
            existing_user.name = args.name.clone();
            existing_user.email = args.email.clone();
            existing_user.user_type = args.user_type.clone();
            self.users.insert(caller.to_string(), existing_user);
            self.get_user(caller)
        } else {
            Err(SmartVaultErr::UserDoesNotExist(caller.to_string()))
        }
    }

    fn update_user_secrets(
        &mut self,
        user: User,
        caller: &PrincipalID,
    ) -> Result<User, SmartVaultErr> {
        // Only secret list and keybox can be changed
        if let Some(mut existing_user) = self.users.remove(caller) {
            existing_user.secrets = user.secrets.clone();
            existing_user.key_box = user.key_box.clone();
            self.users.insert(caller.to_string(), existing_user);
            self.get_user(caller)
        } else {
            Err(SmartVaultErr::UserDoesNotExist(caller.to_string()))
        }
    }

    pub fn update_user_login_date(&mut self, caller: &PrincipalID) -> Result<User, SmartVaultErr> {
        // let principal_storable = PrincipalStorable::from(*caller);

        if let Some(mut existing_user) = self.users.remove(caller) {
            let now = time::get_current_time();
            existing_user.date_last_login = Some(now);
            existing_user.date_modified = now;
            self.users.insert(caller.to_string(), existing_user.clone());
            Ok(existing_user)
        } else {
            Err(SmartVaultErr::UserDoesNotExist(caller.to_string()))
        }
    }

    pub fn add_secret_to_user(
        &mut self,
        caller: &PrincipalID,
        secret_id: UUID,
        secret_decryption_material: SecretSymmetricCryptoMaterial,
    ) -> Result<(), SmartVaultErr> {
        // find user in users and add secret id to secrets
        let mut user = self
            .users
            .get(caller)
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(caller.to_string()))?;
        user.add_secret(secret_id, secret_decryption_material);

        self.users.insert(caller.to_string(), user);
        Ok(())
    }

    pub fn remove_secret_from_user(
        &mut self,
        caller: &PrincipalID,
        secret_id_str: &str,
    ) -> Result<(), SmartVaultErr> {
        let secret_id: UUID = secret_id_str.into();
        let mut user = self
            .users
            .get(caller)
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(caller.to_string()))?;

        user.remove_secret(secret_id)?;
        match self.update_user_secrets(user, caller) {
            Ok(_) => Ok(()),
            Err(e) => Err(e),
        }
    }

    pub fn add_policy_to_user(
        &mut self,
        caller: &PrincipalID,
        policy_id: String,
    ) -> Result<(), SmartVaultErr> {
        // find user in users and add secret id to secrets
        let mut user = self
            .users
            .get(&caller)
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(caller.to_string()))?;
        user.add_policy(policy_id);

        self.users.insert(caller.to_string(), user);
        Ok(())
    }

    pub fn get_user(&self, user_id: &PrincipalID) -> Result<User, SmartVaultErr> {
        self.users
            .get(user_id)
            .ok_or_else(|| SmartVaultErr::UserDoesNotExist(user_id.to_string()))
    }

    pub fn delete_user(&mut self, user_id: &PrincipalID) -> Result<User, SmartVaultErr> {
        self.users
            .remove(user_id)
            .ok_or_else(|| SmartVaultErr::UserDeletionFailed(user_id.to_string()))
    }

    pub fn get_all_last_login_dates(&self) -> Vec<(Principal, u64)> {
        self.users
            .iter()
            .filter_map(|(principal_id, user)| {
                if let Some(login_date) = user.date_last_login {
                    Some((Principal::from_text(&principal_id).unwrap(), login_date))
                } else {
                    None
                }
            })
            .collect()
    }

    pub fn add_contact(
        &mut self,
        user: &PrincipalID,
        contact: Contact,
    ) -> Result<(), SmartVaultErr> {
        // Only name, email and user_type can be updated
        if let Some(mut existing_user) = self.users.remove(user) {
            // add user only if not exists yet
            if existing_user.contacts.iter().any(|c| c.id == contact.id) {
                return Err(SmartVaultErr::ContactAlreadyExists(contact.id.to_string()));
            }

            // add contact to user
            existing_user.contacts.push(contact);

            // store user
            self.users.insert(user.to_string(), existing_user);
        } else {
            return Err(SmartVaultErr::UserDoesNotExist(user.to_string()));
        }

        Ok(())
    }

    pub fn update_contact(
        &mut self,
        user: &PrincipalID,
        contact: Contact,
    ) -> Result<Contact, SmartVaultErr> {
        // Only name, email and user_type can be updated
        if let Some(mut existing_user) = self.users.remove(user) {
            // check if contact exist in user contacts. if yes, update it. if not, throw error
            if !existing_user.contacts.iter().any(|c| c.id == contact.id) {
                return Err(SmartVaultErr::ContactDoesNotExist(contact.id.to_string()));
            }

            // update contact in user
            existing_user.contacts.retain(|c| c.id != contact.id);
            existing_user.contacts.push(contact.clone());

            // store user
            self.users.insert(user.to_string(), existing_user);
            Ok(contact)
        } else {
            Err(SmartVaultErr::UserDoesNotExist(user.to_string()))
        }
    }

    pub fn remove_contact(
        &mut self,
        user: &PrincipalID,
        id: Principal,
    ) -> Result<(), SmartVaultErr> {
        // Only name, email and user_type can be updated
        if let Some(mut existing_user) = self.users.remove(user) {
            // check if contact exist in user contacts. if yes, remove it. if not, throw error
            if !existing_user.contacts.iter().any(|c| c.id == id) {
                return Err(SmartVaultErr::ContactDoesNotExist(id.to_string()));
            }

            // remove contact from user
            existing_user.contacts.retain(|c| c.id != id);

            // store user
            self.users.insert(user.to_string(), existing_user);
        } else {
            return Err(SmartVaultErr::UserDoesNotExist(user.to_string()));
        }

        Ok(())
    }

    pub fn get_contact_list(&self, user: &PrincipalID) -> Result<Vec<Contact>, SmartVaultErr> {
        if let Some(existing_user) = self.users.get(user) {
            Ok(existing_user.contacts.clone())
        } else {
            Err(SmartVaultErr::UserDoesNotExist(user.to_string()))
        }
    }
}

#[cfg(test)]
mod tests {
    use candid::Principal;

    use crate::users::contact::Contact;
    use crate::{
        common::error::SmartVaultErr,
        users::user::{AddOrUpdateUserArgs, User},
        users::user_store::UserStore,
    };

    #[tokio::test]
    async fn utest_user_store() {
        // Create empty user_vault
        let principal: Principal = Principal::from_slice(&[
            1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);
        let principal_id = principal.to_string();

        let principal_2: Principal = Principal::from_slice(&[
            1, 2, 3, 4, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);
        let principal_2_id = principal_2.to_string();

        let args = AddOrUpdateUserArgs {
            name: None,
            email: None,
            user_type: None,
        };
        let new_user = User::new(principal_id.clone(), args);

        let mut user_store: UserStore = UserStore::new();

        assert!(user_store.add_user(new_user.clone()).is_ok());
        // no duplicates
        assert_eq!(
            user_store.add_user(new_user.clone()).unwrap_err(),
            SmartVaultErr::UserAlreadyExists(principal.to_string())
        );

        assert!(user_store.get_user(&principal_id).is_ok());
        assert_eq!(
            user_store.get_user(&principal_2_id).unwrap_err(),
            SmartVaultErr::UserDoesNotExist(principal_2_id)
        );

        let contact: Contact = Contact {
            id: principal,
            name: Some("Testuser".to_string()),
            email: Some("test@me.com".to_string()),
            user_type: None,
        };
        assert!(user_store.add_contact(&new_user.id, contact).is_ok());
        assert_eq!(user_store.get_contact_list(&new_user.id).unwrap().len(), 1);
    }
}
