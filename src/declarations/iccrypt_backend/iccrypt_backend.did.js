export const idlFactory = ({ IDL }) => {
  const SecretCategory = IDL.Variant({
    'Password' : IDL.Null,
    'Note' : IDL.Null,
    'Document' : IDL.Null,
  });
  const User = IDL.Record({
    'id' : IDL.Principal,
    'date_created' : IDL.Nat64,
    'date_last_login' : IDL.Opt(IDL.Nat64),
    'date_modified' : IDL.Nat64,
  });
  const SmartVaultErr = IDL.Variant({
    'UserAlreadyExists' : IDL.Text,
    'UserVaultAlreadyExists' : IDL.Text,
    'UserVaultCreationFailed' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : User, 'Err' : SmartVaultErr });
  const Secret = IDL.Record({
    'id' : IDL.Text,
    'url' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Text),
    'date_created' : IDL.Nat64,
    'owner' : IDL.Principal,
    'password' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'notes' : IDL.Opt(IDL.Text),
    'category' : SecretCategory,
    'date_modified' : IDL.Nat64,
  });
  const UserVault = IDL.Record({
    'date_created' : IDL.Nat64,
    'owner' : IDL.Principal,
    'secrets' : IDL.Vec(IDL.Tuple(IDL.Text, Secret)),
    'date_modified' : IDL.Nat64,
  });
  return IDL.Service({
    'add_user_secret' : IDL.Func([SecretCategory, IDL.Text], [], []),
    'create_user' : IDL.Func([], [Result], []),
    'delete_user' : IDL.Func([], [], []),
    'get_decryption_key_from' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
      ),
    'get_encryption_key_for' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
      ),
    'get_user_vault' : IDL.Func([], [IDL.Opt(UserVault)], ['query']),
    'give_me_a_new_uuid' : IDL.Func([], [IDL.Text], []),
    'is_user_vault_existing' : IDL.Func([], [IDL.Bool], ['query']),
    'update_user_secret' : IDL.Func([Secret], [], []),
    'what_time_is_it' : IDL.Func([], [IDL.Nat64], ['query']),
    'who_am_i' : IDL.Func([], [IDL.Text], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
