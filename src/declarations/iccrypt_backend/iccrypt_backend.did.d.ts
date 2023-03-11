import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Result = { 'Ok' : Secret } |
  { 'Err' : SmartVaultErr };
export type Result_1 = { 'Ok' : User } |
  { 'Err' : SmartVaultErr };
export type Result_2 = { 'Ok' : null } |
  { 'Err' : SmartVaultErr };
export type Result_3 = { 'Ok' : UserVault } |
  { 'Err' : SmartVaultErr };
export interface Secret {
  'id' : bigint,
  'url' : [] | [string],
  'username' : [] | [string],
  'date_created' : bigint,
  'password' : [] | [string],
  'name' : string,
  'notes' : [] | [string],
  'category' : SecretCategory,
  'date_modified' : bigint,
}
export type SecretCategory = { 'Password' : null } |
  { 'Note' : null } |
  { 'Document' : null };
export interface SecretForCreation {
  'url' : [] | [string],
  'username' : [] | [string],
  'password' : [] | [string],
  'name' : string,
  'notes' : [] | [string],
  'category' : SecretCategory,
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
export type SmartVaultErr = { 'UserAlreadyExists' : string } |
  { 'SecretHasNoId' : null } |
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
export interface UserVault {
  'id' : bigint,
  'date_created' : bigint,
  'secrets' : Array<[bigint, Secret]>,
  'date_modified' : bigint,
}
export interface _SERVICE {
  'add_user_secret' : ActorMethod<[SecretForCreation], Result>,
  'create_user' : ActorMethod<[], Result_1>,
  'delete_user' : ActorMethod<[], Result_2>,
  'get_decryption_key_from' : ActorMethod<[string], [] | [Uint8Array]>,
  'get_encryption_key_for' : ActorMethod<[string], [] | [Uint8Array]>,
  'get_user_vault' : ActorMethod<[], Result_3>,
  'is_user_vault_existing' : ActorMethod<[], boolean>,
  'update_user_secret' : ActorMethod<[SecretForUpdate], Result>,
}
