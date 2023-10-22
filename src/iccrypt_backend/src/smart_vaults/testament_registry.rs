use std::collections::BTreeMap;

use candid::{CandidType, Principal};
use serde::Deserialize;

use crate::smart_vaults::testament::TestamentListEntry;

#[derive(Debug, CandidType, Deserialize)]
pub struct TestamentRegistry {
    // Maps Heir to (Testator, TestamentListEntry)
    registry: BTreeMap<Principal, Vec<TestamentListEntry>>,
}

impl TestamentRegistry {
    pub fn new() -> Self {
        Self {
            registry: BTreeMap::new(),
        }
    }

    pub fn add_testament_for_heir(&mut self, heir: Principal, testament_list_entry: TestamentListEntry) {
        self.registry
            .entry(heir)
            .or_insert_with(Vec::new)
            .push(testament_list_entry);
    }

    pub fn get_testaments_for_heir(
        &self,
        heir: Principal,
    ) -> Option<&Vec<TestamentListEntry>> {
        self.registry.get(&heir)
    }
}
