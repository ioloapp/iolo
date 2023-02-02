export const idlFactory = ({ IDL }) => {
  const SecretCategory = IDL.Variant({
    'Password' : IDL.Null,
    'Note' : IDL.Null,
    'Document' : IDL.Null,
  });
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
  const UserSafe = IDL.Record({
    'date_created' : IDL.Nat64,
    'owner' : IDL.Principal,
    'secrets' : IDL.Vec(IDL.Tuple(IDL.Text, Secret)),
    'date_modified' : IDL.Nat64,
  });
  return IDL.Service({
    'add_user_secret' : IDL.Func([IDL.Principal, Secret], [], []),
    'derive_key' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [IDL.Text],
        ['query'],
      ),
    'get_user_safe' : IDL.Func([IDL.Principal], [UserSafe], ['query']),
    'give_me_a_new_uuid' : IDL.Func([], [IDL.Text], ['query']),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'update_user_secret' : IDL.Func([IDL.Principal, Secret], [], []),
    'what_time_is_it' : IDL.Func([], [IDL.Nat64], ['query']),
    'who_am_i' : IDL.Func([], [IDL.Text], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
