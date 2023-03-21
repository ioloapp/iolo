use anyhow::Result;
use candid::{Encode, Principal};

use crate::common::{get_default_dfx_agent, get_iccrypt_backend_canister, MY_CALLER_ID};
pub async fn test_key_derivation() -> Result<()> {
    let user = Principal::from_text(MY_CALLER_ID).expect("Could not decode the principal.");
    let agent = get_default_dfx_agent().unwrap();
    agent.fetch_root_key().await?;
    let canister = get_iccrypt_backend_canister();

    // get encryption key
    let res: Vec<u8> = agent
        .update(&canister, "get_encryption_key_for")
        //.with_arg(&Encode!(&user)?)
        .with_arg(&Encode!(&user)?)
        .call_and_wait()
        .await
        .unwrap();

    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let encryption_key: Vec<u8>;
    if let Some(enc_key) = res_deserialized.get_value::<Option<Vec<u8>>>().unwrap() {
        // dbg!("yes");
        // dbg!(&enc_key);
        encryption_key = enc_key;
        let pk = openssl::rsa::Rsa::public_key_from_pem(&encryption_key).unwrap();
        // dbg!("yeah, that works: {}", &pk.public_key_to_pem());
    } else {
        return Err(anyhow::format_err!("Failed getting encryption key"));
    }
    // dbg!("okay");
    // dbg!(&encryption_key);

    // get decryption key
    let res: Vec<u8> = agent
        .update(&canister, "get_decryption_key_from")
        .with_arg(&Encode!(&user)?)
        .call_and_wait()
        .await
        .unwrap();

    res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let decryption_key: Vec<u8>;
    if let Some(dec_key) = res_deserialized.get_value::<Option<Vec<u8>>>().unwrap() {
        // dbg!("yes");
        // dbg!(&dec_key);
        decryption_key = dec_key;
    } else {
        return Err(anyhow::format_err!("Failed getting decryption key"));
    }
    // dbg!("okay, got decryption key");
    // dbg!(&decryption_key);

    Ok(())
}
