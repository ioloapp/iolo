use std::{str::FromStr, vec};
use std::cell::RefCell;

use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

use crate::common::error::SmartVaultErr;
use crate::common::uuid::UUID;
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

/// Computes a fresh vetkd symmetric key to encrypt the secrets in a policy.
///
/// The key is encrypted using the provided encryption_public_key.
#[ic_cdk_macros::update]
async fn encrypted_symmetric_key_for_policies(
    args: PolicyKeyDerviationArgs,
) -> Result<String, SmartVaultErr> {
    let caller = ic_cdk::caller(); //.as_slice().to_vec();

    // check if caller has the right to derive this key
    let mut key_can_be_generated = false;

    // Let's see if the policy is existing
    let result_1 = POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE.with(
        |tr: &RefCell<PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE>| -> Option<Principal> {
            let policy_registry = tr.borrow();
            policy_registry.get_owner_of_policy(args.policy_id.clone())
        },
    );

    if result_1.is_none() {
        // No policy with this id is existing, we can easily create a vetkey
        key_can_be_generated = true;
    } else {
        // policy is existing, further checks are needed
        if result_1.unwrap() == caller {
            // Caller is owner, all good
            key_can_be_generated = true;
        } else {
            // Let's see if caller is beneficiary
            let result_2 = POLICY_REGISTRY_FOR_BENEFICIARIES_DO_NOT_USE_ANYMORE.with(
                |tr: &RefCell<PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE>| -> Result<(PolicyID, Principal), SmartVaultErr> {
                    let policy_registry = tr.borrow();
                    policy_registry.get_policy_id_as_beneficiary(caller, args.policy_id.clone())
                },
            )?;

            // Caller is beneficiary, let's see if the associated policy is in correct condition status.
            let result_3 =
                USER_STORE.with(|ur: &RefCell<UserStore>| -> Result<UUID, SmartVaultErr> {
                    let user_store = ur.borrow();
                    let user = user_store.get_user(&result_2.1)?;
                    user.user_vault_id_DO_NOT_USE_ANYMORE
                        .ok_or_else(|| SmartVaultErr::UserVaultDoesNotExist("".to_string()))
                })?;
            let result_4 = USER_VAULT_STORE_DO_NOT_USE_ANYMORE.with(
                |mv: &RefCell<UserVaultStore_DO_NOT_USE_ANYMORE>| -> Result<Policy, SmartVaultErr> {
                    mv.borrow()
                        .get_user_vault(&result_3)?
                        .get_policy(&args.policy_id)
                        .cloned()
                },
            )?;
            if *result_4.conditions_status() {
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

    derivation_id.extend_from_slice(&args.policy_id.as_bytes());
    ic_cdk::println!(
        "policy id: {:?}",
        &args.policy_id.as_bytes()
    );*/

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
