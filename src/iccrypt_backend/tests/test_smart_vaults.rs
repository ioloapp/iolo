use candid::{Encode, Principal};
use ic_agent::Agent;

use iccrypt_backend;
use iccrypt_backend::smart_vaults::secret::Secret;
use iccrypt_backend::smart_vaults::smart_vault::{
    add_user_secret, get_user_safe, update_user_secret,
};
use iccrypt_backend::users::user::User;

use anyhow::Ok;

use crate::common::setup;
use crate::test_data::{TEST_SECRET_1, TEST_SECRET_2, TEST_SECRET_3, TEST_SECRET_4};

mod common;
pub mod test_data;

#[tokio::test]
async fn test_smart_vaults() -> anyhow::Result<()> {
    // setup().expect("setup failed");

    let url = "http://localhost:4943/";

    let agent = Agent::builder()
        .with_transport(
            ic_agent::agent::http_transport::ReqwestHttpReplicaV2Transport::create(url)?,
        )
        .build()?;
    let cid_string = "rrkah-fqaaa-aaaaa-aaaaq-cai"; // The ic crypt backend canister ID.
    let principal = Principal::from_text(cid_string).expect("Could not decode the principal.");
    let res: Vec<u8> = agent
        .query(&principal, "say_hi")
        .with_arg(&Encode!()?)
        .call()
        .await?;
    let mut de = candid::de::IDLDeserialize::new(&res)?;
    dbg!(de.get_value::<String>().unwrap());

    // test_user_secrets_crud().await?;

    // cleanup().expect("cleanup failed");

    Ok(())
}

async fn test_user_secrets_crud() -> anyhow::Result<()> {
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
    let user1_secrets = get_user_safe(test_user1.get_id()).get_secrets();
    let user2_secrets = get_user_safe(test_user2.get_id()).get_secrets();
    assert_eq!(user1_secrets.keys().len(), 2);
    assert_eq!(user2_secrets.keys().len(), 2);

    // check rightful owner of secrets within user safe
    for (_, secret) in user1_secrets.into_iter() {
        assert_eq!(secret.get_owner(), test_user1.get_id());
    }

    for (_, secret) in user2_secrets.into_iter() {
        assert_eq!(secret.get_owner(), test_user2.get_id());
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

    Ok(())
}

async fn test_ic_is_up() -> anyhow::Result<()> {
    Ok(())
}
