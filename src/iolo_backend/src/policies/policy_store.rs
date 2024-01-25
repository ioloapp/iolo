use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};

use crate::common::{
    error::SmartVaultErr,
    memory::{get_stable_btree_memory_for_policies, Memory},
    uuid::UUID,
};

use super::policy::Policy;

#[derive(Serialize, Deserialize)]
pub struct PolicyStore {
    // An example `StableBTreeMap`. Data stored in `StableBTreeMap` doesn't need to
    // be serialized/deserialized in upgrades, so we tell serde to skip it.
    #[serde(skip, default = "init_stable_data")]
    // users: StableBTreeMap<u128, u128, Memory>,
    pub policies: StableBTreeMap<String, Policy, Memory>,
}

fn init_stable_data() -> StableBTreeMap<String, Policy, Memory> {
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
            Some(p) => {
                return Ok(p.clone());
            }
            None => {
                return Err(SmartVaultErr::PolicyDoesNotExist(policy_id.to_string()));
            }
        }
    }

    pub fn add_policy(&mut self, policy: Policy) -> Result<Policy, SmartVaultErr> {
        let policy_id: String = policy.id().clone();
        dbg!("hi from add_policy again");
        let p = self.policies.insert(policy_id.clone(), policy.clone());
        match p {
            Some(_) => return Err(SmartVaultErr::PolicyAlreadyExists(policy_id.to_string())),
            None => Ok(policy),
        }
    }
}
