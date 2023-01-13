use std::cell::RefCell;
use std::collections::BTreeMap;

use candid::candid_method;
use ic_cdk::{post_upgrade, pre_upgrade, storage};
use ic_stable_structures::memory_manager::VirtualMemory;
use ic_stable_structures::DefaultMemoryImpl;

use crate::users::user::{User, UserID};

use super::master_safe::MasterSafe;
use super::secret::Secret;
use super::user_safe::UserSafe;

pub type Memory = VirtualMemory<DefaultMemoryImpl>;
pub type IneritanceRegistryEntry = Vec<UserID>;
pub type InheritanceRegistry = BTreeMap<UserID, IneritanceRegistryEntry>;

thread_local! {
    // Mastersafe holding all the user safes
    static MASTERSAFE: RefCell<MasterSafe> = RefCell::new(MasterSafe::new());

    // The inheritance registry keeps track of the inheritance relationships.
    // UserID -> Vector of UserID
    static INHERITANCE_REGISTRY: RefCell<InheritanceRegistry> = RefCell::new(InheritanceRegistry::new());
}

#[ic_cdk_macros::query]
#[candid_method(query)]
pub fn get_user_safe(user: UserID) -> UserSafe {
    let user_vaults: BTreeMap<UserID, UserSafe> =
        MASTERSAFE.with(|mv: &RefCell<MasterSafe>| mv.borrow().get_all_user_safes().clone());

    if let Some(uv) = user_vaults.get(&user) {
        uv.clone()
    } else {
        UserSafe::new(User::new(user))
    }
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn add_user_secret(user: UserID, secret: Secret) {
    MASTERSAFE.with(|ms: &RefCell<MasterSafe>| {
        let master_safe = &mut ms.borrow_mut();
        master_safe.add_user_secret(user, secret);
    });
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub fn update_user_secret(user: UserID, secret: Secret) {
    MASTERSAFE.with(|ms: &RefCell<MasterSafe>| {
        let master_safe = &mut ms.borrow_mut();
        master_safe.update_user_secret(user, secret);
    });
}

#[pre_upgrade]
fn pre_upgrade() {
    MASTERSAFE.with(|ms| storage::stable_save((ms,)).unwrap());
    INHERITANCE_REGISTRY.with(|ir| storage::stable_save((ir,)).unwrap());
}

#[post_upgrade]
fn post_upgrade() {
    let (old_ms,): (MasterSafe,) = storage::stable_restore().unwrap();
    MASTERSAFE.with(|ms| *ms.borrow_mut() = old_ms);

    let (old_ir,): (InheritanceRegistry,) = storage::stable_restore().unwrap();
    INHERITANCE_REGISTRY.with(|ir| *ir.borrow_mut() = old_ir);
}

#[cfg(test)]
mod tests {

    use crate::smart_vaults::unit_test_data::{
        TEST_SECRET_1, TEST_SECRET_2, TEST_SECRET_3, TEST_SECRET_4,
    };

    use super::*;

    #[test]
    fn utest_smart_vault() {
        let test_user1: User = User::new_random_with_seed(1);
        let test_user2: User = User::new_random_with_seed(2);

        add_user_secret(
            test_user1.get_id(),
            Secret::new(
                test_user1.get_id(),
                TEST_SECRET_1.category,
                TEST_SECRET_1.name.to_string(),
                TEST_SECRET_1.username.to_string(),
                TEST_SECRET_1.password.to_string(),
                TEST_SECRET_1.name.to_string(),
            ),
        );

        add_user_secret(
            test_user1.get_id(),
            Secret::new(
                test_user1.get_id(),
                TEST_SECRET_2.category,
                TEST_SECRET_2.name.to_string(),
                TEST_SECRET_2.username.to_string(),
                TEST_SECRET_2.password.to_string(),
                TEST_SECRET_2.name.to_string(),
            ),
        );

        add_user_secret(
            test_user2.get_id(),
            Secret::new(
                test_user2.get_id(),
                TEST_SECRET_3.category,
                TEST_SECRET_3.name.to_string(),
                TEST_SECRET_3.username.to_string(),
                TEST_SECRET_3.password.to_string(),
                TEST_SECRET_3.name.to_string(),
            ),
        );

        add_user_secret(
            test_user2.get_id(),
            Secret::new(
                test_user2.get_id(),
                TEST_SECRET_4.category,
                TEST_SECRET_4.name.to_string(),
                TEST_SECRET_4.username.to_string(),
                TEST_SECRET_4.password.to_string(),
                TEST_SECRET_4.name.to_string(),
            ),
        );

        // MASTERSAFE.with(|ms| {
        //     dbg!(&ms);
        // });

        // check right number of secrets in user safe
        let user1_secrets = get_user_safe(test_user1.get_id()).secrets().clone();
        let user2_secrets = get_user_safe(test_user2.get_id()).secrets().clone();
        assert_eq!(user1_secrets.keys().len(), 2);
        assert_eq!(user2_secrets.keys().len(), 2);

        // check rightful owner of secrets within user safe
        for (_, secret) in user1_secrets.into_iter() {
            assert_eq!(secret.owner().clone(), test_user1.get_id());
        }

        for (_, secret) in user2_secrets.into_iter() {
            assert_eq!(secret.owner().clone(), test_user2.get_id());
        }

        // check right secrets

        // check if changing a password works
        let better_pwd = "my_new_and_better_pwd".to_string();
        update_user_secret(
            test_user1.get_id(),
            Secret::new(
                test_user1.get_id(),
                TEST_SECRET_1.category,
                TEST_SECRET_1.name.to_string(),
                TEST_SECRET_1.username.to_string(),
                better_pwd,
                TEST_SECRET_1.name.to_string(),
            ),
        );
    }
}
