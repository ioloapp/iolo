use std::cell::RefCell;
use std::{str::FromStr, vec};

use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

use crate::common::error::SmartVaultErr;
use crate::common::uuid::UUID;
use crate::policies::policies_interface_impl::get_policy_from_policy_store;
use crate::policies::policy::{Policy, PolicyID};
use crate::policies::policy_registries::PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE;
use crate::smart_vaults::smart_vault::{
    POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE, USER_STORE,
    USER_VAULT_STORE_DO_NOT_USE_ANYMORE,
};
use crate::user_vaults::user_vault_store_DO_NOT_USE_ANYMORE::UserVaultStore_DO_NOT_USE_ANYMORE;
use crate::users::user_store::UserStore;

use super::vetkd_types::{
    CanisterId, VetKDCurve, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDKeyId,
    VetKDPublicKeyReply, VetKDPublicKeyRequest,
};

const VETKD_SYSTEM_API_CANISTER_ID: &str = "cr2gw-4iaaa-aaaal-qcrda-cai";

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct PolicyKeyDerviationArgs {
    pub encryption_public_key: Vec<u8>,
    pub policy_id: String,
}

/// Computes a fresh vetkd symmetric key to encrypt/decrypt the secrets in a user vault.
///
/// It uses the caller and a random Nonce value provided by the front-end.
///
/// The key is encrypted using the provided encryption_public_key.
#[ic_cdk_macros::update]
async fn generate_vetkd_encrypted_symmetric_key_for_user(encryption_public_key: Vec<u8>) -> String {
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

/// Computes a fresh vetkd symmetric key to encrypt/decrypt the secrets in a policy.
///
/// The key is encrypted using the provided encryption_public_key.
#[ic_cdk_macros::update]
async fn generate_vetkd_encrypted_symmetric_key_for_policy(
    args: PolicyKeyDerviationArgs,
) -> Result<String, SmartVaultErr> {
    let caller = ic_cdk::caller(); //.as_slice().to_vec();

    // Let's see if the policy is existing
    let policy = get_policy_from_policy_store(&args.policy_id)?;

    // Checks if one of the following conditions are met:
    // 1. Caller is the owner or
    // 2. Caller is a beneficiary and conditions are met
    let key_can_be_generated = policy.owner() == &caller
        || (policy.beneficiaries().contains(&caller) && *policy.conditions_status());

    if !key_can_be_generated {
        return Err(SmartVaultErr::KeyGenerationNotAllowed);
    }

    let derivation_id = args.policy_id.as_bytes().to_vec();

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

    let response = hex::encode(response.encrypted_key);
    Ok(response)
}

/*
    The verification key is used for authenticating that the symmetric key or the data has not
    been tampered with and is indeed generated or approved by a the IC API.

    Tobi: I assume this is part of some sort of digital signature verification or message
    authentication code (MAC) checking. To be verified.
*/
#[ic_cdk_macros::update]
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
/// TODO: it is the same as generate_vetkd_encrypted_symmetric_key_for_user
/// Which one do we need?
/**
#[ic_cdk_macros::update]
async fn encrypted_symmetric_key_for_caller(encryption_public_key: Vec<u8>) -> String {
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
*/

#[ic_cdk_macros::update]
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
