use anyhow::Result;
use candid::{Encode, Principal};
use ic_agent::{identity::BasicIdentity, Agent, Identity};
use openssl::{
    encrypt::Encrypter,
    pkey::Public,
    rsa::{Padding, Rsa},
};

use crate::common::{create_identity, get_dfx_agent_with_identity, get_iccrypt_backend_canister};
pub async fn test_key_derivation() -> Result<()> {
    let canister = get_iccrypt_backend_canister();

    // create identities (keypairs) and the corresponding senders (principals)
    let identity: BasicIdentity = create_identity();
    let principal: Principal = identity.sender().unwrap();
    let agent: Agent = get_dfx_agent_with_identity(identity).await?;

    // get encryption key
    let res: Vec<u8> = agent
        .update(&canister, "get_encryption_key_for")
        // .with_arg(&Encode!(&principal.to_string())?)
        .with_arg(&Encode!(&"Bob")?)
        .call_and_wait()
        .await
        .unwrap();

    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let pk: Rsa<Public>;
    if let Some(enc_key) = res_deserialized.get_value::<Option<Vec<u8>>>().unwrap() {
        let encryption_key = enc_key;
        pk = openssl::rsa::Rsa::public_key_from_pem(&encryption_key).unwrap();
    } else {
        return Err(anyhow::format_err!("Failed getting encryption key"));
    }

    // let's encrypt a message
    let data = b"hello, bob, i hope you are doing well!";
    //let buffer_len = encrypter.encrypt_len(data).unwrap();
    let mut encrypted_message = vec![0; 1024];
    let enc_res = pk.public_encrypt(data, &mut encrypted_message, Padding::PKCS1);

    dbg!(enc_res);
    dbg!(&encrypted_message);

    // get decryption key
    let res: Vec<u8> = agent
        .update(&canister, "get_decryption_key_from")
        .with_arg(&Encode!(&principal.to_string())?)
        .call_and_wait()
        .await
        .unwrap();

    res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let decryption_key: Vec<u8>;
    if let Some(dec_key) = res_deserialized.get_value::<Option<Vec<u8>>>().unwrap() {
        decryption_key = dec_key;
    } else {
        return Err(anyhow::format_err!("Failed getting decryption key"));
    }

    Ok(())
}
