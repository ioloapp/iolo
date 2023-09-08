import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface CreateSecretArgs {
  'url' : [] | [string],
  'username' : [] | [Uint8Array | number[]],
  'password' : [] | [Uint8Array | number[]],
  'name' : string,
  'decryption_material' : SecretDecryptionMaterial,
  'notes' : [] | [Uint8Array | number[]],
  'category' : SecretCategory,
}
export type Result = { 'Ok' : Secret } |
  { 'Err' : SmartVaultErr };
export type Result_1 = { 'Ok' : User } |
  { 'Err' : SmartVaultErr };
export type Result_2 = { 'Ok' : null } |
  { 'Err' : SmartVaultErr };
export type Result_3 = { 'Ok' : SecretDecryptionMaterial } |
  { 'Err' : SmartVaultErr };
export type Result_4 = { 'Ok' : Array<SecretListEntry> } |
  { 'Err' : SmartVaultErr };
export interface Secret {
  'id' : bigint,
  'url' : [] | [string],
  'username' : [] | [Uint8Array | number[]],
  'date_created' : bigint,
  'password' : [] | [Uint8Array | number[]],
  'name' : string,
  'notes' : [] | [Uint8Array | number[]],
  'category' : SecretCategory,
  'date_modified' : bigint,
}
export type SecretCategory = { 'Password' : null } |
  { 'Note' : null } |
  { 'Document' : null };
export interface SecretDecryptionMaterial {
  'iv' : Uint8Array | number[],
  'password_decryption_nonce' : [] | [Uint8Array | number[]],
  'notes_decryption_nonce' : [] | [Uint8Array | number[]],
  'encrypted_decryption_key' : Uint8Array | number[],
  'username_decryption_nonce' : [] | [Uint8Array | number[]],
}
export interface SecretForUpdate {
  'id' : bigint,
  'url' : [] | [string],
  'username' : [] | [string],
  'password' : [] | [string],
  'name' : [] | [string],
  'notes' : [] | [string],
  'category' : [] | [SecretCategory],
}
export interface SecretListEntry {
  'id' : bigint,
  'name' : string,
  'category' : SecretCategory,
}
export type SmartVaultErr = { 'UserAlreadyExists' : string } |
  { 'SecretHasNoId' : null } |
  { 'SecretDoesAlreadyExist' : string } |
  { 'UserDeletionFailed' : string } |
  { 'SecretDoesNotExist' : string } |
  { 'UserVaultCreationFailed' : string } |
  { 'UserDoesNotExist' : string } |
  { 'UserVaultDoesNotExist' : string };
export interface User {
  'id' : Principal,
  'date_created' : bigint,
  'date_last_login' : [] | [bigint],
  'user_vault_id' : bigint,
  'date_modified' : bigint,
}
export interface _SERVICE {
  'add_user_secret' : ActorMethod<[CreateSecretArgs], Result>,
  'create_user' : ActorMethod<[], Result_1>,
  'delete_user' : ActorMethod<[], Result_2>,
  'encrypted_ibe_decryption_key_for_caller' : ActorMethod<
    [Uint8Array | number[]],
    string
  >,
  'encrypted_symmetric_key_for_caller' : ActorMethod<
    [Uint8Array | number[]],
    string
  >,
  'get_encrypted_symmetric_key_for' : ActorMethod<
    [Uint8Array | number[]],
    [string, Uint8Array | number[]]
  >,
  'get_secret_decryption_material' : ActorMethod<[bigint], Result_3>,
  'get_secret_list' : ActorMethod<[], Result_4>,
  'ibe_encryption_key' : ActorMethod<[], string>,
  'is_user_vault_existing' : ActorMethod<[], boolean>,
  'remove_user_secret' : ActorMethod<[bigint], Result_2>,
  'symmetric_key_verification_key' : ActorMethod<[], string>,
  'update_user_secret' : ActorMethod<[SecretForUpdate], Result>,
  'what_time_is_it' : ActorMethod<[], bigint>,
  'who_am_i' : ActorMethod<[], string>,
}
