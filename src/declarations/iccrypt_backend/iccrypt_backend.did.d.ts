import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Secret {
  'id' : string,
  'url' : string,
  'username' : string,
  'owner' : string,
  'password' : string,
  'name' : string,
  'category' : SecretCategory,
}
export type SecretCategory = { 'Password' : null } |
  { 'CryptoWallet' : null };
export interface _SERVICE {
  'add_test_secrets' : ActorMethod<[], undefined>,
  'add_user_secret' : ActorMethod<[string, Secret], undefined>,
  'get_all_secrets' : ActorMethod<[], Array<Secret>>,
  'get_user_secrets' : ActorMethod<[string], Array<[string, Secret]>>,
}
