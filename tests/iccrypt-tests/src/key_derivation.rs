use anyhow::Result;
use candid::{Encode, Principal};
use ic_agent::{identity::BasicIdentity, Agent, Identity};
use openssl::{
    pkey::{Private, Public},
    rsa::{Padding, Rsa},
};

use crate::common::{create_identity, get_dfx_agent_with_identity, get_iccrypt_backend_canister};
pub async fn test_key_derivation() -> Result<()> {
    // test the phase I self encryption
    self_encryption().await?;
    Ok(())
}

async fn self_encryption() -> Result<()> {
    let canister = get_iccrypt_backend_canister();

    // create identities (keypairs) and the corresponding senders (principals)
    let alice = "Alice";
    let eve = "Eve";
    let identity_alice: BasicIdentity = create_identity();
    let principal_alice: Principal = identity_alice.sender().unwrap();
    let agent_alice: Agent = get_dfx_agent_with_identity(identity_alice).await?;

    let identity_eve: BasicIdentity = create_identity();
    let principal_eve: Principal = identity_eve.sender().unwrap();
    let agent_eve: Agent = get_dfx_agent_with_identity(identity_eve).await?;

    // get encryption key for alice
    let res: Vec<u8> = agent_alice
        .update(&canister, "get_encryption_key_for")
        // .with_arg(&Encode!(&principal.to_string())?)
        .with_arg(&Encode!(&alice)?)
        .call_and_wait()
        .await
        .unwrap();

    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let enc_key_alice: Rsa<Public>;
    if let Some(enc_key) = res_deserialized.get_value::<Option<Vec<u8>>>().unwrap() {
        enc_key_alice = openssl::rsa::Rsa::public_key_from_pem(&enc_key).unwrap();
    } else {
        return Err(anyhow::format_err!("Failed getting encryption key"));
    }

    // let's encrypt a message
    let secret_alice = "This is my super secret";
    //let buffer_len = encrypter.encrypt_len(data).unwrap();
    let mut encrypted_secret: Vec<u8> = vec![0; enc_key_alice.size() as usize];
    enc_key_alice
        .public_encrypt(
            secret_alice.as_bytes(),
            &mut encrypted_secret,
            Padding::PKCS1,
        )
        .unwrap();

    dbg!(&encrypted_secret);

    // get decryption key for alice
    let res: Vec<u8> = agent_alice
        .update(&canister, "get_decryption_key_from")
        .with_arg(&Encode!(&alice)?)
        .call_and_wait()
        .await
        .unwrap();

    res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let dec_key_alice: Rsa<Private>;
    if let Some(dec_key) = res_deserialized.get_value::<Option<Vec<u8>>>().unwrap() {
        dec_key_alice = openssl::rsa::Rsa::private_key_from_pem(&dec_key).unwrap();
    } else {
        return Err(anyhow::format_err!("Failed getting decryption key"));
    }
    let mut decrypted_secret: Vec<u8> = vec![0; dec_key_alice.size() as usize];
    let x = dec_key_alice
        .private_decrypt(&encrypted_secret, &mut decrypted_secret, Padding::PKCS1)
        .unwrap();

    dbg!(String::from_utf8(decrypted_secret).unwrap());

    Ok(())
}
