export const idlFactory = ({ IDL }) => {
  const SecretCategory = IDL.Variant({
    'Password' : IDL.Null,
    'Note' : IDL.Null,
    'Document' : IDL.Null,
  });
  const SmartVaultErr = IDL.Variant({
    'UserAlreadyExists' : IDL.Text,
    'UserDeletionFailed' : IDL.Text,
    'UserVaultCreationFailed' : IDL.Text,
    'UserDoesNotExist' : IDL.Text,
    'UserVaultDoesNotExist' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : SmartVaultErr });
  const User = IDL.Record({
    'id' : IDL.Principal,
    'date_created' : IDL.Nat64,
    'date_last_login' : IDL.Opt(IDL.Nat64),
    'user_vault_id' : IDL.Nat,
    'date_modified' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : User, 'Err' : SmartVaultErr });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : SmartVaultErr });
  const Secret = IDL.Record({
    'id' : IDL.Nat,
    'url' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Text),
    'date_created' : IDL.Nat64,
    'password' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'notes' : IDL.Opt(IDL.Text),
    'category' : SecretCategory,
    'date_modified' : IDL.Nat64,
  });
  const UserVault = IDL.Record({
    'id' : IDL.Nat,
    'date_created' : IDL.Nat64,
    'secrets' : IDL.Vec(IDL.Tuple(IDL.Nat, Secret)),
    'date_modified' : IDL.Nat64,
  });
  const Result_3 = IDL.Variant({ 'Ok' : UserVault, 'Err' : SmartVaultErr });
  return IDL.Service({
    'add_user_secret' : IDL.Func([SecretCategory, IDL.Text], [Result], []),
    'create_user' : IDL.Func([], [Result_1], []),
    'delete_user' : IDL.Func([], [Result_2], []),
    'get_decryption_key_from' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
      ),
    'get_encryption_key_for' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
      ),
    'get_user_vault' : IDL.Func([], [Result_3], ['query']),
    'is_user_vault_existing' : IDL.Func([], [IDL.Bool], ['query']),
    'update_user_secret' : IDL.Func([Secret], [Result_2], []),
  });
};
export const init = ({ IDL }) => { return []; };
