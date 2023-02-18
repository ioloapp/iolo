import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

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
export interface UserSafe {
  'date_created' : bigint,
  'owner' : Principal,
  'secrets' : Array<[string, Secret]>,
  'date_modified' : bigint,
}
export interface _SERVICE {
  'add_user_secret' : ActorMethod<
    [Principal, SecretCategory, string],
    undefined
  >,
  'create_new_user' : ActorMethod<[Principal], undefined>,
  'delete_user' : ActorMethod<[Principal], undefined>,
  'get_decryption_key_from' : ActorMethod<[Principal], [] | [Uint8Array]>,
  'get_encryption_key_for' : ActorMethod<[Principal], [] | [Uint8Array]>,
  'get_user_safe' : ActorMethod<[Principal], UserSafe>,
  'give_me_a_new_uuid' : ActorMethod<[], string>,
  'is_user_safe_existing' : ActorMethod<[Principal], boolean>,
  'update_user_secret' : ActorMethod<[Principal, Secret], undefined>,
  'what_time_is_it' : ActorMethod<[], bigint>,
  'who_am_i' : ActorMethod<[], string>,
}
