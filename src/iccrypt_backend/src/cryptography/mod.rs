pub mod key_derivation;

use candid::candid_method;

use self::key_derivation::derive_encrypted_key;

pub type Ciphertext = String;
pub type MasterKeyID = String;
pub type EncryptedKey = String;
pub type TransportPublicKey = String;
pub type DerivationID = String;

#[ic_cdk_macros::query]
#[candid_method(query)]
fn derive_key(
    master_key_id: MasterKeyID,
    transport_pk: TransportPublicKey,
    derivation_id: DerivationID,
) -> String {
    let encrypted_key: EncryptedKey =
        derive_encrypted_key(master_key_id, transport_pk, derivation_id).unwrap();
    // TODO: unwrapping not acceptable :-) match the error types
    // TODO: define error types
    encrypted_key
}
