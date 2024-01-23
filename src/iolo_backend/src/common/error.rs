use std::fmt::Display;

use candid::{CandidType, Deserialize};

#[derive(Debug, CandidType, PartialEq, Eq, Deserialize)]
pub enum SmartVaultErr {
    UserAlreadyExists(String),
    UserDoesNotExist(String),
    UserDeletionFailed(String),
    UserUpdateFailed(String),
    UserVaultCreationFailed(String),
    UserVaultDoesNotExist(String),
    SecretDoesNotExist(String),
    OnlyOwnerCanUpdateSecret(String),
    OnlyOwnerCanDeleteSecret(String),
    OwnerCannotBeChanged(String),
    SecretDecryptionMaterialDoesNotExist(String),
    SecretHasNoId,
    SecretAlreadyExists(String),
    PolicyAlreadyExists(String),
    PolicyDoesNotExist(String),
    InvalidPolicyCondition,
    NoPolicyForBeneficiary(String),
    KeyGenerationNotAllowed,
    Unauthorized,
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
            SmartVaultErr::UserUpdateFailed(user) => {
                write!(
                    f,
                    "Failed to update the user with the following principal: {}",
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
            SmartVaultErr::OnlyOwnerCanUpdateSecret(id) => {
                write!(
                    f,
                    "Only the owner of the secret can update a secret. Secret ID: {}",
                    id
                )
            }
            SmartVaultErr::OnlyOwnerCanDeleteSecret(id) => {
                write!(
                    f,
                    "Only the owner of the secret can delete a secret. Secret ID: {}",
                    id
                )
            }
            SmartVaultErr::OwnerCannotBeChanged(id) => {
                write!(f, "Owner of a secret cannot be changed. Secret ID: {}", id)
            }
            SmartVaultErr::SecretDecryptionMaterialDoesNotExist(id) => {
                write!(f, "Failed to read secret decryption material for secret with the following id: {}", id)
            }
            SmartVaultErr::SecretHasNoId => {
                write!(f, "Secret has no id")
            }
            SmartVaultErr::SecretAlreadyExists(id) => {
                write!(f, "Failed to create secret with the following id: {}", id)
            }
            SmartVaultErr::PolicyAlreadyExists(id) => {
                write!(f, "Failed to create policy with the following id: {}", id)
            }
            SmartVaultErr::PolicyDoesNotExist(id) => {
                write!(f, "Failed to read policy with the following id: {}", id)
            }
            SmartVaultErr::NoPolicyForBeneficiary(id) => {
                write!(f, "Failed to read policy for beneficiary: {}", id)
            }
            SmartVaultErr::InvalidPolicyCondition => {
                write!(
                    f,
                    "Policy cannot be read by beneficiary because of wrong condition state"
                )
            }
            SmartVaultErr::KeyGenerationNotAllowed => {
                write!(
                    f,
                    "Key cannot be generated because some conditions are not met"
                )
            }
            SmartVaultErr::Unauthorized => {
                write!(f, "Unauthorized")
            }
        }
    }
}

impl std::error::Error for SmartVaultErr {}
