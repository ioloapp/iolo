use candid::candid_method;

use crate::{
    utils::threshold_key_derivation::derive_encryption_key,
    utils::threshold_key_derivation::derive_encryption_key_pem,
    utils::{caller::get_caller, threshold_key_derivation::derive_decryption_key, threshold_key_derivation::derive_decryption_key_pem},
};

use super::vetkd_types::{
    CanisterId, VetKDCurve, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDKeyId,
    VetKDPublicKeyReply, VetKDPublicKeyRequest,
};

const VETKD_SYSTEM_API_CANISTER_ID: &str = "s55qq-oqaaa-aaaaa-aaakq-cai";

// TODO: move this somewhere else?

const MASTER_KEY_ID: i32 = 1;
// Identity based encryption using IC Threshold Key Derivation
//
// THE ENCRYPTION CASE
//
// For the call to the threshold key derivation canister, we want to construct a derivation ID as follows:
// derivation_id="alice || bob", where alice (the testator) is the caller and bob is the heir.
// This id means: "alice the testator is requesting an encryption key to encrypt the vault for the heir bob".
// We get the heir (bob) as method parameter and we construct the deviration id by prepending the authenticated caller (Alice).
//
// Note: The IC Key derivation canister will finally prepend the caller, resulting in a derivation ID like
// derivation_id="iccrypt_backend || alice || bob".
#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn get_encryption_key_for(heir: String) -> Option<Vec<u8>> {
    let mut derivation_id: String = get_caller().to_string();
    derivation_id.push_str(&heir.to_string());
    let response = derive_encryption_key(MASTER_KEY_ID, &derivation_id).await;
    response
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn get_encryption_key_pem_for(heir: String) -> Option<String> {
    let mut derivation_id: String = get_caller().to_string();
    derivation_id.push_str(&heir.to_string());
    let response = derive_encryption_key_pem(MASTER_KEY_ID, &derivation_id).await;
    response
}
// Identity based encryption using IC Threshold Key Derivation
//
// THE DECRYPTION CASE
//
// For the call to the threshold key derivation canister, we want to construct a derivation ID as follows:
// derivation_id="alice || bob", where bob (the heir) is the caller and Alice is the testator.
// This id means: "Bob the heir is requesting a decryption key to decrypt a vault which has been encrypted for him by Alice the testator".
// We get the heir (bob) as method parameter and we construct the deviration id by prepending the authenticated caller (Alice).
//
// Note: The IC Key derivation canister will finally prepend the caller, resulting in a derivation ID like
// derivation_id="iccrypt_backend || alice || bob".
#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn get_decryption_key_from(testator: String) -> Option<Vec<u8>> {
    let mut derivation_id: String = testator.to_string();
    derivation_id.push_str(&get_caller().to_string());
    derive_decryption_key(MASTER_KEY_ID, &derivation_id).await
}

#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn get_decryption_key_pem_from(testator: String) -> Option<String> {
    let mut derivation_id: String = testator.to_string();
    derivation_id.push_str(&get_caller().to_string());
    derive_decryption_key_pem(MASTER_KEY_ID, &derivation_id).await
}

// VETKD by DFINITY
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

#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn get_encrypted_symmetric_key_for(encryption_public_key: Vec<u8>) -> String {
    ic_cdk::println!("Caller: {}", ic_cdk::caller());
    let derivation_id: Vec<u8> = ic_cdk::caller().as_slice().to_vec();
    //let addition = String::from("additionalDerivationIdString");
    //derivation_id.extend(addition.into_bytes());

    let request = VetKDEncryptedKeyRequest {
        derivation_id,
        //derivation_id: ic_cdk::caller().as_slice().to_vec(),
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

fn bls12_381_test_key_1() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381,
        name: "test_key_1".to_string(),
    }
}

fn vetkd_system_api_canister_id() -> CanisterId {
    //CanisterId::from_str(VETKD_SYSTEM_API_CANISTER_ID).expect("failed to create canister ID")
    CanisterId::from_text(VETKD_SYSTEM_API_CANISTER_ID).expect("failed to create canister ID")
}