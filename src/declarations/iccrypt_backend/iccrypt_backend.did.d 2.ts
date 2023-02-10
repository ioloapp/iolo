import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Secret {
  'id' : string,
  'url' : [] | [string],
  'username' : [] | [string],
  'owner' : Principal,
  'password' : [] | [string],
  'name' : string,
  'notes' : [] | [string],
  'category' : SecretCategory,
}
export type SecretCategory = { 'Password' : null } |
  { 'Note' : null } |
  { 'Wallet' : null };
export interface User {
  'id' : Principal,
  'last_login' : [] | [bigint],
  'heirs' : Array<Principal>,
  'date_created' : [] | [bigint],
}
export interface UserSafe {
  'date_created' : [] | [bigint],
  'owner' : User,
  'secrets' : Array<[string, Secret]>,
  'date_modified' : [] | [bigint],
}
export interface _SERVICE {
  'add_user_secret' : ActorMethod<[Principal, Secret], undefined>,
  'derive_key' : ActorMethod<[string, string, string], string>,
  'get_user_safe' : ActorMethod<[Principal], UserSafe>,
  'give_me_a_new_uuid' : ActorMethod<[], string>,
  'greet' : ActorMethod<[string], string>,
  'update_user_secret' : ActorMethod<[Principal, Secret], undefined>,
  'what_time_is_it' : ActorMethod<[], bigint>,
  'who_am_i' : ActorMethod<[], string>,
}
