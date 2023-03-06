import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Result = { 'Ok' : User } |
  { 'Err' : SmartVaultErr };
export interface Secret {
  'id' : string,
  'url' : [] | [string],
  'username' : [] | [string],
  'date_created' : bigint,
  'owner' : Principal,
  'password' : [] | [string],
  'name' : string,
  'notes' : [] | [string],
  'category' : SecretCategory,
  'date_modified' : bigint,
}
export type SecretCategory = { 'Password' : null } |
  { 'Note' : null } |
  { 'Document' : null };
export type SmartVaultErr = { 'UserAlreadyExists' : string } |
  { 'UserVaultAlreadyExists' : string } |
  { 'UserVaultCreationFailed' : string };
export interface User {
  'id' : Principal,
  'date_created' : bigint,
  'date_last_login' : [] | [bigint],
  'date_modified' : bigint,
}
export interface UserVault {
  'date_created' : bigint,
  'owner' : Principal,
  'secrets' : Array<[string, Secret]>,
  'date_modified' : bigint,
}
export interface _SERVICE {
  'add_user_secret' : ActorMethod<[SecretCategory, string], undefined>,
  'create_user' : ActorMethod<[], Result>,
  'delete_user' : ActorMethod<[], undefined>,
  'get_decryption_key_from' : ActorMethod<[Principal], [] | [Uint8Array]>,
  'get_encryption_key_for' : ActorMethod<[Principal], [] | [Uint8Array]>,
  'get_user_vault' : ActorMethod<[], [] | [UserVault]>,
  'give_me_a_new_uuid' : ActorMethod<[], string>,
  'is_user_vault_existing' : ActorMethod<[], boolean>,
  'update_user_secret' : ActorMethod<[Secret], undefined>,
  'what_time_is_it' : ActorMethod<[], bigint>,
  'who_am_i' : ActorMethod<[], string>,
}
