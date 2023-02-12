use std::cell::RefCell;
use std::collections::BTreeMap;

use candid::candid_method;
use ic_cdk::{post_upgrade, pre_upgrade, storage};

use crate::common::user::{User, UserID};

use super::master_safe::MasterSafe;
use super::secret::{Secret, SecretCategory};
use super::user_safe::UserSafe;

pub type UserRegistry = BTreeMap<UserID, User>;

thread_local! {
    // Mastersafe holding all the user safes
    static MASTERSAFE: RefCell<MasterSafe> = RefCell::new(MasterSafe::new());

    // User Registsry
    static USER_REGISTRY: RefCell<UserRegistry> = RefCell::new(UserRegistry::new());
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn create_new_user(owner: UserID) {
    // create the new user
    USER_REGISTRY.with(|ur: &RefCell<UserRegistry>| {
        let mut user_registry = ur.borrow_mut();
        user_registry.insert(owner, User::new(&owner));
    });

    // open a safe for the new user
    MASTERSAFE.with(|ms: &RefCell<MasterSafe>| {
        let mut master_safe = ms.borrow_mut();
        master_safe.get_or_create_user_safe(&owner);
    });
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn delete_user(owner: UserID) {
    // delete the user safe
    MASTERSAFE.with(|ms: &RefCell<MasterSafe>| {
        let mut master_safe = ms.borrow_mut();
        master_safe.remove_user_safe(&owner);
    });

    // delete the user
    USER_REGISTRY.with(|ur: &RefCell<UserRegistry>| {
        let mut user_registry = ur.borrow_mut();
        user_registry.remove(&owner);
    });
}
#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn is_user_safe_existing(owner: UserID) -> bool {
    MASTERSAFE
        .with(|mv: &RefCell<MasterSafe>| mv.borrow_mut().is_user_safe_existing(&owner))
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_user_safe(owner: UserID) -> UserSafe {
    MASTERSAFE
        .with(|mv: &RefCell<MasterSafe>| mv.borrow_mut().get_or_create_user_safe(&owner).clone())
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn add_user_secret(owner: UserID, category: SecretCategory, name: String) {
    let new_secret = Secret::new(&owner, &category, &name).await;
    MASTERSAFE.with(|ms: &RefCell<MasterSafe>| {
        let mut master_safe = ms.borrow_mut();
        master_safe.add_secret(&owner, &new_secret);
    });
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn update_user_secret(owner: UserID, secret: Secret) {
    MASTERSAFE.with(|ms: &RefCell<MasterSafe>| {
        let mut master_safe = ms.borrow_mut();
        master_safe.update_secret(&owner, &secret);
    });
}

#[pre_upgrade]
fn pre_upgrade() {
    MASTERSAFE.with(|ms| storage::stable_save((ms,)).unwrap());
    USER_REGISTRY.with(|ur| storage::stable_save((ur,)).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (old_ms,): (MasterSafe,) = storage::stable_restore().unwrap();
    MASTERSAFE.with(|ms| *ms.borrow_mut() = old_ms);

    let (old_ur,): (UserRegistry,) = storage::stable_restore().unwrap();
    USER_REGISTRY.with(|ur| *ur.borrow_mut() = old_ur);
}

#[cfg(test)]
mod tests {

    use crate::smart_vaults::unit_test_data::{
        TEST_SECRET_1, TEST_SECRET_2, TEST_SECRET_3, TEST_SECRET_4,
    };

    use super::*;

    #[tokio::test]
    async fn utest_smart_vault() {
        let test_user1: User = User::new_random_with_seed(1);
        let test_user2: User = User::new_random_with_seed(2);

        create_new_user(test_user1.id().clone());
        create_new_user(test_user2.id().clone());

        add_user_secret(
            test_user1.id().clone(),
            TEST_SECRET_1.category,
            TEST_SECRET_1.name.to_string(),
        )
        .await;

        add_user_secret(
            test_user1.id().clone(),
            TEST_SECRET_2.category,
            TEST_SECRET_2.name.to_string(),
        )
        .await;

        add_user_secret(
            test_user2.id().clone(),
            TEST_SECRET_3.category,
            TEST_SECRET_3.name.to_string(),
        )
        .await;

        add_user_secret(
            test_user2.id().clone(),
            TEST_SECRET_4.category,
            TEST_SECRET_4.name.to_string(),
        )
        .await;

        // MASTERSAFE.with(|ms| {
        //     dbg!(&ms);
        // });

        // check right number of secrets in user safe
        let user1_secrets = get_user_safe(test_user1.id().clone()).secrets().clone();
        let user2_secrets = get_user_safe(test_user2.id().clone()).secrets().clone();

        assert_eq!(user1_secrets.keys().len(), 2);
        assert_eq!(user2_secrets.keys().len(), 2);

        // check rightful owner of secrets within user safe
        for (_, secret) in user1_secrets.into_iter() {
            assert_eq!(secret.owner(), test_user1.id());
        }

        for (_, secret) in user2_secrets.into_iter() {
            assert_eq!(secret.owner().clone(), test_user2.id().clone());
        }

        // check right secrets not needed as already tested in secret.rs

        // check if changing a password works
        let _better_pwd = "my_new_and_better_pwd".to_string();
        update_user_secret(
            test_user1.id().clone(),
            Secret::new(
                &test_user1.id().clone(),
                &TEST_SECRET_1.category,
                &TEST_SECRET_1.name.to_string(),
            )
            .await,
        );
    }
}
