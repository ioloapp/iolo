use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::hash::{Hash, Hasher};

use super::user::{PrincipalID, UserType};

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Contact {
    pub id: PrincipalID,
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
            id: aca.id.to_string(),
            name: aca.name,
            email: aca.email,
            user_type: aca.user_type,
        }
    }
}

impl Hash for Contact {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.id.hash(state);
    }
}

impl Eq for Contact {}

impl PartialEq for Contact {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use candid::Principal;
    use rand::Rng;

    use crate::users::contact::Contact;

    #[tokio::test]
    async fn test_contact() {
        let principal = create_principal();
        let mut hs: HashSet<Contact> = HashSet::new();

        let mut contact: Contact = Contact {
            id: principal.to_string(),
            name: None,
            email: None,
            user_type: None,
        };
        hs.insert(contact.clone());

        // update the contact -> should fail
        contact.email = Some("donald@google.com".to_string());
        assert!(!hs.insert(contact.clone()));

        // replace
        hs.replace(contact.clone());

        assert_eq!(hs.len(), 1);
    }

    pub fn create_principal() -> Principal {
        // create random u8
        let mut rng = rand::thread_rng();

        // create random u8 array
        let mut random_u8_array: [u8; 29] = [0; 29];
        rng.fill(&mut random_u8_array[..]);
        Principal::from_slice(&random_u8_array)
    }
}
