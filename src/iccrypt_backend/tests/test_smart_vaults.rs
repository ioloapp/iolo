use candid::{Encode, Principal};
use ic_agent::Agent;
use iccrypt_backend;
use iccrypt_backend::smart_vaults::secret::{Secret, SecretCategory};
use iccrypt_backend::smart_vaults::smart_vault::{add_user_secret, get_user_safe};
use iccrypt_backend::users::user::{User, UserID};

mod common;

#[tokio::test]
async fn test_smart_vaults() -> Result<(), Box<dyn std::error::Error>> {
    let url = "http://localhost:4943/";

    let agent = Agent::builder()
        .with_transport(
            ic_agent::agent::http_transport::ReqwestHttpReplicaV2Transport::create(url)?,
        )
        .build()?;
    let cid_string = "rrkah-fqaaa-aaaaa-aaaaq-cai"; // The management canister ID.
    let principal = Principal::from_text(cid_string).expect("Could not decode the principal.");
    let res: Vec<u8> = agent
        .query(&principal, "say_hi")
        .with_arg(&Encode!()?)
        .call()
        .await?;
    let mut de = candid::de::IDLDeserialize::new(&res)?;
    dbg!(de.get_value::<String>().unwrap());

    test_add_user_secrets().await?;
    Ok(())
}

async fn test_add_user_secrets() -> Result<(), Box<dyn std::error::Error>> {
    let test_user1 = User::new_random(1);
    let test_user2 = User::new_random(2);

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
    Ok(())
}
