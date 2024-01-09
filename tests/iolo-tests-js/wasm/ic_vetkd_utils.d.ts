/* tslint:disable */
/* eslint-disable */
/**
* Secret key of the transport key pair
*/
export class TransportSecretKey {
  free(): void;
/**
* Creates a transport secret key from a 32-byte seed.
* @param {Uint8Array} seed
*/
  constructor(seed: Uint8Array);
/**
* Returns the serialized public key associated with this secret key
* @returns {Uint8Array}
*/
  public_key(): Uint8Array;
/**
* Decrypt an encrypted key, and hash it to a symmetric key
*
* The output length can be arbitrary and is specified by the caller
*
* The `symmetric_key_associated_data` field should include information about
* the protocol and cipher that this key will be used for.
* @param {Uint8Array} encrypted_key_bytes
* @param {Uint8Array} derived_public_key_bytes
* @param {Uint8Array} derivation_id
* @param {number} symmetric_key_bytes
* @param {Uint8Array} symmetric_key_associated_data
* @returns {Uint8Array}
*/
  decrypt_and_hash(encrypted_key_bytes: Uint8Array, derived_public_key_bytes: Uint8Array, derivation_id: Uint8Array, symmetric_key_bytes: number, symmetric_key_associated_data: Uint8Array): Uint8Array;
}
