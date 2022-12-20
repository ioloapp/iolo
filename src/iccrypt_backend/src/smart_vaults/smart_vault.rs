use std::cell::RefCell;
use std::vec;

use candid::candid_method;

use super::master_safe::MasterSafe;
use super::secret::Secret;
use super::user_safe::UserSafe;

pub type UserID = String;

thread_local! {
    static MASTERSAFE: RefCell<MasterSafe> = RefCell::new(MasterSafe::new());
}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn get_user_safe(user: String) -> UserSafe {
    let user_vaults = MASTERSAFE.with(|mv| mv.borrow().get_all_user_safes().clone());

    if let Some(uv) = user_vaults.get(&user) {
        uv.clone()
    } else {
        UserSafe::new(user)
    }
}

#[ic_cdk_macros::update]
#[candid_method(update)]
fn add_user_secret(user: String, secret: Secret) {
    MASTERSAFE.with(|ms| {
        let master_safe = &mut ms.borrow_mut();
        master_safe.add_user_secret(user, secret);
    });
}

candid::export_service!();

#[cfg(test)]
mod tests {

    use crate::smart_vaults::secret::SecretCategory;

    use super::*;

    #[test]
    fn test_add_user_secrets() {
        let test_user1 = String::from("User1");
        let test_user2 = String::from("User2");

        add_user_secret(
            test_user1.clone(),
            Secret::new(
                test_user1.clone(),
                SecretCategory::Password,
                "Tobi's first Secret".to_owned(),
                "username1".to_owned(),
                "password1".to_owned(),
                "www.super.com".to_owned(),
            ),
        );

        add_user_secret(
            test_user1.clone(),
            Secret::new(
                test_user1.clone(),
                SecretCategory::Password,
                "Tobi's second Secret".to_owned(),
                "username2".to_owned(),
                "password2".to_owned(),
                "www.duper.com".to_owned(),
            ),
        );

        add_user_secret(
            test_user2.clone(),
            Secret::new(
                test_user2.clone(),
                SecretCategory::Password,
                "name of this".to_owned(),
                "username1".to_owned(),
                "password1".to_owned(),
                "www.super.com".to_owned(),
            ),
        );

        add_user_secret(
            test_user2.clone(),
            Secret::new(
                test_user2.clone(),
                SecretCategory::Password,
                "name of another thing".to_owned(),
                "username2".to_owned(),
                "password2".to_owned(),
                "www.duper.com".to_owned(),
            ),
        );

        // MASTERSAFE.with(|ms| {
        //     dbg!(&ms);
        // });

        let user1_secrets = get_user_safe(test_user1.clone()).secrets;
        let user2_secrets = get_user_safe(test_user2.clone()).secrets;
        assert_eq!(user1_secrets.keys().len(), 2);
        assert_eq!(user2_secrets.keys().len(), 2);

        for (_, secret) in user1_secrets.into_iter() {
            assert_eq!(secret.get_owner(), test_user1.clone());
        }

        for (_, secret) in user2_secrets.into_iter() {
            assert_eq!(secret.get_owner(), test_user2.clone());
        }
    }

    #[test]
    fn get_candid() {
        println!("####### Candid START #######");
        println!("");
        std::println!("{}", __export_service());
        println!("");
        println!("####### Candid END #######");
    }
}
