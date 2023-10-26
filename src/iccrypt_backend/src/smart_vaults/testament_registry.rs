use std::cell::RefCell;
use std::collections::BTreeMap;

use candid::{CandidType, Principal};
use serde::Deserialize;
use crate::common::error::SmartVaultErr;
use crate::common::uuid::UUID;
use crate::smart_vaults::master_vault::MasterVault;
use crate::smart_vaults::smart_vault::{MASTERVAULT, USER_REGISTRY};

use crate::smart_vaults::testament::{Testament, TestamentID, TestamentListEntry};
use crate::smart_vaults::user_registry::UserRegistry;

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

    pub fn get_testament_for_heir(
        &self,
        heir: Principal,
        id: TestamentID,
        testator: Principal
    ) -> Result<Testament, SmartVaultErr> {
        // Look up the heir in the outer BTreeMap.
        if let Some(testator_map) = self.registry.get(&heir) {
            // If the heir is found, look up the testator in the inner BTreeMap.
            if let Some(testament_list) = testator_map.get(&testator) {
                // Use iter().find() to get the matching TestamentListEntry.
                if let Some(entry) = testament_list.iter().find(|&entry| entry.id == id) {
                    let principal = entry.testator;
                    let user_vault_id = USER_REGISTRY.with(
                        |ur: &RefCell<UserRegistry>| -> Result<UUID, SmartVaultErr> {
                            let user_registry = ur.borrow();
                            let user = user_registry.get_user(&principal)?;

                            user.user_vault_id.ok_or_else(|| SmartVaultErr::UserVaultDoesNotExist("".to_string()))
                        },
                    )?;
                    let testament = MASTERVAULT.with(
                        |mv: &RefCell<MasterVault>| -> Result<Testament, SmartVaultErr> {
                            // NOTE: Adjust this part to get a reference, not an owned value.
                            mv.borrow()
                                .get_user_vault(&user_vault_id)?
                                .get_testament(&id).cloned()
                        },
                    )?;

                    return if testament.condition_status().clone() {
                        Ok(testament.clone())
                    } else {
                        Err(SmartVaultErr::InvalidTestamentCondition)
                    }
                }
            }
        }
        Err(SmartVaultErr::TestamentDoesNotExist(id.to_string()))
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
