use candid::candid_method;

use crate::{
    utils::threshold_key_derivation::derive_encryption_key,
    utils::{caller::get_caller, threshold_key_derivation::derive_decryption_key},
};

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
    ic_cdk::println!("Heir: {}", heir);
    let mut derivation_id: String = get_caller().to_string();
    derivation_id.push_str(&heir.to_string());
    let response = derive_encryption_key(MASTER_KEY_ID, &derivation_id).await;
    let temp = response.clone().unwrap();
    ic_cdk::println!("Returned key length: {}", &temp.len());
    ic_cdk::println!("Returned key: {:?}", &temp);
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
