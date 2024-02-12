export const idlFactory = ({ IDL }) => {
  const UserType = IDL.Variant({ 'Company' : IDL.Null, 'Person' : IDL.Null });
  const AddContactArgs = IDL.Record({
    'id' : IDL.Text,
    'user_type' : IDL.Opt(UserType),
    'name' : IDL.Opt(IDL.Text),
    'email' : IDL.Opt(IDL.Text),
  });
  const Contact = IDL.Record({
    'id' : IDL.Text,
    'user_type' : IDL.Opt(UserType),
    'name' : IDL.Opt(IDL.Text),
    'email' : IDL.Opt(IDL.Text),
  });
  const SmartVaultErr = IDL.Variant({
    'ContactDoesNotExist' : IDL.Text,
    'UserAlreadyExists' : IDL.Text,
    'OnlyOwnerCanDeleteSecret' : IDL.Text,
    'SecretHasNoId' : IDL.Null,
    'UserDeletionFailed' : IDL.Text,
    'KeyBoxEntryDoesNotExistForSecret' : IDL.Text,
    'ContactAlreadyExists' : IDL.Text,
    'CallerNotBeneficiary' : IDL.Text,
    'SecretDoesNotExist' : IDL.Text,
    'NoPolicyForBeneficiary' : IDL.Text,
    'CallerNotPolicyOwner' : IDL.Text,
    'SecretEntryDoesNotExistForKeyBoxEntry' : IDL.Text,
    'Unauthorized' : IDL.Null,
    'UserUpdateFailed' : IDL.Text,
    'NoPolicyForValidator' : IDL.Text,
    'PolicyAlreadyExists' : IDL.Text,
    'PolicyDoesNotExist' : IDL.Text,
    'UserDoesNotExist' : IDL.Text,
    'SecretAlreadyExists' : IDL.Text,
    'InvalidPolicyCondition' : IDL.Null,
    'KeyGenerationNotAllowed' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : Contact, 'Err' : SmartVaultErr });
  const AddPolicyArgs = IDL.Record({ 'name' : IDL.Opt(IDL.Text) });
  const LogicalOperator = IDL.Variant({ 'Or' : IDL.Null, 'And' : IDL.Null });
  const TimeBasedCondition = IDL.Record({
    'id' : IDL.Text,
    'condition_status' : IDL.Bool,
    'number_of_days_since_last_login' : IDL.Nat64,
  });
  const Validator = IDL.Record({ 'id' : IDL.Text, 'status' : IDL.Bool });
  const XOutOfYCondition = IDL.Record({
    'id' : IDL.Text,
    'question' : IDL.Text,
    'condition_status' : IDL.Bool,
    'quorum' : IDL.Nat64,
    'validators' : IDL.Vec(Validator),
  });
  const Condition = IDL.Variant({
    'TimeBasedCondition' : TimeBasedCondition,
    'XOutOfYCondition' : XOutOfYCondition,
  });
  const Policy = IDL.Record({
    'id' : IDL.Text,
    'date_created' : IDL.Nat64,
    'owner' : IDL.Text,
    'name' : IDL.Opt(IDL.Text),
    'conditions_logical_operator' : IDL.Opt(LogicalOperator),
    'secrets' : IDL.Vec(IDL.Text),
    'conditions_status' : IDL.Bool,
    'beneficiaries' : IDL.Vec(IDL.Text),
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Vec(IDL.Nat8))),
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
    'encrypted_symmetric_key' : IDL.Vec(IDL.Nat8),
    'notes' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'category' : IDL.Opt(SecretCategory),
  });
  const Secret = IDL.Record({
    'id' : IDL.Text,
    'url' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'date_created' : IDL.Nat64,
    'owner' : IDL.Text,
    'password' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'name' : IDL.Opt(IDL.Text),
    'notes' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'category' : IDL.Opt(SecretCategory),
    'date_modified' : IDL.Nat64,
  });
  const Result_2 = IDL.Variant({ 'Ok' : Secret, 'Err' : SmartVaultErr });
  const Result_3 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : SmartVaultErr });
  const AddOrUpdateUserArgs = IDL.Record({
    'user_type' : IDL.Opt(UserType),
    'name' : IDL.Opt(IDL.Text),
    'email' : IDL.Opt(IDL.Text),
  });
  const User = IDL.Record({
    'id' : IDL.Text,
    'user_type' : IDL.Opt(UserType),
    'date_created' : IDL.Nat64,
    'contacts' : IDL.Vec(Contact),
    'name' : IDL.Opt(IDL.Text),
    'secrets' : IDL.Vec(IDL.Text),
    'date_last_login' : IDL.Opt(IDL.Nat64),
    'email' : IDL.Opt(IDL.Text),
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Vec(IDL.Nat8))),
    'date_modified' : IDL.Nat64,
    'policies' : IDL.Vec(IDL.Text),
  });
  const Result_4 = IDL.Variant({ 'Ok' : User, 'Err' : SmartVaultErr });
  const PolicyKeyDerviationArgs = IDL.Record({
    'encryption_public_key' : IDL.Vec(IDL.Nat8),
    'policy_id' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : SmartVaultErr });
  const Result_6 = IDL.Variant({
    'Ok' : IDL.Vec(Contact),
    'Err' : SmartVaultErr,
  });
  const Result_7 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Nat8),
    'Err' : SmartVaultErr,
  });
  const SecretListEntry = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Opt(IDL.Text),
    'category' : IDL.Opt(SecretCategory),
  });
  const PolicyWithSecretListEntries = IDL.Record({
    'id' : IDL.Text,
    'date_created' : IDL.Nat64,
    'owner' : IDL.Text,
    'name' : IDL.Opt(IDL.Text),
    'conditions_logical_operator' : IDL.Opt(LogicalOperator),
    'secrets' : IDL.Vec(SecretListEntry),
    'conditions_status' : IDL.Bool,
    'beneficiaries' : IDL.Vec(IDL.Text),
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Vec(IDL.Nat8))),
    'conditions' : IDL.Vec(Condition),
    'date_modified' : IDL.Nat64,
  });
  const Result_8 = IDL.Variant({
    'Ok' : PolicyWithSecretListEntries,
    'Err' : SmartVaultErr,
  });
  const PolicyListEntry = IDL.Record({
    'id' : IDL.Text,
    'owner' : IDL.Text,
    'condition_status' : IDL.Bool,
    'name' : IDL.Opt(IDL.Text),
  });
  const Result_9 = IDL.Variant({
    'Ok' : IDL.Vec(PolicyListEntry),
    'Err' : SmartVaultErr,
  });
  const Result_10 = IDL.Variant({
    'Ok' : IDL.Vec(SecretListEntry),
    'Err' : SmartVaultErr,
  });
  const UpdatePolicyArgs = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Opt(IDL.Text),
    'conditions_logical_operator' : IDL.Opt(LogicalOperator),
    'secrets' : IDL.Vec(IDL.Text),
    'beneficiaries' : IDL.Vec(IDL.Text),
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Vec(IDL.Nat8))),
    'conditions' : IDL.Vec(Condition),
  });
  const UpdateSecretArgs = IDL.Record({
    'id' : IDL.Text,
    'url' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'password' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'name' : IDL.Opt(IDL.Text),
    'notes' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'category' : IDL.Opt(SecretCategory),
  });
  return IDL.Service({
    'add_contact' : IDL.Func([AddContactArgs], [Result], []),
    'add_policy' : IDL.Func([AddPolicyArgs], [Result_1], []),
    'add_secret' : IDL.Func([AddSecretArgs], [Result_2], []),
    'confirm_x_out_of_y_condition' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Bool],
        [Result_3],
        [],
      ),
    'create_user' : IDL.Func([AddOrUpdateUserArgs], [Result_4], []),
    'delete_user' : IDL.Func([], [Result_3], []),
    'encrypted_ibe_decryption_key_for_caller' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Text],
        [],
      ),
    'generate_vetkd_encrypted_symmetric_key_for_policy' : IDL.Func(
        [PolicyKeyDerviationArgs],
        [Result_5],
        [],
      ),
    'generate_vetkd_encrypted_symmetric_key_for_user' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Text],
        [],
      ),
    'get_contact_list' : IDL.Func([], [Result_6], ['query']),
    'get_current_user' : IDL.Func([], [Result_4], ['query']),
    'get_encrypted_symmetric_key' : IDL.Func([IDL.Text], [Result_7], ['query']),
    'get_encrypted_symmetric_key_as_beneficiary' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_7],
        ['query'],
      ),
    'get_policy_as_beneficiary' : IDL.Func([IDL.Text], [Result_8], ['query']),
    'get_policy_as_owner' : IDL.Func([IDL.Text], [Result_8], ['query']),
    'get_policy_list_as_beneficiary' : IDL.Func([], [Result_9], ['query']),
    'get_policy_list_as_owner' : IDL.Func([], [Result_9], ['query']),
    'get_policy_list_as_validator' : IDL.Func([], [Result_9], ['query']),
    'get_secret' : IDL.Func([IDL.Text], [Result_2], ['query']),
    'get_secret_as_beneficiary' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_2],
        ['query'],
      ),
    'get_secret_list' : IDL.Func([], [Result_10], ['query']),
    'ibe_encryption_key' : IDL.Func([], [IDL.Text], []),
    'remove_contact' : IDL.Func([IDL.Text], [Result_3], []),
    'remove_policy' : IDL.Func([IDL.Text], [Result_3], []),
    'remove_secret' : IDL.Func([IDL.Text], [Result_3], []),
    'start_with_interval_secs' : IDL.Func([IDL.Nat64], [], []),
    'symmetric_key_verification_key' : IDL.Func([], [IDL.Text], []),
    'update_contact' : IDL.Func([Contact], [Result], []),
    'update_policy' : IDL.Func([UpdatePolicyArgs], [Result_1], []),
    'update_secret' : IDL.Func([UpdateSecretArgs], [Result_2], []),
    'update_user' : IDL.Func([AddOrUpdateUserArgs], [Result_4], []),
    'update_user_login_date' : IDL.Func([], [Result_4], []),
  });
};
export const init = ({ IDL }) => { return []; };
