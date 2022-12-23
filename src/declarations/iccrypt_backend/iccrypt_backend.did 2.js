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
    'heirs' : IDL.Vec(IDL.Text),
    'date_created' : IDL.Opt(IDL.Nat64),
    'owner' : User,
    'secrets' : IDL.Vec(IDL.Tuple(IDL.Text, Secret)),
    'date_modified' : IDL.Opt(IDL.Nat64),
  });
  return IDL.Service({
    'add_user_secret' : IDL.Func([IDL.Principal, Secret], [], []),
    'get_user_safe' : IDL.Func([IDL.Principal], [UserSafe], ['query']),
    'say_hi' : IDL.Func([], [IDL.Text], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
