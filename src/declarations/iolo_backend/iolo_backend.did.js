export const idlFactory = ({ IDL }) => {
  const UserType = IDL.Variant({ 'Company' : IDL.Null, 'Person' : IDL.Null });
  const AddUserArgs = IDL.Record({
    'id' : IDL.Principal,
    'user_type' : IDL.Opt(UserType),
    'name' : IDL.Opt(IDL.Text),
    'email' : IDL.Opt(IDL.Text),
  });
  const SecretSymmetricCryptoMaterial = IDL.Record({
    'iv' : IDL.Vec(IDL.Nat8),
    'encrypted_symmetric_key' : IDL.Vec(IDL.Nat8),
  });
  const User = IDL.Record({
    'id' : IDL.Principal,
    'user_type' : IDL.Opt(UserType),
    'date_created' : IDL.Nat64,
    'name' : IDL.Opt(IDL.Text),
    'secrets' : IDL.Vec(IDL.Nat),
    'date_last_login' : IDL.Opt(IDL.Nat64),
    'email' : IDL.Opt(IDL.Text),
    'user_vault_id' : IDL.Opt(IDL.Nat),
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Nat, SecretSymmetricCryptoMaterial)),
    'date_modified' : IDL.Nat64,
    'policies' : IDL.Vec(IDL.Nat),
  });
  const SmartVaultErr = IDL.Variant({
    'UserAlreadyExists' : IDL.Text,
    'SecretHasNoId' : IDL.Null,
    'UserDeletionFailed' : IDL.Text,
    'SecretDoesNotExist' : IDL.Text,
    'NoPolicyForBeneficiary' : IDL.Text,
    'SecretDecryptionMaterialDoesNotExist' : IDL.Text,
    'Unauthorized' : IDL.Null,
    'UserUpdateFailed' : IDL.Text,
    'PolicyAlreadyExists' : IDL.Text,
    'UserVaultCreationFailed' : IDL.Text,
    'PolicyDoesNotExist' : IDL.Text,
    'UserDoesNotExist' : IDL.Text,
    'UserVaultDoesNotExist' : IDL.Text,
    'SecretAlreadyExists' : IDL.Text,
    'InvalidPolicyCondition' : IDL.Null,
    'KeyGenerationNotAllowed' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : User, 'Err' : SmartVaultErr });
  const LogicalOperator = IDL.Variant({ 'Or' : IDL.Null, 'And' : IDL.Null });
  const TimeBasedCondition = IDL.Record({
    'id' : IDL.Text,
    'condition_status' : IDL.Bool,
    'number_of_days_since_last_login' : IDL.Nat64,
  });
  const Validator = IDL.Record({ 'id' : IDL.Principal, 'status' : IDL.Bool });
  const XOutOfYCondition = IDL.Record({
    'id' : IDL.Text,
    'condition_status' : IDL.Bool,
    'quorum' : IDL.Nat64,
    'validators' : IDL.Vec(Validator),
  });
  const Condition = IDL.Variant({
    'TimeBasedCondition' : TimeBasedCondition,
    'XOutOfYCondition' : XOutOfYCondition,
  });
  const AddPolicyArgs = IDL.Record({
    'id' : IDL.Text,
    'condition_logical_operator' : LogicalOperator,
    'name' : IDL.Opt(IDL.Text),
    'secrets' : IDL.Vec(IDL.Text),
    'beneficiaries' : IDL.Vec(IDL.Principal),
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Nat, SecretSymmetricCryptoMaterial)),
    'conditions' : IDL.Vec(Condition),
  });
  const Policy = IDL.Record({
    'id' : IDL.Text,
    'date_created' : IDL.Nat64,
    'owner' : IDL.Principal,
    'name' : IDL.Opt(IDL.Text),
    'conditions_logical_operator' : LogicalOperator,
    'secrets' : IDL.Vec(IDL.Text),
    'conditions_status' : IDL.Bool,
    'beneficiaries' : IDL.Vec(IDL.Principal),
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Nat, SecretSymmetricCryptoMaterial)),
    'conditions' : IDL.Vec(Condition),
    'date_modified' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : Policy, 'Err' : SmartVaultErr });
  const SecretCategory = IDL.Variant({
    'Password' : IDL.Null,
    'Note' : IDL.Null,
    'Document' : IDL.Null,
  });
  const AddSecretArgs = IDL.Record({
    'url' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'password' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'name' : IDL.Opt(IDL.Text),
    'symmetric_crypto_material' : SecretSymmetricCryptoMaterial,
    'notes' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'category' : IDL.Opt(SecretCategory),
  });
  const Secret = IDL.Record({
    'id' : IDL.Nat,
    'url' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'date_created' : IDL.Nat64,
    'owner' : IDL.Principal,
    'password' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'name' : IDL.Opt(IDL.Text),
    'notes' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'category' : IDL.Opt(SecretCategory),
    'date_modified' : IDL.Nat64,
  });
  const Result_2 = IDL.Variant({ 'Ok' : Secret, 'Err' : SmartVaultErr });
  const Result_3 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : SmartVaultErr });
  const PolicyKeyDerviationArgs = IDL.Record({
    'encryption_public_key' : IDL.Vec(IDL.Nat8),
    'policy_id' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : SmartVaultErr });
  const Result_5 = IDL.Variant({ 'Ok' : IDL.Vec(User), 'Err' : SmartVaultErr });
  const SecretListEntry = IDL.Record({
    'id' : IDL.Nat,
    'name' : IDL.Opt(IDL.Text),
    'category' : IDL.Opt(SecretCategory),
  });
  const PolicyResponse = IDL.Record({
    'id' : IDL.Text,
    'date_created' : IDL.Nat64,
    'owner' : IDL.Principal,
    'name' : IDL.Opt(IDL.Text),
    'conditions_logical_operator' : LogicalOperator,
    'secrets' : IDL.Vec(SecretListEntry),
    'conditions_status' : IDL.Bool,
    'beneficiaries' : IDL.Vec(IDL.Principal),
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Nat, SecretSymmetricCryptoMaterial)),
    'conditions' : IDL.Vec(Condition),
    'date_modified' : IDL.Nat64,
  });
  const Result_6 = IDL.Variant({
    'Ok' : PolicyResponse,
    'Err' : SmartVaultErr,
  });
  const PolicyListEntry = IDL.Record({
    'id' : IDL.Text,
    'owner' : IDL.Principal,
    'condition_status' : IDL.Bool,
    'name' : IDL.Opt(IDL.Text),
  });
  const Result_7 = IDL.Variant({
    'Ok' : IDL.Vec(PolicyListEntry),
    'Err' : SmartVaultErr,
  });
  const Result_8 = IDL.Variant({
    'Ok' : IDL.Vec(SecretListEntry),
    'Err' : SmartVaultErr,
  });
  const Result_9 = IDL.Variant({
    'Ok' : SecretSymmetricCryptoMaterial,
    'Err' : SmartVaultErr,
  });
  return IDL.Service({
    'add_beneficiary' : IDL.Func([AddUserArgs], [Result], []),
    'add_policy' : IDL.Func([AddPolicyArgs], [Result_1], []),
    'add_secret' : IDL.Func([AddSecretArgs], [Result_2], []),
    'confirm_x_out_of_y_condition' : IDL.Func(
        [IDL.Principal, IDL.Text, IDL.Bool],
        [Result_3],
        [],
      ),
    'create_user' : IDL.Func([AddUserArgs], [Result], []),
    'delete_user' : IDL.Func([], [Result_3], []),
    'encrypted_ibe_decryption_key_for_caller' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Text],
        [],
      ),
    'encrypted_symmetric_key_for_caller' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Text],
        [],
      ),
    'encrypted_symmetric_key_for_policies' : IDL.Func(
        [PolicyKeyDerviationArgs],
        [Result_4],
        [],
      ),
    'encrypted_symmetric_key_for_uservault' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Text],
        [],
      ),
    'get_beneficiary_list' : IDL.Func([], [Result_5], ['query']),
    'get_current_user' : IDL.Func([], [Result], ['query']),
    'get_policy_as_beneficiary' : IDL.Func([IDL.Text], [Result_6], ['query']),
    'get_policy_as_owner' : IDL.Func([IDL.Text], [Result_6], ['query']),
    'get_policy_list_as_beneficiary' : IDL.Func([], [Result_7], ['query']),
    'get_policy_list_as_owner' : IDL.Func([], [Result_7], ['query']),
    'get_policy_list_as_validator' : IDL.Func([], [Result_7], ['query']),
    'get_secret' : IDL.Func([IDL.Nat], [Result_2], ['query']),
    'get_secret_as_beneficiary' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_2],
        ['query'],
      ),
    'get_secret_list' : IDL.Func([], [Result_8], ['query']),
    'get_secret_symmetric_crypto_material' : IDL.Func(
        [IDL.Nat],
        [Result_9],
        ['query'],
      ),
    'get_secret_symmetric_crypto_material_as_beneficiary' : IDL.Func(
        [IDL.Nat, IDL.Text],
        [Result_9],
        ['query'],
      ),
    'ibe_encryption_key' : IDL.Func([], [IDL.Text], []),
    'is_user_vault_existing' : IDL.Func([], [IDL.Bool], ['query']),
    'remove_beneficiary' : IDL.Func([IDL.Principal], [Result_3], []),
    'remove_policy' : IDL.Func([IDL.Text], [Result_3], []),
    'remove_secret' : IDL.Func([IDL.Text], [Result_3], []),
    'symmetric_key_verification_key' : IDL.Func([], [IDL.Text], []),
    'update_beneficiary' : IDL.Func([User], [Result], []),
    'update_policy' : IDL.Func([Policy], [Result_1], []),
    'update_secret' : IDL.Func([Secret], [Result_2], []),
    'update_user' : IDL.Func([User], [Result], []),
    'update_user_login_date' : IDL.Func([], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
