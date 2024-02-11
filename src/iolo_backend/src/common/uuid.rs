use candid::{CandidType, Deserialize};
use serde::Serialize;

use crate::utils::random::get_new_random;

#[derive(
    Debug, CandidType, Deserialize, Serialize, Clone, Copy, Eq, Hash, Ord, PartialEq, PartialOrd,
)]
pub struct UUID;
impl UUID {
    #[allow(clippy::new_ret_no_self)]
    pub async fn new() -> String {
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

#[cfg(test)]
mod tests {

    use crate::common::uuid::UUID;

    #[tokio::test]
    async fn test_uuid() {
        let id = UUID::new().await;
        dbg!(id);
    }
}
