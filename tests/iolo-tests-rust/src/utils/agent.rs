use anyhow::Result;
use candid::{CandidType, Encode, Principal};
use ic_agent::{identity::BasicIdentity, Agent};
use serde::de;

use super::dfx::get_backend_canister_id;

pub const URL: &str = "http://localhost:4943/";
// pub const IOLO_BACKEND_CANISTER_ID: &str = "bw4dl-smaaa-aaaaa-qaacq-cai";
pub const _MY_CALLER_ID: &str = "2vxsx-fae";

pub enum CallType {
    Query(String),
    Update(String),
}

/// Make a call to the internet computer (i.e. the local replica)
pub async fn make_call_with_default_agent<T, A>(ct: CallType, arg: Option<A>) -> Result<T>
where
    T: for<'de> de::Deserialize<'de> + CandidType,
    A: CandidType,
{
    let agent = get_default_dfx_agent().await.unwrap();
    make_call_with_agent(&agent, ct, arg).await
}

/// Make a call to the internet computer (i.e. the local replica)
pub async fn make_call_with_agent<T, A>(agent: &Agent, ct: CallType, arg: Option<A>) -> Result<T>
where
    T: for<'de> de::Deserialize<'de> + CandidType,
    A: CandidType,
{
    // let agent = get_default_dfx_agent().await.unwrap();
    let canister = get_iolo_backend_canister();

    let a: Vec<u8>;

    a = match arg {
        Some(v) => Encode!(&v)?,
        None => Encode!()?,
    };

    let res: Vec<u8> = match ct {
        CallType::Query(method_name) => {
            agent
                .query(&canister, method_name)
                .with_arg(a)
                .call()
                .await?
        }
        CallType::Update(method_name) => {
            agent
                .update(&canister, method_name)
                .with_arg(a)
                .call_and_wait()
                .await
                .unwrap_or_else(|err| {
                    println!("Error during Update: {:?}", err);
                    Vec::new() // return an empty Vec<u8> or any default value
                })
        }
    };

    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let v = res_deserialized.get_value::<T>().unwrap_or_else(|err| {
        println!("Error during deserialize: {:?}", err);
        panic!(); // return an empty Vec<u8> or any default value
    });
    Ok(v)
}

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

pub async fn get_default_dfx_agent() -> Result<Agent> {
    let agent = Agent::builder()
        .with_transport(
            ic_agent::agent::http_transport::ReqwestHttpReplicaV2Transport::create(URL)?,
        )
        .build()?;

    agent
        .fetch_root_key()
        .await
        .expect("Failed fetching root key");

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

pub fn get_iolo_backend_canister() -> Principal {
    Principal::from_text(get_backend_canister_id().unwrap())
        .expect("Could not decode the principal.")
}
