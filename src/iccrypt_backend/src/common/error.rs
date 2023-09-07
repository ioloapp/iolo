use std::fmt::Display;

use candid::{CandidType, Deserialize};

#[derive(Debug, CandidType, PartialEq, Eq, Deserialize)]
pub enum SmartVaultErr {
    UserAlreadyExists(String),
    UserDoesNotExist(String),
    UserDeletionFailed(String),
    UserVaultCreationFailed(String),
    UserVaultDoesNotExist(String),
    SecretDoesNotExist(String),
    SecretHasNoId,
    SecretDoesAlreadyExist(String),
    TestamentAlreadyExists(String),
    TestamentDoesNotExist(String),
}

impl Display for SmartVaultErr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SmartVaultErr::UserAlreadyExists(user) => {
                write!(f, "The following user already exists: {}", user)
            }
            SmartVaultErr::UserDoesNotExist(user) => {
                write!(f, "There is no user for the following principal {}", user)
            }
            SmartVaultErr::UserDeletionFailed(user) => {
                write!(
                    f,
                    "Failed to delete the user with the following principal: {}",
                    user
                )
            }
            SmartVaultErr::UserVaultCreationFailed(user) => write!(
                f,
                "Failed creating a vault for the following user: {}",
                user
            ),
            SmartVaultErr::UserVaultDoesNotExist(id) => {
                write!(f, "Failed to read vault with the following id: {}", id)
            }
            SmartVaultErr::SecretDoesNotExist(id) => {
                write!(f, "Failed to read secret with the following id: {}", id)
            }
            SmartVaultErr::SecretHasNoId => {
                write!(f, "Secret has no id")
            }
            SmartVaultErr::SecretDoesAlreadyExist(id) => {
                write!(f, "Failed to create secret with the following id: {}", id)
            }
            SmartVaultErr::TestamentAlreadyExists(id) => {
                write!(
                    f,
                    "Failed to create testament with the following id: {}",
                    id
                )
            }
            SmartVaultErr::TestamentDoesNotExist(id) => {
                write!(f, "Failed to read testament with the following id: {}", id)
            }
        }
    }
}

impl std::error::Error for SmartVaultErr {}
