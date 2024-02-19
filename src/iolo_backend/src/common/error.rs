use std::fmt::Display;

use candid::{CandidType, Deserialize};

#[derive(Debug, CandidType, PartialEq, Eq, Deserialize)]
pub enum SmartVaultErr {
    // User errors
    UserAlreadyExists(String),
    UserDoesNotExist(String),
    UserDeletionFailed(String),
    UserUpdateFailed(String),
    ContactAlreadyExists(String),
    ContactDoesNotExist(String),
    // Secret errors
    SecretDoesNotExist(String),
    OnlyOwnerCanDeleteSecret(String),
    SecretHasNoId,
    SecretAlreadyExists(String),
    // Policy errors
    PolicyAlreadyExists(String),
    CallerNotPolicyOwner(String),
    PolicyDoesNotExist(String),
    InvalidPolicyCondition,
    PolicyConditionDoesNotExist(String),
    NoPolicyForBeneficiary(String),
    NoPolicyForValidator(String),
    KeyBoxEntryDoesNotExistForSecret(String),
    SecretEntryDoesNotExistForKeyBoxEntry(String),
    LogicalOperatorWithLessThanTwoConditions,
    InvalidDateTime(String),
    InvalidQuorum(String, String),
    // Various errors
    CallerNotBeneficiary(String),
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
            SmartVaultErr::ContactAlreadyExists(contact) => {
                write!(f, "The following contact already exists: {}", contact)
            }
            SmartVaultErr::ContactDoesNotExist(contact) => {
                write!(f, "The following contact does not exist: {}", contact)
            }
            SmartVaultErr::SecretDoesNotExist(id) => {
                write!(f, "Failed to read secret with the following id: {}", id)
            }
            SmartVaultErr::CallerNotBeneficiary(id) => {
                write!(f, "Caller is not beneficiary of policy with id: {}", id)
            }
            SmartVaultErr::OnlyOwnerCanDeleteSecret(id) => {
                write!(
                    f,
                    "Only the owner of the secret can delete a secret. Secret ID: {}",
                    id
                )
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
            SmartVaultErr::CallerNotPolicyOwner(id) => {
                write!(f, "Caller is not owner of policy: {}", id)
            }
            SmartVaultErr::PolicyDoesNotExist(id) => {
                write!(f, "Failed to read policy with the following id: {}", id)
            }
            SmartVaultErr::KeyBoxEntryDoesNotExistForSecret(id) => {
                write!(f, "No key_box entry for secret: {}", id)
            }
            SmartVaultErr::SecretEntryDoesNotExistForKeyBoxEntry(id) => {
                write!(f, "No secret for key_box entry: {}", id)
            }
            SmartVaultErr::PolicyConditionDoesNotExist(id) => {
                write!(f, "Policy Condition does not exist: {}", id)
            }
            SmartVaultErr::NoPolicyForBeneficiary(id) => {
                write!(f, "Failed to read policy for beneficiary: {}", id)
            }
            SmartVaultErr::NoPolicyForValidator(id) => {
                write!(f, "Failed to read policy for validator: {}", id)
            }
            SmartVaultErr::LogicalOperatorWithLessThanTwoConditions => {
                write!(f, "Logical operator provided with less than two conditions")
            }
            SmartVaultErr::InvalidPolicyCondition => {
                write!(f, "Policy cannot be read by beneficiary because of wrong condition state")
            }
            SmartVaultErr::InvalidDateTime(datetime) => {
                write!(f, "Datetime {} is invalid or in the past", datetime)
            }
            SmartVaultErr::InvalidQuorum(quorum, validators) => {
                write!(f, "Quorum {} must be less than number of validators: {}", quorum, validators)
            }
            SmartVaultErr::KeyGenerationNotAllowed => {
                write!(f, "Key cannot be generated because some conditions are not met")
            }
            SmartVaultErr::Unauthorized => {
                write!(f, "Unauthorized")
            }
        }
    }
}

impl std::error::Error for SmartVaultErr {}
