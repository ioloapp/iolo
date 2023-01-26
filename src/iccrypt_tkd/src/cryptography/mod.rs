use crate::{DerivationID, EncryptedKey, MasterKeyID, TransportPublicKey};
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
