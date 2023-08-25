use anyhow::Result;
use candid::Principal;
use ic_agent::{identity::BasicIdentity, Agent};
use xshell::{cmd, Shell};

const URL: &str = "http://localhost:4943/";
const ICCRYPT_BACKEND_CANISTER_ID: &str = "rrkah-fqaaa-aaaaa-aaaaq-cai";
pub const MY_CALLER_ID: &str = "2vxsx-fae";

pub async fn get_dfx_agent_with_identity(identity: BasicIdentity) -> Result<Agent> {
    let agent = Agent::builder()
        .with_transport(
            ic_agent::agent::http_transport::ReqwestHttpReplicaV2Transport::create(URL)?,
        )
        .with_identity(identity)
        .build()?;

    agent
        .fetch_root_key()
        .await
        .expect("Failed fetching root key");
    Ok(agent)
}

pub fn get_default_dfx_agent() -> Result<Agent> {
    let agent = Agent::builder()
        .with_transport(
            ic_agent::agent::http_transport::ReqwestHttpReplicaV2Transport::create(URL)?,
        )
        .build()?;

    Ok(agent)
}

pub fn create_identity() -> BasicIdentity {
    let rng = ring::rand::SystemRandom::new();
    let key_pair = ring::signature::Ed25519KeyPair::generate_pkcs8(&rng)
        .expect("Could not generate a key pair.");

    ic_agent::identity::BasicIdentity::from_key_pair(
        ring::signature::Ed25519KeyPair::from_pkcs8(key_pair.as_ref())
            .expect("Could not read the key pair."),
    )
}

pub fn get_iccrypt_backend_canister() -> Principal {
    Principal::from_text(ICCRYPT_BACKEND_CANISTER_ID).expect("Could not decode the principal.")
}

#[allow(dead_code)]
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

#[allow(dead_code)]
pub fn cleanup() -> anyhow::Result<()> {
    let sh = Shell::new()?;
    sh.change_dir("../../");
    cmd!(sh, "./deploy.sh local").run().unwrap_or_else(|_| {});
    Ok(())
}

#[allow(dead_code)]
pub fn upgrade_canister(canister: String) -> anyhow::Result<()> {
    let c: &str;
    if canister == "all" {
        c = "--all";
    } else {
        c = &canister;
    }

    let sh = Shell::new()?;
    sh.change_dir("../../");

    cmd!(sh, "dfx canister create {c}").run().unwrap();
    cmd!(sh, "dfx build {c}").run().unwrap();
    cmd!(sh, "dfx canister install {c} --mode upgrade")
        .run()
        .unwrap();
    Ok(())
}
