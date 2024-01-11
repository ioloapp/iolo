use candid::types::principal::{Principal, PrincipalError};

use ic_stable_structures::{storable::Bound, Storable};
use serde::{Deserialize, Serialize};
use std::{
    borrow::Cow,
    convert::TryFrom,
    error::Error,
    fmt,
    hash::{Hash, Hasher},
};

/// The type representing principals as described in the [interface
/// spec](https://sdk.dfinity.org/docs/interface-spec/index.html#_principals).
///
/// A principal is just a blob that is displayed in a particular way.
/// (see <https://sdk.dfinity.org/docs/interface-spec/index.html#textual-ids>)
///
/// Principals have variable length, bounded by 29 bytes. Since we
/// want [`PrincipalStorable`] to implement the Copy trait, we encode them as
/// a fixed-size array and a length.
#[derive(Clone, Copy, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[repr(transparent)]
#[serde(transparent)]
pub struct PrincipalStorable(Principal);

impl PartialEq for PrincipalStorable {
    fn eq(&self, other: &PrincipalStorable) -> bool {
        self.0 == other.0
    }
}

impl Hash for PrincipalStorable {
    fn hash<H: Hasher>(&self, state: &mut H) {
        let slice = self.0.as_slice();
        slice.len().hash(state);
        let mut array = [0; Self::MAX_LENGTH_IN_BYTES];
        array[..slice.len()].copy_from_slice(slice);
        array.hash(state);
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[repr(transparent)]
#[serde(transparent)]
pub struct PrincipalStorableError(pub PrincipalError);

impl PrincipalStorableError {
    #[allow(non_snake_case)]
    pub fn TooLong(_: usize) -> Self {
        PrincipalStorableError(PrincipalError::BytesTooLong())
    }
}

impl Error for PrincipalStorableError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        self.0.source()
    }
}

impl fmt::Display for PrincipalStorableError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Default for PrincipalStorable {
    fn default() -> Self {
        PrincipalStorable(Principal::management_canister())
    }
}

impl From<Principal> for PrincipalStorable {
    fn from(p: Principal) -> PrincipalStorable {
        PrincipalStorable(p)
    }
}
impl From<PrincipalStorable> for Principal {
    fn from(p: PrincipalStorable) -> Principal {
        p.0
    }
}

impl PrincipalStorable {
    pub const MAX_LENGTH_IN_BYTES: usize = 29;
    // const HASH_LEN_IN_BYTES: usize = 28;

    pub fn as_slice(&self) -> &[u8] {
        self.0.as_slice()
    }

    pub fn to_vec(&self) -> Vec<u8> {
        self.as_slice().to_vec()
    }

    pub fn into_vec(self) -> Vec<u8> {
        self.to_vec()
    }
}

impl fmt::Display for PrincipalStorable {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl fmt::Debug for PrincipalStorable {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<PrincipalStorable> for Vec<u8> {
    fn from(val: PrincipalStorable) -> Self {
        val.to_vec()
    }
}

/// The [`TryFrom`] trait should only be used when parsing data; fresh ids
/// should always be created with the functions below (PrincipalId::new_*)
impl TryFrom<&[u8]> for PrincipalStorable {
    type Error = PrincipalStorableError;

    fn try_from(blob: &[u8]) -> Result<Self, Self::Error> {
        Principal::try_from(blob)
            .map(Self)
            .map_err(PrincipalStorableError)
    }
}

impl TryFrom<Vec<u8>> for PrincipalStorable {
    type Error = PrincipalStorableError;

    fn try_from(blob: Vec<u8>) -> Result<Self, Self::Error> {
        Principal::try_from(blob)
            .map(Self)
            .map_err(PrincipalStorableError)
    }
}
impl TryFrom<&Vec<u8>> for PrincipalStorable {
    type Error = PrincipalStorableError;

    fn try_from(blob: &Vec<u8>) -> Result<Self, Self::Error> {
        Principal::try_from(blob)
            .map(Self)
            .map_err(PrincipalStorableError)
    }
}

impl AsRef<[u8]> for PrincipalStorable {
    fn as_ref(&self) -> &[u8] {
        self.as_slice()
    }
}

impl std::str::FromStr for PrincipalStorable {
    type Err = PrincipalStorableError;

    fn from_str(input: &str) -> Result<Self, Self::Err> {
        Principal::from_str(input)
            .map(Self)
            .map_err(PrincipalStorableError)
    }
}

/// Super trait implementation for the BoundedStorable trait on PrincipalId for use
/// in StableStructures
impl Storable for PrincipalStorable {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.to_vec().into()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        PrincipalStorable::try_from(&bytes[..]).expect("Cannot decode PrincipalId")
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: PrincipalStorable::MAX_LENGTH_IN_BYTES as u32,
        is_fixed_size: false,
    };
}

// /// Impl of the BoundedStorable trait on PrincipalId for use in StableStructures
// impl BoundedStorable for PrincipalId {
//     /// The upper bound of a PrincipalId is 29 bytes.
//     const MAX_SIZE: u32 = Self::MAX_LENGTH_IN_BYTES as u32;

//     /// PrincipalIds can be variable length.
//     const IS_FIXED_SIZE: bool = false;
// }
