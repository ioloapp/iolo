import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Secret {
  'id' : string,
  'url' : string,
  'username' : string,
  'owner' : Principal,
  'password' : string,
  'name' : string,
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
  'heirs' : Array<string>,
  'date_created' : [] | [bigint],
  'owner' : User,
  'secrets' : Array<[string, Secret]>,
  'date_modified' : [] | [bigint],
}
export interface _SERVICE {
  'add_user_secret' : ActorMethod<[Principal, Secret], undefined>,
  'get_user_safe' : ActorMethod<[Principal], UserSafe>,
  'say_hi' : ActorMethod<[], string>,
}
