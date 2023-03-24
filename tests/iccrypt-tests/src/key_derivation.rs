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
    // create identities (keypairs) and the corresponding senders (principals)
    let alice = "Alice";
    let eve = "Eve";
    let identity_alice: BasicIdentity = create_identity();
    let principal_alice: Principal = identity_alice.sender().unwrap();
    let agent_alice: Agent = get_dfx_agent_with_identity(identity_alice).await?;
    let identity_eve: BasicIdentity = create_identity();
    let principal_eve: Principal = identity_eve.sender().unwrap();
    let agent_eve: Agent = get_dfx_agent_with_identity(identity_eve).await?;

    let secret = "hey, this is my secret. how is life my dear friend?";

    println!("The original secfet: {}", &secret);

    // the happy flow: self encryption for alice
    let encrypted_secret = encrypt_secret_for(&agent_alice, alice, secret).await?;
    let decrypted_secret = decrypt_secret_from(&agent_alice, alice, &encrypted_secret).await?;
    println!(
        "This is what Alice sees after decryption: {}",
        &decrypted_secret
    );

    // eve dropping in
    let decrypted_secret = decrypt_secret_from(&agent_eve, alice, &encrypted_secret).await?;
    println!(
        "This is what Eve sees after decryption: {}",
        &decrypted_secret
    );

    Ok(())
}

async fn encrypt_secret_for(agent: &Agent, recipient: &str, secret: &str) -> Result<Vec<u8>> {
    let canister = get_iccrypt_backend_canister();

    // get encryption key for alice
    let res: Vec<u8> = agent
        .update(&canister, "get_encryption_key_for")
        // .with_arg(&Encode!(&principal.to_string())?)
        .with_arg(&Encode!(&recipient)?)
        .call_and_wait()
        .await
        .unwrap();

    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let enc_key_recipient: Rsa<Public>;
    if let Some(enc_key) = res_deserialized.get_value::<Option<Vec<u8>>>().unwrap() {
        enc_key_recipient = openssl::rsa::Rsa::public_key_from_pem(&enc_key).unwrap();
    } else {
        return Err(anyhow::format_err!("Failed getting encryption key"));
    }

    // dbg!(&enc_key_recipient.public_key_to_der());

    // let's encrypt a message
    let mut encrypted_secret: Vec<u8> = vec![0; enc_key_recipient.size() as usize];
    enc_key_recipient
        .public_encrypt(secret.as_bytes(), &mut encrypted_secret, Padding::PKCS1)
        .unwrap();
    Ok(encrypted_secret)
}

async fn decrypt_secret_from(
    agent: &Agent,
    sender: &str,
    encrypted_secret: &[u8],
) -> Result<String> {
    let canister = get_iccrypt_backend_canister();

    // get decryption key
    let res: Vec<u8> = agent
        .update(&canister, "get_decryption_key_from")
        .with_arg(&Encode!(&sender)?)
        .call_and_wait()
        .await
        .unwrap();

    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let decryption_key: Rsa<Private>;
    if let Some(dec_key) = res_deserialized.get_value::<Option<Vec<u8>>>().unwrap() {
        decryption_key = openssl::rsa::Rsa::private_key_from_pem(&dec_key).unwrap();
    } else {
        return Err(anyhow::format_err!("Failed getting decryption key"));
    }

    // decrypt the secret
    let mut decrypted_secret: Vec<u8> = vec![0; decryption_key.size() as usize];
    let x = decryption_key
        .private_decrypt(&encrypted_secret, &mut decrypted_secret, Padding::PKCS1)
        .unwrap();

    Ok(String::from_utf8(decrypted_secret).unwrap())
}
