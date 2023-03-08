export const idlFactory = ({ IDL }) => {
  const SecretCategory = IDL.Variant({
    'Password' : IDL.Null,
    'Note' : IDL.Null,
    'Document' : IDL.Null,
  });
  const SecretForCreation = IDL.Record({
    'url' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Text),
    'password' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'notes' : IDL.Opt(IDL.Text),
    'category' : SecretCategory,
  });
  const SmartVaultErr = IDL.Variant({
    'UserAlreadyExists' : IDL.Text,
    'SecretHasNoId' : IDL.Null,
    'UserDeletionFailed' : IDL.Text,
    'SecretDoesNotExist' : IDL.Text,
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
  const SecretForUpdate = IDL.Record({
    'id' : IDL.Nat,
    'url' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Text),
    'password' : IDL.Opt(IDL.Text),
    'name' : IDL.Opt(IDL.Text),
    'notes' : IDL.Opt(IDL.Text),
    'category' : IDL.Opt(SecretCategory),
  });
  return IDL.Service({
    'add_user_secret' : IDL.Func([SecretForCreation], [Result], []),
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
    'update_user_secret' : IDL.Func([SecretForUpdate], [Result_2], []),
  });
};
export const init = ({ IDL }) => { return []; };
