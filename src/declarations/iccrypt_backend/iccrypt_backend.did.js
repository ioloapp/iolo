export const idlFactory = ({ IDL }) => {
  const SecretCategory = IDL.Variant({
    'Password' : IDL.Null,
    'CryptoWallet' : IDL.Null,
  });
  const Secret = IDL.Record({
    'id' : IDL.Text,
    'url' : IDL.Text,
    'username' : IDL.Text,
    'owner' : IDL.Text,
    'password' : IDL.Text,
    'name' : IDL.Text,
    'category' : SecretCategory,
  });
  return IDL.Service({
    'add_test_secrets' : IDL.Func([], [], []),
    'add_user_secret' : IDL.Func([IDL.Text, Secret], [], []),
    'get_all_secrets' : IDL.Func([], [IDL.Vec(Secret)], ['query']),
    'get_user_secrets' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(IDL.Tuple(IDL.Text, Secret))],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
