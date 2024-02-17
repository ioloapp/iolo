use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::common::{
    error::SmartVaultErr,
    memory::{get_stable_btree_memory_for_policies, Memory},
};
use crate::utils::time;

use super::policy::{Policy, PolicyID};

#[derive(Serialize, Deserialize)]
pub struct PolicyStore {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    // users: StableBTreeMap<u128, u128, Memory>,
    pub policies: StableBTreeMap<PolicyID, Policy, Memory>,
}

fn init_stable_data() -> StableBTreeMap<PolicyID, Policy, Memory> {
    StableBTreeMap::init(get_stable_btree_memory_for_policies())
}

impl Default for PolicyStore {
    fn default() -> Self {
        Self {
            policies: init_stable_data(),
        }
    }
}

impl PolicyStore {
    pub fn new() -> Self {
        Self {
            policies: init_stable_data(),
        }
    }

    pub fn get(&self, policy_id: &str) -> Result<Policy, SmartVaultErr> {
        let p = self.policies.get(&policy_id.to_string());
        match p {
            Some(p) => Ok(p.clone()),
            None => Err(SmartVaultErr::PolicyDoesNotExist(policy_id.to_string())),
        }
    }

    pub fn add_policy(&mut self, policy: Policy) -> Result<Policy, SmartVaultErr> {
        let policy_id: String = policy.id().clone();
        let p = self.policies.insert(policy_id.clone(), policy.clone());
        match p {
            Some(_) => Err(SmartVaultErr::PolicyAlreadyExists(policy_id.to_string())),
            None => Ok(policy),
        }
    }

    pub fn update_policy(&mut self, policy: Policy) -> Result<Policy, SmartVaultErr> {
        let now: u64 = time::get_current_time();
        let mut policy = policy.clone();
        policy.date_modified = now;

        let policy_id: String = policy.id().clone();
        let p = self.policies.insert(policy_id.clone(), policy.clone());
        match p {
            Some(_) => Ok(policy),
            None => Err(SmartVaultErr::PolicyDoesNotExist(policy_id.to_string())),
        }
    }

    pub fn delete_policy(&mut self, policy_id: &str) -> Result<(), SmartVaultErr> {
        let p = self.policies.remove(&policy_id.to_string());
        match p {
            Some(_) => Ok(()),
            None => Err(SmartVaultErr::PolicyDoesNotExist(policy_id.to_string())),
        }
    }
}
