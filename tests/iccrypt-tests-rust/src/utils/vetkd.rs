use aes_gcm::{
    aead::{generic_array::GenericArray, Aead, OsRng},
    AeadCore, Aes256Gcm, KeyInit,
};
use anyhow::Result;

use candid::Principal;
use ic_agent::Agent;
use ring::rand::{SecureRandom, SystemRandom};

use crate::{
    types::{secret::UUID, testament::TestamentKeyDerviationArgs},
    utils::{
        agent::{
            get_default_dfx_agent, make_call_with_agent, make_call_with_default_agent, CallType,
        },
        dfx::get_backend_canister_id,
    },
};

pub async fn get_local_random_aes_256_gcm_key() -> Result<Vec<u8>> {
    let key = Aes256Gcm::generate_key(OsRng);
    Ok(key.to_vec())
}

pub async fn aes_gcm_encrypt(message: &[u8], raw_key: &[u8]) -> Result<(Vec<u8>, [u8; 12])> {
    let key = GenericArray::clone_from_slice(&raw_key);
    let cipher = Aes256Gcm::new(&key);
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng); // 96-bits; unique per message
    let ciphertext = cipher.encrypt(&nonce, message.as_ref()).unwrap();
    Ok((ciphertext, nonce.into()))
}

pub async fn aes_gcm_decrypt(
    ciphertext: &[u8],
    raw_key: &[u8],
    nonce: [u8; 12],
) -> Result<Vec<u8>> {
    let key = GenericArray::clone_from_slice(&raw_key);
    let cipher = Aes256Gcm::new(&key);
    let plaintext = cipher.decrypt(&nonce.into(), ciphertext.as_ref()).unwrap();
    Ok(plaintext)
}

/// Get a new key from the VETKD api using the caller as the derivation ID
pub async fn get_aes_256_gcm_key_for_uservault() -> Result<Vec<u8>> {
    let rng = SystemRandom::new();
    let mut seed = [0u8; 32]; // An array of 8-bit unsigned integers, length 32
    rng.fill(&mut seed)?;

    // The TransportSecretKey (tsk) is used by the backend to encrypt the vetkd key.
    let tsk = ic_vetkd_utils::TransportSecretKey::from_seed(seed.to_vec()).unwrap();

    // We ask the backend for a new symmetric key and also ask it to encrypt it using the public key of our transport secret key
    let ek_bytes_hex: String = make_call_with_default_agent(
        CallType::Update("encrypted_symmetric_key_for_uservault".to_string()),
        Some(tsk.public_key()),
    )
    .await?;

    // now we need the verification key
    let pk_bytes_hex: String = make_call_with_default_agent(
        CallType::Update("symmetric_key_verification_key".to_string()),
        Option::<Vec<u8>>::None,
    )
    .await?;

    // The derivation ID used in the backend is based on the caller, which in this case
    // is the agent used here to make the call.
    let did = get_default_dfx_agent().await?.get_principal().unwrap();

    let aes_256_gcm_key = tsk
        .decrypt_and_hash(
            &hex::decode(ek_bytes_hex).unwrap(),
            &hex::decode(pk_bytes_hex).unwrap(),
            did.as_slice(),
            32,
            "aes-256-gcm".as_bytes(),
        )
        .unwrap();

    // let Ok(value) = key else {
    //     println!("Error occurred: {:?}", key.unwrap_err());
    //     panic!();
    // };

    Ok(aes_256_gcm_key)
}

/// Get a new key from the VETKD api using the following two variables for the derivation
/// 1) id of the backend (iccrypt_backend)
/// 2) id of the testament
pub async fn get_aes_256_gcm_key_for_testament(testament_id: UUID) -> Result<Vec<u8>> {
    let rng = SystemRandom::new();
    let mut seed = [0u8; 32]; // An array of 8-bit unsigned integers, length 32
    rng.fill(&mut seed)?;

    // The TransportSecretKey (tsk) is used by the backend to encrypt the vetkd key.
    let tsk = ic_vetkd_utils::TransportSecretKey::from_seed(seed.to_vec()).unwrap();

    let tkda: TestamentKeyDerviationArgs = TestamentKeyDerviationArgs {
        encryption_public_key: tsk.public_key(),
        testament_id: testament_id.clone(),
    };

    // We ask the backend for a new symmetric key and also ask it to encrypt it using the public key of our transport secret key
    let ek_bytes_hex_testament: String = make_call_with_default_agent(
        CallType::Update("encrypted_symmetric_key_for_testament".to_string()),
        Some(tkda),
    )
    .await?;

    // now we need the verification key
    let pk_bytes_hex_testament: String = make_call_with_default_agent(
        CallType::Update("symmetric_key_verification_key".to_string()),
        Option::<Vec<u8>>::None,
    )
    .await?;

    // the derivation id used by the backend consists of the backend canister principal id and the testament id.
    // -> We need to have the same derivation ID locally as well -> we need the principal of the backend canister.
    let backend_principal = Principal::from_text(get_backend_canister_id().unwrap()).unwrap();
    let mut derivation_id: Vec<u8> = backend_principal.as_slice().to_vec();
    derivation_id.extend_from_slice(&testament_id.0.to_string().as_bytes().to_vec());

    // this is the final testament vetkd encryption key
    let aes_256_gcm_key = tsk
        .decrypt_and_hash(
            &hex::decode(ek_bytes_hex_testament).unwrap(),
            &hex::decode(pk_bytes_hex_testament).unwrap(),
            derivation_id.as_slice(),
            32,
            "aes-256-gcm".as_bytes(),
        )
        .unwrap();

    Ok(aes_256_gcm_key)
}

pub async fn ibe_encrypt_for_heir(message: &[u8], ibe_principal: &Principal) -> Result<Vec<u8>> {
    let pk_bytes_hex: String = make_call_with_default_agent(
        CallType::Update("ibe_encryption_key".to_string()),
        Option::<Vec<u8>>::None,
    )
    .await?;

    let rng = SystemRandom::new();
    let mut seed = [0u8; 32]; // An array of 8-bit unsigned integers, length 32
    rng.fill(&mut seed)?;

    let ibe_ciphertext = ic_vetkd_utils::IBECiphertext::encrypt(
        &hex::decode(pk_bytes_hex).unwrap(),
        ibe_principal.as_slice(),
        message,
        &seed,
    )
    .unwrap();

    // Ok(hex::encode(ibe_ciphertext.serialize()))
    Ok(ibe_ciphertext.serialize())
}

pub async fn ibe_decrypt(agent: &Agent, ibe_ciphertext: &[u8]) -> anyhow::Result<Vec<u8>> {
    let rng = SystemRandom::new();
    let mut seed = [0u8; 32]; // An array of 8-bit unsigned integers, length 32
    rng.fill(&mut seed)?;

    // The TransportSecretKey (tsk) is used by the backend to encrypt the vetkd key.
    let tsk = ic_vetkd_utils::TransportSecretKey::from_seed(seed.to_vec()).unwrap();

    // We ask the backend for a new symmetric key and also ask it to encrypt it using the public key of our transport secret key
    let ek_bytes_hex: String = make_call_with_agent(
        &agent,
        CallType::Update("encrypted_ibe_decryption_key_for_caller".to_string()),
        Some(tsk.public_key()),
    )
    .await?;

    // now we need the verification key
    let pk_bytes_hex: String = make_call_with_agent(
        &agent,
        CallType::Update("ibe_encryption_key".to_string()),
        Option::<Vec<u8>>::None,
    )
    .await?;

    let did = agent.get_principal().unwrap();

    let k_bytes = tsk
        .decrypt(
            &hex::decode(ek_bytes_hex).unwrap(),
            &hex::decode(pk_bytes_hex).unwrap(),
            did.as_slice(),
        )
        .unwrap();

    let ibe_ciphertext = ic_vetkd_utils::IBECiphertext::deserialize(&ibe_ciphertext).unwrap();
    let ibe_plaintext = ibe_ciphertext.decrypt(&k_bytes).unwrap();
    Ok(ibe_plaintext)
}
