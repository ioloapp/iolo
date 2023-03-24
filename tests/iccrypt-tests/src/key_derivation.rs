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
    // Alice
    let identity_alice: BasicIdentity = create_identity();
    let principal_alice: Principal = identity_alice.sender().unwrap();
    let agent_alice: Agent = get_dfx_agent_with_identity(identity_alice).await?;

    // Bob
    let identity_bob: BasicIdentity = create_identity();
    let principal_bob: Principal = identity_bob.sender().unwrap();
    let agent_bob: Agent = get_dfx_agent_with_identity(identity_bob).await?;

    // Eve
    let identity_eve: BasicIdentity = create_identity();
    let _principal_eve: Principal = identity_eve.sender().unwrap();
    let agent_eve: Agent = get_dfx_agent_with_identity(identity_eve).await?;

    let secret = "Fom Alice to Alice: Hey, this is my personal secret";

    println!("The original secret: \n '{}'", &secret);

    println!("\n===========================================================");
    println!("====== Happy Flow - Self encryption");
    println!("===========================================================");

    // the happy flow: self encryption for alice
    let encrypted_secret = encrypt_secret_for(&agent_alice, &principal_alice, secret).await?;
    let decrypted_secret =
        decrypt_secret_from(&agent_alice, &principal_alice, &encrypted_secret).await?;
    assert_eq!(decrypted_secret, secret);
    println!(
        "This is what Alice sees after decryption: \n '{}'",
        &decrypted_secret
    );

    println!("\n===========================================================");
    println!("====== Happy Flow - Encrypting for Bob (heir)");
    println!("===========================================================");
    let secret = "From Alice to Bob: My dear Bob. This is for you.";
    let encrypted_secret = encrypt_secret_for(&agent_alice, &principal_bob, secret).await?;
    let decrypted_secret =
        decrypt_secret_from(&agent_bob, &principal_alice, &encrypted_secret).await?;
    assert_eq!(decrypted_secret, secret);
    println!(
        "This is what Bob sees after decryption: {}",
        &decrypted_secret
    );

    // eve dropping in -> this must result in an error
    let decrypted_secret =
        decrypt_secret_from(&agent_eve, &principal_alice, &encrypted_secret).await;
    assert!(decrypted_secret.is_err());

    Ok(())
}

async fn encrypt_secret_for(agent: &Agent, recipient: &Principal, secret: &str) -> Result<Vec<u8>> {
    let canister = get_iccrypt_backend_canister();

    // get encryption key for alice
    let res: Vec<u8> = agent
        .update(&canister, "get_encryption_key_for")
        // .with_arg(&Encode!(&principal.to_string())?)
        .with_arg(&Encode!(&recipient.to_string())?)
        .call_and_wait()
        .await?;

    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let enc_key_recipient: Rsa<Public>;
    if let Some(enc_key) = res_deserialized.get_value::<Option<Vec<u8>>>()? {
        enc_key_recipient = openssl::rsa::Rsa::public_key_from_pem(&enc_key)?;
    } else {
        return Err(anyhow::format_err!("Failed getting encryption key"));
    }

    // let's encrypt a message
    let mut encrypted_secret: Vec<u8> = vec![0; enc_key_recipient.size() as usize];
    enc_key_recipient.public_encrypt(secret.as_bytes(), &mut encrypted_secret, Padding::PKCS1)?;
    Ok(encrypted_secret)
}

async fn decrypt_secret_from(
    agent: &Agent,
    sender: &Principal,
    encrypted_secret: &[u8],
) -> Result<String> {
    let canister = get_iccrypt_backend_canister();

    // get decryption key
    let res: Vec<u8> = agent
        .update(&canister, "get_decryption_key_from")
        .with_arg(&Encode!(&sender.to_string())?)
        .call_and_wait()
        .await?;

    let mut res_deserialized = candid::de::IDLDeserialize::new(&res)?;

    let decryption_key: Rsa<Private>;
    if let Some(dec_key) = res_deserialized.get_value::<Option<Vec<u8>>>()? {
        decryption_key = openssl::rsa::Rsa::private_key_from_pem(&dec_key)?;
    } else {
        return Err(anyhow::format_err!("Failed getting decryption key"));
    }

    // decrypt the secret
    let mut decrypted_secret: Vec<u8> = vec![0; decryption_key.size() as usize];
    decryption_key.private_decrypt(&encrypted_secret, &mut decrypted_secret, Padding::PKCS1)?;

    let decrypted_secret_string = String::from_utf8(decrypted_secret)?;

    Ok(decrypted_secret_string
        .trim_matches(char::from(0))
        .to_string())
}
