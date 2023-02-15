// Skeleton and mock for the key derivation functions as described in the DFINITY video about on-chain encryption
// https://www.youtube.com/watch?v=baM6jHnmMq8&t=1633s

// note: this is just a mock.

pub mod helper;
pub mod utils;

// use anyhow::Result;
use candid::candid_method;

// extern crate openssl;

use crate::helper::DerivationIdMapper::deterministically_derive_index_from_derivation_id;
use helper::KeyReader::read_keys;
// use openssl::rsa::Rsa;

// KeyPairs file contains 1000 keys which get loaded into memory
// Derivation ID is used to deterministically derive the index (between 0 and 10000)
// Corresponding key is returned
#[ic_cdk_macros::query]
#[candid_method(query)]
fn derive_encryption_key(master_key_id: i32, derivation_id: String) -> Option<Vec<u8>> {
    let kps = read_keys().0;

    // use helper function
    let keyposition = deterministically_derive_index_from_derivation_id(&derivation_id);

    // Some(
    //     Rsa::public_key_from_pem(&kps[keyposition].public_key)
    //         .unwrap()
    //         .public_key_to_pem()
    //         .unwrap(),
    // )

    Some(kps[keyposition].public_key.clone())
}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn derive_decryption_key(master_key_id: i32, derivation_id: String) -> Option<Vec<u8>> {
    let kps = read_keys().0;

    // use helper function
    let keyposition = deterministically_derive_index_from_derivation_id(&derivation_id);

    // Some(
    //     Rsa::private_key_from_pem(&kps[keyposition].private_key)
    //         .unwrap()
    //         .private_key_to_pem()
    //         .unwrap(),
    // )
    Some(kps[keyposition].private_key.clone())
}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn derive_encrypted_encryption_key(
    master_key_id: i32,
    transport_pk: String,
    derivation_id: String,
) -> Option<Vec<u8>> {
    // TODO
    None
}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn derive_encrypted_decryption_key(
    master_key_id: i32,
    transport_pk: String,
    derivation_id: String,
) -> Option<Vec<u8>> {
    // TODO
    None
}
