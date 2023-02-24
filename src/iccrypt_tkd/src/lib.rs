// Skeleton and mock for the key derivation functions as described in the DFINITY video about on-chain encryption
// https://www.youtube.com/watch?v=baM6jHnmMq8&t=1633s

// Note: this is just a mock.

pub mod helper;
pub mod utils;

// use anyhow::Result;
use candid::candid_method;
use utils::caller::get_caller;

use crate::helper::derivation_id_mapper::deterministically_derive_key_pair;

// KeyPairs file contains 10 keys which get loaded into memory
// Derivation ID is used to deterministically derive the index (between 0 and 10)
// Corresponding key is returned
#[ic_cdk_macros::query]
#[candid_method(query)]
fn derive_encryption_key(master_key_id: i32, derivation_id: String) -> Vec<u8> {
    // for the final derivation ID we want to have:
    // "caller || derivation_id" where derivation_id = "alice || bob" and caller = "iccrypt backend"
    // this results in a derivation id like
    // "iccrypt backend || alice || bob" and means: "alice is requesting an encryption key to encrypt the vault for bob"

    // use helper function to get position index between 1 and 10
    let kp =
        deterministically_derive_key_pair(master_key_id, &get_caller().to_string(), &derivation_id);
    let x = "hallo";
    kp.public_key
}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn derive_decryption_key(master_key_id: i32, derivation_id: String) -> Vec<u8> {
    // use helper function to get position index between 1 and 10
    let kp =
        deterministically_derive_key_pair(master_key_id, &get_caller().to_string(), &derivation_id);

    kp.private_key
}

// #[ic_cdk_macros::query]
// #[candid_method(query)]
// fn derive_encrypted_encryption_key(
//     master_key_id: i32,
//     transport_pk: String,
//     derivation_id: String,
// ) -> Option<Vec<u8>> {
//     // TODO
//     None
// }

// #[ic_cdk_macros::query]
// #[candid_method(query)]
// fn derive_encrypted_decryption_key(
//     master_key_id: i32,
//     transport_pk: String,
//     derivation_id: String,
// ) -> Option<Vec<u8>> {
//     // TODO
//     None
// }

candid::export_service!();

#[cfg(test)]
mod tests {
    use crate::__export_service;

    #[test]
    fn get_candid() {
        println!("####### Candid START #######");
        println!();
        std::println!("{}", __export_service());
        println!();
        println!("####### Candid END #######");
    }
}
