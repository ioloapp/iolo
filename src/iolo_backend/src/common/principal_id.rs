use candid::types::principal::{Principal, PrincipalError};

use ic_stable_structures::{Storable, storable::Bound};
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
/// want [`PrincipalId`] to implement the Copy trait, we encode them as
/// a fixed-size array and a length.
#[derive(Clone, Copy, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[repr(transparent)]
#[serde(transparent)]
pub struct PrincipalId(Principal);

impl PartialEq for PrincipalId {
    fn eq(&self, other: &PrincipalId) -> bool {
        self.0 == other.0
    }
}

impl Hash for PrincipalId {
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
pub struct PrincipalIdError(pub PrincipalError);

impl PrincipalIdError {
    #[allow(non_snake_case)]
    pub fn TooLong(_: usize) -> Self {
        PrincipalIdError(PrincipalError::BytesTooLong())
    }
}

impl Error for PrincipalIdError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        self.0.source()
    }
}

impl fmt::Display for PrincipalIdError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Default for PrincipalId {
    fn default() -> Self {
        PrincipalId(Principal::management_canister())
    }
}

impl From<Principal> for PrincipalId {
    fn from(p: Principal) -> PrincipalId {
        PrincipalId(p)
    }
}
impl From<PrincipalId> for Principal {
    fn from(p: PrincipalId) -> Principal {
        p.0
    }
}

impl PrincipalId {
    pub const MAX_LENGTH_IN_BYTES: usize = 29;
    const HASH_LEN_IN_BYTES: usize = 28;

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

impl fmt::Display for PrincipalId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl fmt::Debug for PrincipalId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<PrincipalId> for Vec<u8> {
    fn from(val: PrincipalId) -> Self {
        val.to_vec()
    }
}

/// The [`TryFrom`] trait should only be used when parsing data; fresh ids
/// should always be created with the functions below (PrincipalId::new_*)
impl TryFrom<&[u8]> for PrincipalId {
    type Error = PrincipalIdError;

    fn try_from(blob: &[u8]) -> Result<Self, Self::Error> {
        Principal::try_from(blob)
            .map(Self)
            .map_err(PrincipalIdError)
    }
}

impl TryFrom<Vec<u8>> for PrincipalId {
    type Error = PrincipalIdError;

    fn try_from(blob: Vec<u8>) -> Result<Self, Self::Error> {
        Principal::try_from(blob)
            .map(Self)
            .map_err(PrincipalIdError)
    }
}
impl TryFrom<&Vec<u8>> for PrincipalId {
    type Error = PrincipalIdError;

    fn try_from(blob: &Vec<u8>) -> Result<Self, Self::Error> {
        Principal::try_from(blob)
            .map(Self)
            .map_err(PrincipalIdError)
    }
}

impl AsRef<[u8]> for PrincipalId {
    fn as_ref(&self) -> &[u8] {
        self.as_slice()
    }
}

impl std::str::FromStr for PrincipalId {
    type Err = PrincipalIdError;

    fn from_str(input: &str) -> Result<Self, Self::Err> {
        Principal::from_str(input)
            .map(Self)
            .map_err(PrincipalIdError)
    }
}

/// Super trait implementation for the BoundedStorable trait on PrincipalId for use
/// in StableStructures
impl Storable for PrincipalId {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.to_vec().into()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        PrincipalId::try_from(&bytes[..]).expect("Cannot decode PrincipalId")
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: PrincipalId::HASH_LEN_IN_BYTES as u32,
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
