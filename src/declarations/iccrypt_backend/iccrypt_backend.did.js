export const idlFactory = ({ IDL }) => {
  const UserType = IDL.Variant({ 'Company' : IDL.Null, 'Person' : IDL.Null });
  const AddUserArgs = IDL.Record({
    'id' : IDL.Principal,
    'user_type' : IDL.Opt(UserType),
    'name' : IDL.Opt(IDL.Text),
    'email' : IDL.Opt(IDL.Text),
  });
  const User = IDL.Record({
    'id' : IDL.Principal,
    'user_type' : IDL.Opt(UserType),
    'date_created' : IDL.Nat64,
    'name' : IDL.Opt(IDL.Text),
    'date_last_login' : IDL.Opt(IDL.Nat64),
    'email' : IDL.Opt(IDL.Text),
    'user_vault_id' : IDL.Opt(IDL.Nat),
    'date_modified' : IDL.Nat64,
  });
  const SmartVaultErr = IDL.Variant({
    'UserAlreadyExists' : IDL.Text,
    'SecretHasNoId' : IDL.Null,
    'UserDeletionFailed' : IDL.Text,
    'SecretDoesNotExist' : IDL.Text,
    'TestamentAlreadyExists' : IDL.Text,
    'TestamentDoesNotExist' : IDL.Text,
    'UserVaultCreationFailed' : IDL.Text,
    'UserDoesNotExist' : IDL.Text,
    'UserVaultDoesNotExist' : IDL.Text,
    'SecretAlreadyExists' : IDL.Text,
    'NoTestamentsForHeir' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : User, 'Err' : SmartVaultErr });
  const SecretSymmetricCryptoMaterial = IDL.Record({
    'iv' : IDL.Vec(IDL.Nat8),
    'password_decryption_nonce' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'notes_decryption_nonce' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'encrypted_symmetric_key' : IDL.Vec(IDL.Nat8),
    'username_decryption_nonce' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const SecretCategory = IDL.Variant({
    'Password' : IDL.Null,
    'Note' : IDL.Null,
    'Document' : IDL.Null,
  });
  const AddSecretArgs = IDL.Record({
    'id' : IDL.Text,
    'url' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'password' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'name' : IDL.Opt(IDL.Text),
    'symmetric_crypto_material' : SecretSymmetricCryptoMaterial,
    'notes' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'category' : IDL.Opt(SecretCategory),
  });
  const Secret = IDL.Record({
    'id' : IDL.Text,
    'url' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'date_created' : IDL.Nat64,
    'password' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'name' : IDL.Opt(IDL.Text),
    'notes' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'category' : IDL.Opt(SecretCategory),
    'date_modified' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : Secret, 'Err' : SmartVaultErr });
  const AddTestamentArgs = IDL.Record({
    'id' : IDL.Text,
    'heirs' : IDL.Vec(IDL.Principal),
    'name' : IDL.Opt(IDL.Text),
    'secrets' : IDL.Vec(IDL.Text),
    'condition_arg' : IDL.Nat64,
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Text, SecretSymmetricCryptoMaterial)),
  });
  const Testament = IDL.Record({
    'id' : IDL.Text,
    'heirs' : IDL.Vec(IDL.Principal),
    'date_created' : IDL.Nat64,
    'condition_status' : IDL.Bool,
    'name' : IDL.Opt(IDL.Text),
    'testator' : IDL.Principal,
    'secrets' : IDL.Vec(IDL.Text),
    'condition_arg' : IDL.Nat64,
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Text, SecretSymmetricCryptoMaterial)),
    'date_modified' : IDL.Nat64,
  });
  const Result_2 = IDL.Variant({ 'Ok' : Testament, 'Err' : SmartVaultErr });
  const Result_3 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : SmartVaultErr });
  const TestamentKeyDerviationArgs = IDL.Record({
    'encryption_public_key' : IDL.Vec(IDL.Nat8),
    'testament_id' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'Ok' : IDL.Vec(User), 'Err' : SmartVaultErr });
  const SecretListEntry = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Opt(IDL.Text),
    'category' : IDL.Opt(SecretCategory),
  });
  const Result_5 = IDL.Variant({
    'Ok' : IDL.Vec(SecretListEntry),
    'Err' : SmartVaultErr,
  });
  const Result_6 = IDL.Variant({
    'Ok' : SecretSymmetricCryptoMaterial,
    'Err' : SmartVaultErr,
  });
  const TestamentListEntry = IDL.Record({
    'id' : IDL.Text,
    'condition_status' : IDL.Bool,
    'name' : IDL.Opt(IDL.Text),
    'testator' : IDL.Principal,
  });
  const Result_7 = IDL.Variant({
    'Ok' : IDL.Opt(IDL.Vec(TestamentListEntry)),
    'Err' : SmartVaultErr,
  });
  const Result_8 = IDL.Variant({
    'Ok' : IDL.Vec(TestamentListEntry),
    'Err' : SmartVaultErr,
  });
  return IDL.Service({
    'add_heir' : IDL.Func([AddUserArgs], [Result], []),
    'add_secret' : IDL.Func([AddSecretArgs], [Result_1], []),
    'add_testament' : IDL.Func([AddTestamentArgs], [Result_2], []),
    'create_user' : IDL.Func([], [Result], []),
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
    'encrypted_symmetric_key_for_testament' : IDL.Func(
        [TestamentKeyDerviationArgs],
        [IDL.Text],
        [],
      ),
    'encrypted_symmetric_key_for_uservault' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Text],
        [],
      ),
    'get_heir_list' : IDL.Func([], [Result_4], ['query']),
    'get_secret' : IDL.Func([IDL.Text], [Result_1], ['query']),
    'get_secret_list' : IDL.Func([], [Result_5], ['query']),
    'get_secret_symmetric_crypto_material' : IDL.Func(
        [IDL.Text],
        [Result_6],
        ['query'],
      ),
    'get_testament' : IDL.Func([IDL.Text], [Result_2], ['query']),
    'get_testament_list_as_heir' : IDL.Func([], [Result_7], ['query']),
    'get_testament_list_as_testator' : IDL.Func([], [Result_8], ['query']),
    'ibe_encryption_key' : IDL.Func([], [IDL.Text], []),
    'is_user_vault_existing' : IDL.Func([], [IDL.Bool], ['query']),
    'remove_heir' : IDL.Func([IDL.Principal], [Result_3], []),
    'remove_secret' : IDL.Func([IDL.Text], [Result_3], []),
    'remove_testament' : IDL.Func([IDL.Text], [Result_3], []),
    'symmetric_key_verification_key' : IDL.Func([], [IDL.Text], []),
    'update_heir' : IDL.Func([User], [Result], []),
    'update_secret' : IDL.Func([Secret], [Result_1], []),
    'update_testament' : IDL.Func([Testament], [Result_2], []),
    'update_user_login_date' : IDL.Func([], [Result], []),
    'what_time_is_it' : IDL.Func([], [IDL.Nat64], ['query']),
    'who_am_i' : IDL.Func([], [IDL.Text], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
