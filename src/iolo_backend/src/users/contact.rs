use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

use super::user::UserType;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Hash)]
pub struct Contact {
    pub id: Principal,
    pub name: Option<String>,
    pub email: Option<String>,
    pub user_type: Option<UserType>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct AddContactArgs {
    pub id: Principal,
    pub name: Option<String>,
    pub email: Option<String>,
    pub user_type: Option<UserType>,
}

impl From<AddContactArgs> for Contact {
    fn from(aca: AddContactArgs) -> Self {
        Contact {
            id: aca.id,
            name: aca.name,
            email: aca.email,
            user_type: aca.user_type,
        }
    }
}
