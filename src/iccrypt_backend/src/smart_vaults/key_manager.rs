use std::{str::FromStr, vec};

use candid::{candid_method, CandidType};
use serde::{Deserialize, Serialize};

use super::vetkd_types::{
    CanisterId, VetKDCurve, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDKeyId,
    VetKDPublicKeyReply, VetKDPublicKeyRequest,
};

const VETKD_SYSTEM_API_CANISTER_ID: &str = "s55qq-oqaaa-aaaaa-aaakq-cai";

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct TestamentKeyDerviationArgs {
    pub encryption_public_key: Vec<u8>,
    pub testament_id: String,
}

/// Computes a fresh vetkd symmetric key to encrypt the secrets in a user vault.
///
/// It uses the caller and a random Nonce value provided by the front-end.
///
/// The key is encrypted using the provided encryption_publi_key.
#[ic_cdk_macros::update]
#[candid_method(update)]
async fn encrypted_symmetric_key_for_uservault(encryption_public_key: Vec<u8>) -> String {
    // debug_println_caller("encrypted_symmetric_key_for_caller");

    let request = VetKDEncryptedKeyRequest {
        derivation_id: ic_cdk::caller().as_slice().to_vec(),
        public_key_derivation_path: vec![b"symmetric_key".to_vec()],
        key_id: bls12_381_test_key_1(),
        encryption_public_key,
    };

    let (response,): (VetKDEncryptedKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_encrypted_key",
        (request,),
    )
    .await
    .expect("call to vetkd_encrypted_key failed");

    hex::encode(response.encrypted_key)
}

/// Computes a fresh vetkd symmetric key to encrypt the secrets in a testament.
///
/// The key is encrypted using the provided encryption_publi_key.
#[ic_cdk_macros::update]
#[candid_method(update)]
async fn encrypted_symmetric_key_for_testament(args: TestamentKeyDerviationArgs) -> String {
    ic_cdk::println!(
        "encrypted_symmetric_key_for_testament with testament id: {:?}",
        &args.testament_id,
    );

    let caller = ic_cdk::caller(); //.as_slice().to_vec();

    // check if caller has the right to derive this key
    let caller_is_testator = true; // TODO
    let caller_is_heir = true; // TODO

    if !(caller_is_testator || caller_is_heir) {
        ic_cdk::trap(&format!(
            "Caller {:?} is not allowed to see testament {:?}",
            caller, &args.testament_id
        ));
    }

    ic_cdk::println!("{:?}", ic_cdk::id());
    ic_cdk::println!("{:?}", ic_cdk::id().to_string());
    ic_cdk::println!("{:?}", ic_cdk::id().as_slice());
    ic_cdk::println!("{:?}", ic_cdk::id().as_slice().to_vec());
    /*let mut derivation_id: Vec<u8> = ic_cdk::id().as_slice().to_vec();
    ic_cdk::println!(
        "backend id: {:?}, {:?}",
        ic_cdk::id().to_string(),
        &derivation_id,
    );

    derivation_id.extend_from_slice(&args.testament_id.as_bytes());
    ic_cdk::println!(
        "testament id: {:?}",
        &args.testament_id.as_bytes()
    );*/

    let derivation_id = args.testament_id.as_bytes().to_vec();

    let request = VetKDEncryptedKeyRequest {
        derivation_id,
        public_key_derivation_path: vec![b"symmetric_key".to_vec()],
        key_id: bls12_381_test_key_1(),
        encryption_public_key: args.encryption_public_key,
    };

    let (response,): (VetKDEncryptedKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_encrypted_key",
        (request,),
    )
    .await
    .expect("call to vetkd_encrypted_key failed");

    hex::encode(response.encrypted_key)
}

/*
    The verification key is used for authenticating that the symmetric key or the data has not
    been tampered with and is indeed generated or approved by a the IC API.

    Tobi: I assume this is part of some sort of digital signature verification or message
    authentication code (MAC) checking. To be verified.
*/
#[ic_cdk_macros::update]
#[candid_method(update)]
async fn symmetric_key_verification_key() -> String {
    let request = VetKDPublicKeyRequest {
        canister_id: None,
        derivation_path: vec![b"symmetric_key".to_vec()],
        key_id: bls12_381_test_key_1(),
    };

    let (response,): (VetKDPublicKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_public_key",
        (request,),
    )
    .await
    .expect("call to vetkd_public_key failed");

    hex::encode(response.public_key)
}

/// The key is encrypted using the provided encryption_publi_key.
#[ic_cdk_macros::update]
#[candid_method(update)]
async fn encrypted_symmetric_key_for_caller(encryption_public_key: Vec<u8>) -> String {
    // debug_println_caller("encrypted_symmetric_key_for_caller");

    let request = VetKDEncryptedKeyRequest {
        derivation_id: ic_cdk::caller().as_slice().to_vec(),
        public_key_derivation_path: vec![b"symmetric_key".to_vec()],
        key_id: bls12_381_test_key_1(),
        encryption_public_key,
    };

    let (response,): (VetKDEncryptedKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_encrypted_key",
        (request,),
    )
    .await
    .expect("call to vetkd_encrypted_key failed");

    hex::encode(response.encrypted_key)
}

#[ic_cdk_macros::update]
#[candid_method(update)]
async fn ibe_encryption_key() -> String {
    let request = VetKDPublicKeyRequest {
        canister_id: None,
        derivation_path: vec![b"ibe_encryption".to_vec()],
        key_id: bls12_381_test_key_1(),
    };

    let (response,): (VetKDPublicKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_public_key",
        (request,),
    )
    .await
    .expect("call to vetkd_public_key failed");

    hex::encode(response.public_key)
}

#[ic_cdk_macros::update]
#[candid_method(update)]
async fn encrypted_ibe_decryption_key_for_caller(encryption_public_key: Vec<u8>) -> String {
    // debug_println_caller("encrypted_ibe_decryption_key_for_caller");

    let request = VetKDEncryptedKeyRequest {
        derivation_id: ic_cdk::caller().as_slice().to_vec(),
        public_key_derivation_path: vec![b"ibe_encryption".to_vec()],
        key_id: bls12_381_test_key_1(),
        encryption_public_key,
    };

    let (response,): (VetKDEncryptedKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_encrypted_key",
        (request,),
    )
    .await
    .expect("call to vetkd_encrypted_key failed");

    hex::encode(response.encrypted_key)
}

fn bls12_381_test_key_1() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381,
        name: "test_key_1".to_string(),
    }
}

fn vetkd_system_api_canister_id() -> CanisterId {
    CanisterId::from_str(VETKD_SYSTEM_API_CANISTER_ID).expect("failed to create canister ID")
}
