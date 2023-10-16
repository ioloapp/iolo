use std::collections::BTreeMap;

use candid::{CandidType, Principal};
use serde::Deserialize;

use crate::{common::error::SmartVaultErr, utils::caller::get_caller};

use super::testament::TestamentID;

#[derive(Debug, CandidType, Deserialize)]
pub struct TestamentRegistry {
    // Maps Heir to (Testator, Testament)
    registry: BTreeMap<Principal, Vec<(Principal, TestamentID)>>,
}

impl TestamentRegistry {
    pub fn new() -> Self {
        Self {
            registry: BTreeMap::new(),
        }
    }

    pub fn add_testament_for_heir(&mut self, heir: Principal, testament_id: TestamentID) {
        ic_cdk::println!(
            "About to insert testament with ID {} and testator {} for heir {}",
            testament_id,
            get_caller(),
            heir
        );
        self.registry
            .entry(heir)
            .or_insert_with(Vec::new)
            .push((get_caller(), testament_id));
    }

    pub fn get_testaments_for_heir(
        &self,
        heir: Principal,
    ) -> Result<&Vec<(Principal, TestamentID)>, SmartVaultErr> {
        self.registry
            .get(&heir)
            .ok_or_else(|| SmartVaultErr::NoTestamentsForHeir(heir.to_string()))
    }
}
