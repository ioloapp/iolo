import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface AddSecretArgs {
  'id' : string,
  'url' : [] | [string],
  'username' : [] | [Uint8Array | number[]],
  'password' : [] | [Uint8Array | number[]],
  'name' : [] | [string],
  'symmetric_crypto_material' : SecretSymmetricCryptoMaterial,
  'notes' : [] | [Uint8Array | number[]],
  'category' : [] | [SecretCategory],
}
export interface AddTestamentArgs {
  'id' : string,
  'heirs' : Array<Principal>,
  'name' : [] | [string],
  'secrets' : Array<string>,
  'key_box' : Array<[string, SecretSymmetricCryptoMaterial]>,
}
export type Result = { 'Ok' : Secret } |
  { 'Err' : SmartVaultErr };
export type Result_1 = { 'Ok' : Testament } |
  { 'Err' : SmartVaultErr };
export type Result_2 = { 'Ok' : User } |
  { 'Err' : SmartVaultErr };
export type Result_3 = { 'Ok' : null } |
  { 'Err' : SmartVaultErr };
export type Result_4 = { 'Ok' : Array<SecretListEntry> } |
  { 'Err' : SmartVaultErr };
export type Result_5 = { 'Ok' : SecretSymmetricCryptoMaterial } |
  { 'Err' : SmartVaultErr };
export type Result_6 = { 'Ok' : Array<Testament> } |
  { 'Err' : SmartVaultErr };
export interface Secret {
  'id' : string,
  'url' : [] | [string],
  'username' : [] | [Uint8Array | number[]],
  'date_created' : bigint,
  'password' : [] | [Uint8Array | number[]],
  'name' : [] | [string],
  'notes' : [] | [Uint8Array | number[]],
  'category' : [] | [SecretCategory],
  'date_modified' : bigint,
}
export type SecretCategory = { 'Password' : null } |
  { 'Note' : null } |
  { 'Document' : null };
export interface SecretListEntry {
  'id' : string,
  'name' : [] | [string],
  'category' : [] | [SecretCategory],
}
export interface SecretSymmetricCryptoMaterial {
  'iv' : Uint8Array | number[],
  'password_decryption_nonce' : [] | [Uint8Array | number[]],
  'notes_decryption_nonce' : [] | [Uint8Array | number[]],
  'encrypted_symmetric_key' : Uint8Array | number[],
  'username_decryption_nonce' : [] | [Uint8Array | number[]],
}
export type SmartVaultErr = { 'UserAlreadyExists' : string } |
  { 'SecretHasNoId' : null } |
  { 'UserDeletionFailed' : string } |
  { 'SecretDoesNotExist' : string } |
  { 'TestamentAlreadyExists' : string } |
  { 'TestamentDoesNotExist' : string } |
  { 'UserVaultCreationFailed' : string } |
  { 'UserDoesNotExist' : string } |
  { 'UserVaultDoesNotExist' : string } |
  { 'SecretAlreadyExists' : string };
export interface Testament {
  'id' : string,
  'heirs' : Array<Principal>,
  'date_created' : bigint,
  'name' : [] | [string],
  'testator' : Principal,
  'secrets' : Array<string>,
  'key_box' : Array<[string, SecretSymmetricCryptoMaterial]>,
  'date_modified' : bigint,
}
export interface TestamentKeyDerviationArgs {
  'encryption_public_key' : Uint8Array | number[],
  'testament_id' : string,
}
export interface User {
  'id' : Principal,
  'date_created' : bigint,
  'date_last_login' : [] | [bigint],
  'user_vault_id' : bigint,
  'date_modified' : bigint,
}
export interface _SERVICE {
  'add_secret' : ActorMethod<[AddSecretArgs], Result>,
  'add_testament' : ActorMethod<[AddTestamentArgs], Result_1>,
  'create_user' : ActorMethod<[], Result_2>,
  'delete_user' : ActorMethod<[], Result_3>,
  'encrypted_ibe_decryption_key_for_caller' : ActorMethod<
    [Uint8Array | number[]],
    string
  >,
  'encrypted_symmetric_key_for_caller' : ActorMethod<
    [Uint8Array | number[]],
    string
  >,
  'encrypted_symmetric_key_for_testament' : ActorMethod<
    [TestamentKeyDerviationArgs],
    string
  >,
  'encrypted_symmetric_key_for_uservault' : ActorMethod<
    [Uint8Array | number[]],
    string
  >,
  'get_secret' : ActorMethod<[string], Result>,
  'get_secret_list' : ActorMethod<[], Result_4>,
  'get_secret_symmetric_crypto_material' : ActorMethod<[string], Result_5>,
  'get_testament' : ActorMethod<[string], Result_1>,
  'get_testament_list' : ActorMethod<[], Result_6>,
  'ibe_encryption_key' : ActorMethod<[], string>,
  'is_user_vault_existing' : ActorMethod<[], boolean>,
  'remove_secret' : ActorMethod<[string], Result_3>,
  'remove_testament' : ActorMethod<[string], Result_3>,
  'symmetric_key_verification_key' : ActorMethod<[], string>,
  'update_secret' : ActorMethod<[Secret], Result>,
  'update_testament' : ActorMethod<[Testament], Result_1>,
  'what_time_is_it' : ActorMethod<[], bigint>,
  'who_am_i' : ActorMethod<[], string>,
}
