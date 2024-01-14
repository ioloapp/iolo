use std::collections::{BTreeMap, HashSet};

use crate::common::error::SmartVaultErr;
use crate::policies::conditions::{Condition, Validator};
use crate::policies::policy::{Policy, PolicyID};
use candid::{CandidType, Principal};
use serde::Deserialize;

#[derive(Debug, CandidType, Deserialize)]
pub struct PolicyRegistryForHeirs {
    heir_to_testaments: BTreeMap<Principal, HashSet<PolicyID>>,
    testament_to_testator: BTreeMap<PolicyID, Principal>,
}

impl PolicyRegistryForHeirs {
    pub fn new() -> Self {
        Self {
            heir_to_testaments: BTreeMap::new(),
            testament_to_testator: BTreeMap::new(),
        }
    }

    pub fn remove_testament_from_registry(&mut self, testament: &Policy) {
        for heir in testament.heirs() {
            if let Some(testament_ids) = self.heir_to_testaments.get_mut(heir) {
                testament_ids.remove(testament.id());
                if testament_ids.is_empty() {
                    self.heir_to_testaments.remove(heir);
                }
            }
        }
        self.testament_to_testator.remove(testament.id());
    }

    pub fn add_testament_to_registry(&mut self, testament: &Policy) {
        for heir in testament.heirs() {
            self.heir_to_testaments
                .entry(heir.clone())
                .or_insert_with(HashSet::new)
                .insert(testament.id().clone());
        }
        self.testament_to_testator
            .insert(testament.id().clone(), testament.testator().clone());
    }

    pub fn update_testament_in_registry(&mut self, testament_new: &Policy, testament_old: &Policy) {
        // Delete all existing entries for old testament
        for heir in testament_old.heirs() {
            if let Some(testaments) = self.heir_to_testaments.get_mut(heir) {
                testaments.remove(testament_old.id());
                if testaments.is_empty() {
                    self.heir_to_testaments.remove(heir);
                }
            }
        }
        self.testament_to_testator.remove(testament_old.id());

        // Add new testament
        self.add_testament_to_registry(testament_new);
    }

    pub fn get_testament_id_as_heir(
        &self,
        heir: Principal,
        testament_id: PolicyID,
    ) -> Result<(PolicyID, Principal), SmartVaultErr> {
        // Check if the heir exists in the map and contains the testament_id
        if let Some(testament_ids) = self.heir_to_testaments.get(&heir) {
            return if testament_ids.contains(&testament_id) {
                // If testament_id is found for the heir, retrieve the associated testator
                if let Some(testator) = self.testament_to_testator.get(&testament_id) {
                    Ok((testament_id, testator.clone()))
                } else {
                    // Return an error if testament_id doesn't have a corresponding testator
                    Err(SmartVaultErr::TestamentDoesNotExist(testament_id)) // Replace with appropriate error variant
                }
            } else {
                // Return an error if heir doesn't have the specified testament_id
                Err(SmartVaultErr::TestamentDoesNotExist(testament_id)) // Replace with appropriate error variant
            };
        }
        // Return an error if the heir doesn't exist in the map
        Err(SmartVaultErr::TestamentDoesNotExist(testament_id))
    }

    pub fn get_testament_ids_as_heir(&self, heir: Principal) -> Vec<(PolicyID, Principal)> {
        let mut result = Vec::new();

        // Check if the heir exists
        if let Some(testament_ids) = self.heir_to_testaments.get(&heir) {
            // For each testament_id, get the corresponding testator
            for testament_id in testament_ids {
                if let Some(testator) = self.testament_to_testator.get(testament_id) {
                    result.push((testament_id.clone(), testator.clone()));
                }
            }
        }
        result
    }

    pub fn get_testator_of_testament(&self, testament_id: PolicyID) -> Option<Principal> {
        self.testament_to_testator.get(&testament_id).copied()
    }
}

#[derive(Debug, CandidType, Deserialize)]
pub struct PolicyRegistryForValidators {
    validator_to_testaments: BTreeMap<Principal, HashSet<PolicyID>>,
    testament_to_testator: BTreeMap<PolicyID, Principal>,
}

impl PolicyRegistryForValidators {
    pub fn new() -> Self {
        Self {
            validator_to_testaments: BTreeMap::new(),
            testament_to_testator: BTreeMap::new(),
        }
    }

    pub fn get_testament_ids_as_validator(
        &self,
        validator: Principal,
    ) -> Vec<(PolicyID, Principal)> {
        let mut result = Vec::new();

        // Check if the validator exists
        if let Some(testament_ids) = self.validator_to_testaments.get(&validator) {
            // For each testament_id, get the corresponding testator
            for testament_id in testament_ids {
                if let Some(testator) = self.testament_to_testator.get(testament_id) {
                    result.push((testament_id.clone(), testator.clone()));
                }
            }
        }
        result
    }

    pub fn add_testament_to_registry(
        &mut self,
        validators: &Vec<Validator>,
        testament_id: &PolicyID,
        testator: &Principal,
    ) {
        for validator in validators {
            self.validator_to_testaments
                .entry(validator.id.clone())
                .or_insert_with(HashSet::new)
                .insert(testament_id.clone());
        }
        self.testament_to_testator
            .insert(testament_id.clone(), testator.clone());
    }

    pub fn update_testament_in_registry(&mut self, testament_new: &Policy, testament_old: &Policy) {
        // Delete all existing entries for old testament
        for condition in testament_old.conditions().iter() {
            match condition {
                Condition::XOutOfYCondition(xoutofy) => {
                    for validator in xoutofy.validators.iter() {
                        if let Some(testaments) =
                            self.validator_to_testaments.get_mut(&validator.id)
                        {
                            testaments.remove(testament_old.id());
                            if testaments.is_empty() {
                                self.validator_to_testaments.remove(&validator.id);
                            }
                        }
                    }
                    self.testament_to_testator.remove(testament_old.id());
                }
                _ => {}
            }
        }

        // Add new testament
        for condition in testament_new.conditions().iter() {
            match condition {
                Condition::XOutOfYCondition(xoutofy) => {
                    self.add_testament_to_registry(
                        &xoutofy.validators,
                        testament_new.id(),
                        testament_new.testator(),
                    );
                }
                _ => {}
            }
        }
    }
}
