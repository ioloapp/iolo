use candid::{Encode, Principal};
use ic_agent::Agent;

use anyhow::Ok;
use xshell::{cmd, Shell};

#[tokio::test]
#[ignore]
async fn test_smart_vaults() -> anyhow::Result<()> {
    setup().expect("setup failed");

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

    cleanup().expect("cleanup failed");

    Ok(())
}

pub fn setup() -> anyhow::Result<()> {
    let sh = Shell::new()?;
    // let manifest = sh.read_file("Cargo.toml")?;
    // dbg!("hi");
    sh.change_dir("../../");
    cmd!(sh, "dfx build iccrypt_backend")
        .run()
        .unwrap_or_else(|_| {});
    cmd!(sh, "dfx canister install iccrypt_backend --mode upgrade")
        .run()
        .unwrap_or_else(|_| {});

    // cmd!(sh, "./deploy.sh local").run().unwrap_or_else(|_| {});

    // assert_eq!(1, 2);

    Ok(())
}

pub fn cleanup() -> anyhow::Result<()> {
    // let sh = Shell::new()?;
    // let manifest = sh.read_file("Cargo.toml")?;
    // cmd!(sh, "dfx start").run().unwrap_or_else(|_| {});
    // cmd!(sh, "dfx stop").run().unwrap_or_else(|_| {});

    // assert_eq!(1, 2);

    Ok(())
}
