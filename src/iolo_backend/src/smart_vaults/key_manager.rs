use std::{str::FromStr, vec};
use std::cell::RefCell;

use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use crate::common::error::SmartVaultErr;
use crate::common::uuid::UUID;
use crate::smart_vaults::master_vault::MasterVault;
use crate::smart_vaults::smart_vault::{MASTERVAULT, TESTAMENT_REGISTRY, USER_REGISTRY};
use crate::smart_vaults::testament::{Testament, TestamentID};
use crate::smart_vaults::testament_registry::TestamentRegistry;
use crate::smart_vaults::user_registry::UserRegistry;

use super::vetkd_types::{
    CanisterId, VetKDCurve, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDKeyId,
    VetKDPublicKeyReply, VetKDPublicKeyRequest,
};

const VETKD_SYSTEM_API_CANISTER_ID: &str = "cr2gw-4iaaa-aaaal-qcrda-cai";

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct TestamentKeyDerviationArgs {
    pub encryption_public_key: Vec<u8>,
    pub testament_id: String,
}

/// Computes a fresh vetkd symmetric key to encrypt the secrets in a user vault.
///
/// It uses the caller and a random Nonce value provided by the front-end.
///
/// The key is encrypted using the provided encryption_public_key.
#[ic_cdk_macros::update]
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
/// The key is encrypted using the provided encryption_public_key.
#[ic_cdk_macros::update]
async fn encrypted_symmetric_key_for_testament(args: TestamentKeyDerviationArgs) -> Result<String, SmartVaultErr> {
    let caller = ic_cdk::caller(); //.as_slice().to_vec();

    // check if caller has the right to derive this key
    let mut key_can_be_generated = false;

    // Let's see if the testament is existing
    let result_1 = TESTAMENT_REGISTRY.with(
        |tr: &RefCell<TestamentRegistry>| -> Option<Principal> {
            let testament_registry = tr.borrow();
            testament_registry.get_testator_of_testament(args.testament_id.clone())
        },
    );

    if result_1.is_none() {
        // No testament with this id is existing, we can easily create a vetkey
        key_can_be_generated = true;
    } else {
        // Testament is existing, further checks are needed
        if result_1.unwrap() == caller {
            // Caller is testator, all good
            key_can_be_generated = true;
        } else {
            // Let's see if caller is heir
            let result_2 = TESTAMENT_REGISTRY.with(
                |tr: &RefCell<TestamentRegistry>| -> Result<(TestamentID, Principal), SmartVaultErr> {
                    let testament_registry = tr.borrow();
                    testament_registry.get_testament_id_as_heir(caller, args.testament_id.clone())
                },
            )?;

            // Caller is heir, let's see if the associated testament is in correct condition status.
            let result_3 = USER_REGISTRY.with(
                |ur: &RefCell<UserRegistry>| -> Result<UUID, SmartVaultErr> {
                    let user_registry = ur.borrow();
                    let user = user_registry.get_user(&result_2.1)?;
                    user.user_vault_id.ok_or_else(|| SmartVaultErr::UserVaultDoesNotExist("".to_string()))
                },
            )?;
            let result_4 = MASTERVAULT.with(
                |mv: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
                    mv.borrow()
                        .get_user_vault(&result_3)?
                        .get_testament(&args.testament_id)
                        .cloned()
                },
            )?;
            if *result_4.condition_status() {
                key_can_be_generated = true;
            }
        }
    }


    if !(key_can_be_generated) {
        return Err(SmartVaultErr::KeyGenerationNotAllowed);
    }

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
#[ic_cdk_macros::update]
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
