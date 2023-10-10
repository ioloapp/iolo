use ic_agent::Agent;

use crate::types::{
    secret::{AddSecretArgs, Secret},
    smart_vault_err::SmartVaultErr,
};

use super::agent::{make_call_with_agent, CallType};

pub async fn add_user_secret(
    agent: &Agent,
    args: &AddSecretArgs,
) -> anyhow::Result<Secret, SmartVaultErr> {
    let s: Result<Secret, SmartVaultErr> =
        make_call_with_agent(agent, CallType::Update("add_secret".into()), Some(args))
            .await
            .unwrap();

    s
}

pub async fn update_user_secret(
    agent: &Agent,
    args: Secret,
) -> anyhow::Result<Secret, SmartVaultErr> {
    let s: Result<Secret, SmartVaultErr> =
        make_call_with_agent(agent, CallType::Update("update_secret".into()), Some(args))
            .await
            .unwrap();

    s
}
