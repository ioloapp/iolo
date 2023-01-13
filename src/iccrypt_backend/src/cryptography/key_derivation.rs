// skeleton for the key derivation functions as described in the DFINITY video about on-chain encryption
// https://www.youtube.com/watch?v=baM6jHnmMq8&t=1633s

// note: this is just a mock.

use super::{DerivationID, EncryptedKey, MasterKeyID, TransportPublicKey};
use anyhow::Result;

// call to the subnet with the secret-shared master key (where the fairy dust stuff happens :-)
// It returns a cryptographic key which is encrypted by the users "transport public key"
#[allow(unused_variables)]
pub fn derive_encrypted_key(
    master_key_id: MasterKeyID,
    transport_pk: TransportPublicKey,
    derivation_id: DerivationID,
) -> Result<EncryptedKey> {
    // TODO: Call that backend and let the fairy work :-D
    let encrypted_key: EncryptedKey = EncryptedKey::from("");
    Ok(encrypted_key)
}
