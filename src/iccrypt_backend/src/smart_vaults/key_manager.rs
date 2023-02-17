use candid::candid_method;

use crate::{
    common::user::UserID, utils::caller::get_caller,
    utils::threshold_key_derivation::derive_encryption_key,
};

// Identity based encryption using IC Threshold Key Derivation
#[ic_cdk_macros::update]
#[candid_method(update)]
pub async fn get_encryption_key_for(heir: UserID) -> Option<Vec<u8>> {
    // For the call to the threshold key derivation canister, we want to construct a derivation ID as follows:
    // derivation_id="alice || bob", where alice is the caller.
    // This id means: "alice is requesting an encryption key to encrypt the vault for the heir bob".
    // We get the heir (bob) as method parameter and we construct the deviration id by prepending the authenticated caller (Alice).
    //
    // Note: The IC Key derivation canister will finally prepend the caller, resulting in a derivation ID like
    // derivation_id="iccrypt_backend || alice || bob".
    let mut derivation_id: String = get_caller().to_string();
    derivation_id.push_str(&heir.to_string());
    let master_key_id: i32 = 1;

    derive_encryption_key(master_key_id, &derivation_id).await
}
