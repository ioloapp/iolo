import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface AddContactArgs {
  'id' : Principal,
  'user_type' : [] | [UserType],
  'name' : [] | [string],
  'email' : [] | [string],
}
export interface AddOrUpdateUserArgs {
  'user_type' : [] | [UserType],
  'name' : [] | [string],
  'email' : [] | [string],
}
export interface AddPolicyArgs { 'name' : [] | [string] }
export interface AddSecretArgs {
  'url' : [] | [string],
  'username' : [] | [Uint8Array | number[]],
  'password' : [] | [Uint8Array | number[]],
  'name' : [] | [string],
  'symmetric_crypto_material' : SecretSymmetricCryptoMaterial,
  'notes' : [] | [Uint8Array | number[]],
  'category' : [] | [SecretCategory],
}
export type Condition = { 'TimeBasedCondition' : TimeBasedCondition } |
  { 'XOutOfYCondition' : XOutOfYCondition };
export interface Contact {
  'id' : Principal,
  'user_type' : [] | [UserType],
  'name' : [] | [string],
  'email' : [] | [string],
}
export type LogicalOperator = { 'Or' : null } |
  { 'And' : null };
export interface Policy {
  'id' : string,
  'date_created' : bigint,
  'owner' : Principal,
  'name' : [] | [string],
  'conditions_logical_operator' : [] | [LogicalOperator],
  'secrets' : Array<string>,
  'conditions_status' : boolean,
  'beneficiaries' : Array<Principal>,
  'key_box' : Array<[bigint, SecretSymmetricCryptoMaterial]>,
  'conditions' : Array<Condition>,
  'date_modified' : bigint,
}
export interface PolicyKeyDerviationArgs {
  'encryption_public_key' : Uint8Array | number[],
  'policy_id' : string,
}
export interface PolicyListEntry {
  'id' : string,
  'owner' : Principal,
  'condition_status' : boolean,
  'name' : [] | [string],
}
export interface PolicyResponse {
  'id' : string,
  'date_created' : bigint,
  'owner' : Principal,
  'name' : [] | [string],
  'conditions_logical_operator' : [] | [LogicalOperator],
  'secrets' : Array<SecretListEntry>,
  'conditions_status' : boolean,
  'beneficiaries' : Array<Principal>,
  'key_box' : Array<[bigint, SecretSymmetricCryptoMaterial]>,
  'conditions' : Array<Condition>,
  'date_modified' : bigint,
}
export type Result = { 'Ok' : null } |
  { 'Err' : SmartVaultErr };
export type Result_1 = { 'Ok' : Policy } |
  { 'Err' : SmartVaultErr };
export type Result_10 = { 'Ok' : Contact } |
  { 'Err' : SmartVaultErr };
export type Result_2 = { 'Ok' : Secret } |
  { 'Err' : SmartVaultErr };
export type Result_3 = { 'Ok' : User } |
  { 'Err' : SmartVaultErr };
export type Result_4 = { 'Ok' : string } |
  { 'Err' : SmartVaultErr };
export type Result_5 = { 'Ok' : Array<Contact> } |
  { 'Err' : SmartVaultErr };
export type Result_6 = { 'Ok' : PolicyResponse } |
  { 'Err' : SmartVaultErr };
export type Result_7 = { 'Ok' : Array<PolicyListEntry> } |
  { 'Err' : SmartVaultErr };
export type Result_8 = { 'Ok' : Array<SecretListEntry> } |
  { 'Err' : SmartVaultErr };
export type Result_9 = { 'Ok' : SecretSymmetricCryptoMaterial } |
  { 'Err' : SmartVaultErr };
export interface Secret {
  'id' : bigint,
  'url' : [] | [string],
  'username' : [] | [Uint8Array | number[]],
  'date_created' : bigint,
  'owner' : Principal,
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
  'id' : bigint,
  'name' : [] | [string],
  'category' : [] | [SecretCategory],
}
export interface SecretSymmetricCryptoMaterial {
  'encrypted_symmetric_key' : Uint8Array | number[],
}
export type SmartVaultErr = { 'ContactDoesNotExist' : string } |
  { 'UserAlreadyExists' : string } |
  { 'OnlyOwnerCanDeleteSecret' : string } |
  { 'SecretHasNoId' : null } |
  { 'UserDeletionFailed' : string } |
  { 'ContactAlreadyExists' : string } |
  { 'CallerNotBeneficiary' : string } |
  { 'OnlyOwnerCanUpdatePolicy' : string } |
  { 'SecretDoesNotExist' : string } |
  { 'NoPolicyForBeneficiary' : string } |
  { 'CallerNotPolicyOwner' : string } |
  { 'SecretDecryptionMaterialDoesNotExist' : string } |
  { 'Unauthorized' : null } |
  { 'UserUpdateFailed' : string } |
  { 'NoPolicyForValidator' : string } |
  { 'PolicyAlreadyExists' : string } |
  { 'UserVaultCreationFailed' : string } |
  { 'PolicyDoesNotExist' : string } |
  { 'UserDoesNotExist' : string } |
  { 'UserVaultDoesNotExist' : string } |
  { 'SecretAlreadyExists' : string } |
  { 'InvalidPolicyCondition' : null } |
  { 'KeyGenerationNotAllowed' : null };
export interface TimeBasedCondition {
  'id' : string,
  'condition_status' : boolean,
  'number_of_days_since_last_login' : bigint,
}
export interface UpdateSecretArgs {
  'id' : bigint,
  'url' : [] | [string],
  'username' : [] | [Uint8Array | number[]],
  'password' : [] | [Uint8Array | number[]],
  'name' : [] | [string],
  'notes' : [] | [Uint8Array | number[]],
  'category' : [] | [SecretCategory],
}
export interface User {
  'id' : Principal,
  'user_type' : [] | [UserType],
  'date_created' : bigint,
  'contacts' : Array<Contact>,
  'name' : [] | [string],
  'secrets' : Array<bigint>,
  'date_last_login' : [] | [bigint],
  'email' : [] | [string],
  'key_box' : Array<[bigint, SecretSymmetricCryptoMaterial]>,
  'user_vault_id_DO_NOT_USE_ANYMORE' : [] | [bigint],
  'date_modified' : bigint,
  'policies' : Array<string>,
}
export type UserType = { 'Company' : null } |
  { 'Person' : null };
export interface Validator { 'id' : Principal, 'status' : boolean }
export interface XOutOfYCondition {
  'id' : string,
  'condition_status' : boolean,
  'quorum' : bigint,
  'validators' : Array<Validator>,
}
export interface _SERVICE {
  'add_contact' : ActorMethod<[AddContactArgs], Result>,
  'add_policy' : ActorMethod<[AddPolicyArgs], Result_1>,
  'add_secret' : ActorMethod<[AddSecretArgs], Result_2>,
  'confirm_x_out_of_y_condition' : ActorMethod<
    [Principal, string, boolean],
    Result
  >,
  'create_user' : ActorMethod<[AddOrUpdateUserArgs], Result_3>,
  'delete_user' : ActorMethod<[], Result>,
  'encrypted_ibe_decryption_key_for_caller' : ActorMethod<
    [Uint8Array | number[]],
    string
  >,
  'encrypted_symmetric_key_for_caller' : ActorMethod<
    [Uint8Array | number[]],
    string
  >,
  'generate_vetkd_encrypted_symmetric_key_for_policy' : ActorMethod<
    [PolicyKeyDerviationArgs],
    Result_4
  >,
  'generate_vetkd_encrypted_symmetric_key_for_user' : ActorMethod<
    [Uint8Array | number[]],
    string
  >,
  'get_contact_list' : ActorMethod<[], Result_5>,
  'get_current_user' : ActorMethod<[], Result_3>,
  'get_policy_as_beneficiary' : ActorMethod<[string], Result_6>,
  'get_policy_as_owner' : ActorMethod<[string], Result_6>,
  'get_policy_list_as_beneficiary' : ActorMethod<[], Result_7>,
  'get_policy_list_as_owner' : ActorMethod<[], Result_7>,
  'get_policy_list_as_validator' : ActorMethod<[], Result_7>,
  'get_secret' : ActorMethod<[bigint], Result_2>,
  'get_secret_as_beneficiary' : ActorMethod<[string, string], Result_2>,
  'get_secret_list' : ActorMethod<[], Result_8>,
  'get_secret_symmetric_crypto_material' : ActorMethod<[bigint], Result_9>,
  'get_secret_symmetric_crypto_material_as_beneficiary' : ActorMethod<
    [bigint, string],
    Result_9
  >,
  'ibe_encryption_key' : ActorMethod<[], string>,
  'remove_contact' : ActorMethod<[Principal], Result>,
  'remove_policy' : ActorMethod<[string], Result>,
  'remove_secret' : ActorMethod<[string], Result>,
  'symmetric_key_verification_key' : ActorMethod<[], string>,
  'update_contact' : ActorMethod<[Contact], Result_10>,
  'update_policy' : ActorMethod<[Policy], Result_1>,
  'update_secret' : ActorMethod<[UpdateSecretArgs], Result_2>,
  'update_user' : ActorMethod<[AddOrUpdateUserArgs], Result_3>,
  'update_user_login_date' : ActorMethod<[], Result_3>,
}
