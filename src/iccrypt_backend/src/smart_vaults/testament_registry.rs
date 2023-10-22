use std::collections::BTreeMap;

use candid::{CandidType, Principal};
use serde::Deserialize;

use crate::smart_vaults::testament::{Testament, TestamentListEntry};

#[derive(Debug, CandidType, Deserialize)]
pub struct TestamentRegistry {
    registry: BTreeMap<Principal, BTreeMap<Principal, Vec<TestamentListEntry>>>,
}

impl TestamentRegistry {
    pub fn new() -> Self {
        Self {
            registry: BTreeMap::new(),
        }
    }

    pub fn add_testament_for_heir(&mut self, heir: Principal, testament_list_entry: TestamentListEntry) {

        self.registry
            .entry(heir)                               // Get the entry for the provided heir
            .or_insert_with(BTreeMap::new)  // If absent, insert a new BTreeMap for testators
            .entry(testament_list_entry.testator)     // Get the entry for the provided testator
            .or_insert_with(Vec::new)               // If absent, insert a new empty vector
            .push(testament_list_entry);
    }

    pub fn get_testaments_for_heir(
        &self,
        heir: Principal,
    ) -> Option<Vec<TestamentListEntry>> {
        self.registry.get(&heir).map(|testator_map| {
            testator_map.values().flat_map(|v| v.clone()).collect()
        })
    }
}
