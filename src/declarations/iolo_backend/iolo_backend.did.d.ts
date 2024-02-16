import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface AddContactArgs {
  'id' : string,
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
  'encrypted_symmetric_key' : Uint8Array | number[],
  'notes' : [] | [Uint8Array | number[]],
  'category' : [] | [SecretCategory],
}
export type Condition = { 'TimeBasedCondition' : TimeBasedCondition } |
  { 'XOutOfYCondition' : XOutOfYCondition };
export interface ConfirmXOutOfYConditionArgs {
  'status' : boolean,
  'policy_id' : string,
}
export interface Contact {
  'id' : string,
  'user_type' : [] | [UserType],
  'name' : [] | [string],
  'email' : [] | [string],
}
export type LogicalOperator = { 'Or' : null } |
  { 'And' : null };
export interface Policy {
  'id' : string,
  'date_created' : bigint,
  'owner' : string,
  'name' : [] | [string],
  'conditions_logical_operator' : [] | [LogicalOperator],
  'secrets' : Array<string>,
  'conditions_status' : boolean,
  'beneficiaries' : Array<string>,
  'key_box' : Array<[string, Uint8Array | number[]]>,
  'conditions' : Array<Condition>,
  'date_modified' : bigint,
}
export interface PolicyForValidator {
  'id' : string,
  'xooy_conditions' : Array<Condition>,
  'owner' : string,
}
export interface PolicyKeyDerviationArgs {
  'encryption_public_key' : Uint8Array | number[],
  'policy_id' : string,
}
export interface PolicyListEntry {
  'id' : string,
  'owner' : string,
  'condition_status' : boolean,
  'name' : [] | [string],
}
export interface PolicyWithSecretListEntries {
  'id' : string,
  'date_created' : bigint,
  'owner' : string,
  'name' : [] | [string],
  'conditions_logical_operator' : [] | [LogicalOperator],
  'secrets' : Array<SecretListEntry>,
  'conditions_status' : boolean,
  'beneficiaries' : Array<string>,
  'key_box' : Array<[string, Uint8Array | number[]]>,
  'conditions' : Array<Condition>,
  'date_modified' : bigint,
}
export type Result = { 'Ok' : Contact } |
  { 'Err' : SmartVaultErr };
export type Result_1 = { 'Ok' : Policy } |
  { 'Err' : SmartVaultErr };
export type Result_10 = { 'Ok' : Array<PolicyListEntry> } |
  { 'Err' : SmartVaultErr };
export type Result_11 = { 'Ok' : Array<SecretListEntry> } |
  { 'Err' : SmartVaultErr };
export type Result_2 = { 'Ok' : Secret } |
  { 'Err' : SmartVaultErr };
export type Result_3 = { 'Ok' : null } |
  { 'Err' : SmartVaultErr };
export type Result_4 = { 'Ok' : User } |
  { 'Err' : SmartVaultErr };
export type Result_5 = { 'Ok' : string } |
  { 'Err' : SmartVaultErr };
export type Result_6 = { 'Ok' : Array<Contact> } |
  { 'Err' : SmartVaultErr };
export type Result_7 = { 'Ok' : Uint8Array | number[] } |
  { 'Err' : SmartVaultErr };
export type Result_8 = { 'Ok' : PolicyWithSecretListEntries } |
  { 'Err' : SmartVaultErr };
export type Result_9 = { 'Ok' : PolicyForValidator } |
  { 'Err' : SmartVaultErr };
export interface Secret {
  'id' : string,
  'url' : [] | [string],
  'username' : [] | [Uint8Array | number[]],
  'date_created' : bigint,
  'owner' : string,
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
export type SmartVaultErr = { 'ContactDoesNotExist' : string } |
  { 'UserAlreadyExists' : string } |
  { 'OnlyOwnerCanDeleteSecret' : string } |
  { 'SecretHasNoId' : null } |
  { 'UserDeletionFailed' : string } |
  { 'KeyBoxEntryDoesNotExistForSecret' : string } |
  { 'ContactAlreadyExists' : string } |
  { 'CallerNotBeneficiary' : string } |
  { 'SecretDoesNotExist' : string } |
  { 'NoPolicyForBeneficiary' : string } |
  { 'CallerNotPolicyOwner' : string } |
  { 'SecretEntryDoesNotExistForKeyBoxEntry' : string } |
  { 'Unauthorized' : null } |
  { 'UserUpdateFailed' : string } |
  { 'NoPolicyForValidator' : string } |
  { 'PolicyAlreadyExists' : string } |
  { 'PolicyDoesNotExist' : string } |
  { 'UserDoesNotExist' : string } |
  { 'SecretAlreadyExists' : string } |
  { 'InvalidPolicyCondition' : null } |
  { 'KeyGenerationNotAllowed' : null };
export interface TimeBasedCondition {
  'id' : string,
  'condition_status' : boolean,
  'number_of_days_since_last_login' : bigint,
}
export interface UpdatePolicyArgs {
  'id' : string,
  'name' : [] | [string],
  'conditions_logical_operator' : [] | [LogicalOperator],
  'secrets' : Array<string>,
  'beneficiaries' : Array<string>,
  'key_box' : Array<[string, Uint8Array | number[]]>,
  'conditions' : Array<Condition>,
}
export interface UpdateSecretArgs {
  'id' : string,
  'url' : [] | [string],
  'username' : [] | [Uint8Array | number[]],
  'password' : [] | [Uint8Array | number[]],
  'name' : [] | [string],
  'notes' : [] | [Uint8Array | number[]],
  'category' : [] | [SecretCategory],
}
export interface User {
  'id' : string,
  'user_type' : [] | [UserType],
  'date_created' : bigint,
  'contacts' : Array<Contact>,
  'name' : [] | [string],
  'secrets' : Array<string>,
  'date_last_login' : [] | [bigint],
  'email' : [] | [string],
  'key_box' : Array<[string, Uint8Array | number[]]>,
  'date_modified' : bigint,
  'policies' : Array<string>,
}
export type UserType = { 'Company' : null } |
  { 'Person' : null };
export interface Validator { 'status' : boolean, 'principal_id' : string }
export interface XOutOfYCondition {
  'id' : string,
  'question' : string,
  'condition_status' : boolean,
  'quorum' : bigint,
  'validators' : Array<Validator>,
}
export interface _SERVICE {
  'add_contact' : ActorMethod<[AddContactArgs], Result>,
  'add_policy' : ActorMethod<[AddPolicyArgs], Result_1>,
  'add_secret' : ActorMethod<[AddSecretArgs], Result_2>,
  'confirm_x_out_of_y_condition' : ActorMethod<
    [ConfirmXOutOfYConditionArgs],
    Result_3
  >,
  'create_user' : ActorMethod<[AddOrUpdateUserArgs], Result_4>,
  'delete_user' : ActorMethod<[], Result_3>,
  'encrypted_ibe_decryption_key_for_caller' : ActorMethod<
    [Uint8Array | number[]],
    string
  >,
  'generate_vetkd_encrypted_symmetric_key_for_policy' : ActorMethod<
    [PolicyKeyDerviationArgs],
    Result_5
  >,
  'generate_vetkd_encrypted_symmetric_key_for_user' : ActorMethod<
    [Uint8Array | number[]],
    string
  >,
  'get_contact_list' : ActorMethod<[], Result_6>,
  'get_current_user' : ActorMethod<[], Result_4>,
  'get_encrypted_symmetric_key' : ActorMethod<[string], Result_7>,
  'get_encrypted_symmetric_key_as_beneficiary' : ActorMethod<
    [string, string],
    Result_7
  >,
  'get_policy_as_beneficiary' : ActorMethod<[string], Result_8>,
  'get_policy_as_owner' : ActorMethod<[string], Result_8>,
  'get_policy_as_validator' : ActorMethod<[string], Result_9>,
  'get_policy_list_as_beneficiary' : ActorMethod<[], Result_10>,
  'get_policy_list_as_owner' : ActorMethod<[], Result_10>,
  'get_policy_list_as_validator' : ActorMethod<[], Result_10>,
  'get_secret' : ActorMethod<[string], Result_2>,
  'get_secret_as_beneficiary' : ActorMethod<[string, string], Result_2>,
  'get_secret_list' : ActorMethod<[], Result_11>,
  'ibe_encryption_key' : ActorMethod<[], string>,
  'remove_contact' : ActorMethod<[string], Result_3>,
  'remove_policy' : ActorMethod<[string], Result_3>,
  'remove_secret' : ActorMethod<[string], Result_3>,
  'start_with_interval_secs' : ActorMethod<[bigint], undefined>,
  'symmetric_key_verification_key' : ActorMethod<[], string>,
  'update_contact' : ActorMethod<[Contact], Result>,
  'update_policy' : ActorMethod<[UpdatePolicyArgs], Result_1>,
  'update_secret' : ActorMethod<[UpdateSecretArgs], Result_2>,
  'update_user' : ActorMethod<[AddOrUpdateUserArgs], Result_4>,
  'update_user_login_date' : ActorMethod<[], Result_4>,
}
