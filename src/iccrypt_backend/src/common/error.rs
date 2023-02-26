use std::fmt::Display;

#[derive(Debug)]
pub enum SmartVaultErr {
    UserAlreadyExists(String),
    UserVaultAlreadyExists(String),
}

impl Display for SmartVaultErr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SmartVaultErr::UserAlreadyExists(user) => {
                write!(f, "The following user already exists: {}", user)
            }
            SmartVaultErr::UserVaultAlreadyExists(user) => write!(
                f,
                "User vault already exists for the following user: {}",
                user
            ),
        }
    }
}

impl std::error::Error for SmartVaultErr {}
