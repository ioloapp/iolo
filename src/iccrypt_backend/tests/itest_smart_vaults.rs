use anyhow::Ok;
use anyhow::Result;
use candid::Encode;
//use xshell::{cmd, Shell};

use crate::common::get_dfx_agent;
use crate::common::get_iccrypt_backend_canister;

mod common;

#[tokio::test]
async fn itest_smart_vaults() -> Result<()> {
    // TODO
    Ok(())
}

#[tokio::test]
async fn itest_utils_caller() -> Result<()> {
    let agent = get_dfx_agent().unwrap();
    let canister = get_iccrypt_backend_canister();
    let res: Vec<u8> = agent
        .query(&canister, "who_am_i")
        .with_arg(&Encode!()?)
        .call()
        .await?;
    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;
    let caller: String = res_deserialized.get_value::<String>().unwrap();
    dbg!(&caller);
    Ok(())
}

#[tokio::test]
async fn itest_utils_time() -> Result<()> {
    let agent = get_dfx_agent().unwrap();
    let canister = get_iccrypt_backend_canister();
    let res: Vec<u8> = agent
        .query(&canister, "what_time_is_it")
        .with_arg(&Encode!()?)
        .call()
        .await?;
    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;
    let time: u64 = res_deserialized.get_value::<u64>().unwrap();
    dbg!(&time);
    Ok(())
}

// #[tokio::test]
// async fn itest_utils_random() -> Result<()> {
//     let agent = get_dfx_agent().unwrap();
//     let canister = get_iccrypt_backend_canister();
//     let res: Vec<u8> = agent
//         .update(&canister, "give_me_a_new_uuid")
//         .with_arg(&Encode!()?)
//         .call_and_wait()
//         .await?;
//     let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;
//     let uuid: String = res_deserialized.get_value::<String>().unwrap();
//     dbg!(&uuid);
//     Ok(())
// }
