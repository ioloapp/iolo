export const idlFactory = ({ IDL }) => {
  const SecretCategory = IDL.Variant({
    'Password' : IDL.Null,
    'Note' : IDL.Null,
    'Document' : IDL.Null,
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
  const SecretDecryptionMaterial = IDL.Record({
    'iv' : IDL.Vec(IDL.Nat8),
    'password_decryption_nonce' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'notes_decryption_nonce' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'encrypted_decryption_key' : IDL.Vec(IDL.Nat8),
    'username_decryption_nonce' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const AddSecretArgs = IDL.Record({
    'secret' : Secret,
    'decryption_material' : SecretDecryptionMaterial,
  });
  const SmartVaultErr = IDL.Variant({
    'UserAlreadyExists' : IDL.Text,
    'SecretHasNoId' : IDL.Null,
    'SecretDoesAlreadyExist' : IDL.Text,
    'UserDeletionFailed' : IDL.Text,
    'SecretDoesNotExist' : IDL.Text,
    'TestamentAlreadyExists' : IDL.Text,
    'TestamentDoesNotExist' : IDL.Text,
    'UserVaultCreationFailed' : IDL.Text,
    'UserDoesNotExist' : IDL.Text,
    'UserVaultDoesNotExist' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : Secret, 'Err' : SmartVaultErr });
  const Testament = IDL.Record({
    'id' : IDL.Nat,
    'heirs' : IDL.Vec(IDL.Principal),
    'date_created' : IDL.Nat64,
    'name' : IDL.Opt(IDL.Text),
    'testator' : IDL.Principal,
    'secrets' : IDL.Vec(IDL.Text),
    'key_box' : IDL.Vec(IDL.Tuple(IDL.Text, SecretDecryptionMaterial)),
    'date_modified' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : Testament, 'Err' : SmartVaultErr });
  const User = IDL.Record({
    'id' : IDL.Principal,
    'date_created' : IDL.Nat64,
    'date_last_login' : IDL.Opt(IDL.Nat64),
    'user_vault_id' : IDL.Nat,
    'date_modified' : IDL.Nat64,
  });
  const Result_2 = IDL.Variant({ 'Ok' : User, 'Err' : SmartVaultErr });
  const Result_3 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : SmartVaultErr });
  const TestamentKeyDerviationArgs = IDL.Record({
    'encryption_public_key' : IDL.Vec(IDL.Nat8),
    'testament_id' : IDL.Nat,
  });
  const Result_4 = IDL.Variant({
    'Ok' : SecretDecryptionMaterial,
    'Err' : SmartVaultErr,
  });
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
    'Ok' : IDL.Vec(Testament),
    'Err' : SmartVaultErr,
  });
  return IDL.Service({
    'add_secret' : IDL.Func([AddSecretArgs], [Result], []),
    'create_testament' : IDL.Func([IDL.Record({})], [Result_1], []),
    'create_user' : IDL.Func([], [Result_2], []),
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
    'get_secret_decryption_material' : IDL.Func(
        [IDL.Text],
        [Result_4],
        ['query'],
      ),
    'get_secret_list' : IDL.Func([], [Result_5], ['query']),
    'get_testament_list' : IDL.Func([], [Result_6], ['query']),
    'ibe_encryption_key' : IDL.Func([], [IDL.Text], []),
    'is_user_vault_existing' : IDL.Func([], [IDL.Bool], ['query']),
    'remove_user_secret' : IDL.Func([IDL.Text], [Result_3], []),
    'symmetric_key_verification_key' : IDL.Func([], [IDL.Text], []),
    'update_secret' : IDL.Func([Secret], [Result], []),
    'update_testament' : IDL.Func([Testament], [Result_1], []),
    'what_time_is_it' : IDL.Func([], [IDL.Nat64], ['query']),
    'who_am_i' : IDL.Func([], [IDL.Text], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
