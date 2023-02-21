#![allow(dead_code)]
use crate::common::{get_dfx_agent, get_iccrypt_backend_canister};
use pretty_assertions::{assert_eq};

use anyhow::Ok;
use anyhow::Result;
use candid::Encode;

pub async fn test_utils() -> Result<()> {
    dbg!("Testing the utils function");
    dbg!(itest_utils_caller().await?);
    dbg!(itest_utils_uuid().await?);
    dbg!(itest_utils_time().await?);
    Ok(())
}

async fn itest_utils_caller() -> Result<String> {
    let agent = get_dfx_agent().unwrap();
    let canister = get_iccrypt_backend_canister();
    let res: Vec<u8> = agent
        .query(&canister, "who_am_i")
        .with_arg(&Encode!()?)
        .call()
        .await?;
    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;
    let caller: String = res_deserialized.get_value::<String>().unwrap();
    Ok(caller)
}

async fn itest_utils_time() -> Result<u64> {
    let agent = get_dfx_agent().unwrap();
    let canister = get_iccrypt_backend_canister();
    let res: Vec<u8> = agent
        .query(&canister, "what_time_is_it")
        .with_arg(&Encode!()?)
        .call()
        .await?;
    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;
    let time: u64 = res_deserialized.get_value::<u64>().unwrap();
    Ok(time)
}

async fn itest_utils_uuid() -> Result<String> {
    let agent = get_dfx_agent().unwrap();
    agent.fetch_root_key().await?;
    let canister = get_iccrypt_backend_canister();
    let res: Vec<u8> = agent
        .update(&canister, "give_me_a_new_uuid")
        .with_arg(&Encode!()?)
        .call_and_wait()
        .await
        .unwrap();
    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;
    let uuid: String = res_deserialized.get_value::<String>().unwrap();
    assert_eq!(uuid.chars().nth(8).unwrap(), '-');
    assert_eq!(uuid.chars().nth(13).unwrap(), '-');
    assert_eq!(uuid.chars().nth(18).unwrap(), '-');
    assert_eq!(uuid.chars().nth(23).unwrap(), '-');
    Ok(uuid)
}
