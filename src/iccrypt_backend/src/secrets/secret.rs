use std::{cell::RefCell, collections::HashMap};

use candid::{candid_method, CandidType, Deserialize};

// use crate::SECRETS;

pub type UserID = String;
pub type SecretID = String;
pub type UserVault = HashMap<SecretID, Secret>;
pub type MasterVault = HashMap<UserID, UserVault>;

thread_local! {
    // SECRETS: UserId -> PasswordMap -> Password
    static SECRETS: RefCell<MasterVault> = RefCell::new(MasterVault::new());
    static SETTINGS: RefCell<String> = RefCell::new(String::new());
}

#[derive(Debug, CandidType, Deserialize, Clone, Copy)]
pub enum SecretCategory {
    Password,
    CryptoWallet,
}

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct Secret {
    pub id: String,
    owner: UserID,
    category: SecretCategory,
    name: String,
    username: String,
    password: String,
    url: String,
}

impl Secret {
    pub fn new(
        owner: UserID,
        category: SecretCategory,
        name: String,
        username: String,
        password: String,
        url: String,
    ) -> Self {
        let mut id = String::from(&name);
        id.push_str(&username);
        id.push_str(&url);
        Self {
            owner,
            id,
            category,
            name,
            username,
            password,
            url,
        }
    }
}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn get_user_secrets(user: String) -> UserVault {
    let all_secrets = SECRETS.with(|sm| sm.borrow().clone());

    if let Some(user_secrets) = all_secrets.get(&user) {
        user_secrets.clone()
    } else {
        UserVault::new()
    }
}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn get_all_secrets() -> Vec<Secret> {
    let all_secrets: MasterVault = SECRETS.with(|sm| sm.borrow().clone());
    let vec_uv: Vec<UserVault> = all_secrets.into_iter().map(|(_uid, uv)| uv).collect();
    dbg!("wtf!!!!!!!!!!!!!!!!!!!!!!!!!!");
    dbg!(&vec_uv);
    // for x in vec_uv.into_iter() {
    //     dbg!(x);
    // }
    // let test: Vec<Secret> = vec_uv.into_iter().flatten(|(s)| s.into_values()).collect();

    vec![Secret::new(
        "Tobias".to_owned(),
        SecretCategory::Password,
        "name of this".to_owned(),
        "username1".to_owned(),
        "password1".to_owned(),
        "www.super.com".to_owned(),
    )]
}

#[ic_cdk_macros::update]
#[candid_method(update)]
fn add_user_secret(user: String, secret: Secret) {
    SECRETS.with(|s| {
        let mut master_vault = s.borrow_mut();
        if let Some(user_secrets) = master_vault.get_mut(&user) {
            // user already exists. we can insert the new Secret
            user_secrets.insert(secret.id.clone(), secret);
        } else {
            // first create the new user and then add the secret
            let mut uv: UserVault = HashMap::new();
            uv.insert(secret.id.clone(), secret);
            master_vault.insert(user, uv);
        }
    });
}

#[ic_cdk_macros::update]
#[candid_method(update)]
fn add_test_secrets() {
    println!("hi");
    dbg!("debug hi from backend");
    let test_user = String::from("Tobias");
    add_user_secret(
        test_user.to_owned(),
        Secret::new(
            "Tobias".to_owned(),
            SecretCategory::Password,
            "name of this".to_owned(),
            "username1".to_owned(),
            "password1".to_owned(),
            "www.super.com".to_owned(),
        ),
    );

    add_user_secret(
        test_user.to_owned(),
        Secret::new(
            "Tobias".to_owned(),
            SecretCategory::Password,
            "name of this".to_owned(),
            "username1".to_owned(),
            "password1".to_owned(),
            "www.super.com".to_owned(),
        ),
    );
    let test_user = String::from("Hugo");
    add_user_secret(
        test_user.to_owned(),
        Secret::new(
            "Tobias".to_owned(),
            SecretCategory::Password,
            "name of this".to_owned(),
            "username1".to_owned(),
            "password1".to_owned(),
            "www.super.com".to_owned(),
        ),
    );

    add_user_secret(
        test_user.to_owned(),
        Secret::new(
            "Tobias".to_owned(),
            SecretCategory::Password,
            "name of another thing".to_owned(),
            "username2".to_owned(),
            "password2".to_owned(),
            "www.duper.com".to_owned(),
        ),
    );
}

candid::export_service!();

#[cfg(test)]
mod tests {
    use crate::secrets::secret::SecretCategory;

    use super::*;

    #[test]
    fn test_secrets() {
        let test_user = String::from("Tobias");
        add_user_secret(
            test_user.to_owned(),
            Secret::new(
                "Tobias".to_owned(),
                SecretCategory::Password,
                "name of this".to_owned(),
                "username1".to_owned(),
                "password1".to_owned(),
                "www.super.com".to_owned(),
            ),
        );

        add_user_secret(
            test_user.to_owned(),
            Secret::new(
                "Tobias".to_owned(),
                SecretCategory::Password,
                "name of another thing".to_owned(),
                "username2".to_owned(),
                "password2".to_owned(),
                "www.duper.com".to_owned(),
            ),
        );

        let secrets = get_user_secrets(test_user);
        dbg!(&secrets);
    }

    #[test]
    fn get_candid() {
        println!("####### Candid START #######");
        println!("");
        std::println!("{}", __export_service());
        println!("");
        println!("####### Candid END #######");
    }

    #[test]
    fn test_get_all_secrets() {
        add_test_secrets();
        get_all_secrets();
    }
}
