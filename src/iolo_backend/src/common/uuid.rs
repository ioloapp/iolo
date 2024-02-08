use std::{borrow::Cow, cell::RefCell, fmt};

use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{storable::Bound, Storable};
use serde::Serialize;

use crate::{smart_vaults::smart_vault::UUID_COUNTER, utils::random::get_new_random};

#[derive(
    Debug, CandidType, Deserialize, Serialize, Clone, Copy, Eq, Hash, Ord, PartialEq, PartialOrd,
)]
pub struct UUID(pub u128);
impl UUID {
    pub fn new() -> Self {
        // get current counter
        let mut current_counter =
            UUID_COUNTER.with(|counter: &RefCell<u128>| -> u128 { *counter.borrow() });

        // increment the counter
        current_counter += 1;

        // update the counter
        UUID_COUNTER.with(|counter: &RefCell<u128>| {
            *counter.borrow_mut() = current_counter;
        });

        UUID(current_counter)
    }

    pub async fn new_random() -> Self {
        let random_array = get_new_random().await;
        let r = u128::from_le_bytes(random_array);
        UUID(r)
    }

    pub fn as_bytes(&self) -> Vec<u8> {
        self.0.to_string().as_bytes().to_vec()
    }

    pub async fn new_string() -> String {
        let random_array = get_new_random().await;
        let result_string = random_array
            .to_vec()
            .iter()
            .map(|b| b.to_string())
            .collect::<Vec<String>>()
            .join("-");
        result_string
    }
}

impl fmt::Display for UUID {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Default for UUID {
    fn default() -> Self {
        Self::new()
    }
}

impl From<String> for UUID {
    fn from(value: String) -> Self {
        let uuid = value.parse::<u128>().unwrap();
        UUID(uuid)
    }
}

impl From<&str> for UUID {
    fn from(value: &str) -> Self {
        let uuid = value.parse::<u128>().unwrap();
        UUID(uuid)
    }
}

impl From<UUID> for String {
    fn from(uuid: UUID) -> Self {
        uuid.0.to_string()
    }
}

impl Storable for UUID {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[cfg(test)]
mod tests {

    use crate::common::uuid::UUID;

    #[tokio::test]
    async fn test_uuid() {
        let id = UUID::new_string().await;
        dbg!(id);
    }
}
