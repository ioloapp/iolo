use candid::candid_method;

use super::vetkd_types::{
    CanisterId, VetKDCurve, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDKeyId,
    VetKDPublicKeyReply, VetKDPublicKeyRequest,
};

const VETKD_SYSTEM_API_CANISTER_ID: &str = "s55qq-oqaaa-aaaaa-aaakq-cai";

/// Computes a fresh vetkd symmetric key to encrypt a secret.
///
/// It uses the caller and a random Nonce value provided by the front-end.
///
/// The key is encrypted using the provided encryption_publi_key.
#[ic_cdk_macros::update]
#[candid_method(update)]
async fn encrypted_symmetric_key_for_secrets(
    encryption_public_key: Vec<u8>,
    nonce: Vec<u8>,
) -> (String, Vec<u8>) {
    let mut derivation_id: Vec<u8> = ic_cdk::caller().as_slice().to_vec();
    derivation_id.extend(nonce);
    let request = VetKDEncryptedKeyRequest {
        derivation_id: derivation_id.clone(),
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

    (hex::encode(response.encrypted_key), derivation_id)
}

/// Computes a fresh vetkd symmetric key to encrypt the encryption keys used to
/// encrypt the different secrets in a UserVault
///
/// It uses the caller as the derivation_id
///
/// The key is encrypted using the provided encryption_publi_key.
#[ic_cdk_macros::update]
#[candid_method(update)]
async fn encrypted_symmetric_key_for_uservaults(encryption_public_key: Vec<u8>) -> String {
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
pub async fn get_encrypted_symmetric_key_for(encryption_public_key: Vec<u8>) -> (String, Vec<u8>) {
    let mut derivation_id: Vec<u8> = ic_cdk::caller().as_slice().to_vec();
    let addition = String::from("additionalDerivationIdString");
    derivation_id.extend(addition.into_bytes());
    let derivation_id_response = derivation_id.clone();

    let request = VetKDEncryptedKeyRequest {
        derivation_id,
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

    (hex::encode(response.encrypted_key), derivation_id_response)
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
