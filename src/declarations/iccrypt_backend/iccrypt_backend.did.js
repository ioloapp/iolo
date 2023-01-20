export const idlFactory = ({ IDL }) => {
  const SecretCategory = IDL.Variant({
    'Password' : IDL.Null,
    'Note' : IDL.Null,
    'Wallet' : IDL.Null,
  });
  const Secret = IDL.Record({
    'id' : IDL.Text,
    'url' : IDL.Text,
    'username' : IDL.Text,
    'owner' : IDL.Principal,
    'password' : IDL.Text,
    'name' : IDL.Text,
    'category' : SecretCategory,
  });
  const User = IDL.Record({
    'id' : IDL.Principal,
    'last_login' : IDL.Opt(IDL.Nat64),
    'heirs' : IDL.Vec(IDL.Principal),
    'date_created' : IDL.Opt(IDL.Nat64),
  });
  const UserSafe = IDL.Record({
    'date_created' : IDL.Opt(IDL.Nat64),
    'owner' : User,
    'secrets' : IDL.Vec(IDL.Tuple(IDL.Text, Secret)),
    'date_modified' : IDL.Opt(IDL.Nat64),
  });
  return IDL.Service({
    'add_user_secret' : IDL.Func([IDL.Principal, Secret], [], []),
    'derive_key' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [IDL.Text],
        ['query'],
      ),
    'get_user_safe' : IDL.Func([IDL.Principal], [UserSafe], ['query']),
    'update_user_secret' : IDL.Func([IDL.Principal, Secret], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
