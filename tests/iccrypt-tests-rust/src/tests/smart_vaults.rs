use anyhow::Result;
use candid::{CandidType, Deserialize, Principal};
use colored::Colorize;
use ic_agent::{identity::BasicIdentity, Agent, Identity};

use crate::{
    types::{smart_vault_err::SmartVaultErr, user::User},
    utils::agent::{create_identity, get_dfx_agent_with_identity, make_call_with_agent, CallType},
};

#[derive(CandidType, Deserialize)]
struct CreateUserArg {
    user_id: Principal,
}

#[derive(CandidType, Deserialize)]
struct ExampleArgSet {
    canister_id: Principal,
    controllers: Option<Vec<Principal>>,
    amount: Option<candid::Nat>,
}

pub async fn test_smart_vaults() -> Result<()> {
    println!("\n{}", "Testing smart vaults".yellow().bold());
    test_user_lifecycle().await?;
    // test_mass_user_creation().await?;
    Ok(())
}

async fn test_user_lifecycle() -> anyhow::Result<()> {
    // create identities (keypairs) and the corresponding senders (principals)
    let i1: BasicIdentity = create_identity();
    let p1: Principal = i1.sender().unwrap();
    let a1: Agent = get_dfx_agent_with_identity(i1).await?;
    let i2: BasicIdentity = create_identity();
    let _p2: Principal = i2.sender().unwrap();
    let _a2: Agent = get_dfx_agent_with_identity(i2).await?;

    // let's create a new ic crypt user
    let new_user_1 = create_user(&a1).await?;
    assert_eq!(&new_user_1.id, &p1);
    println!("   {}{:?}", "New user created: ", new_user_1.id);

    // create the user again. this must fail
    let new_user_again = create_user(&a1).await;

    if new_user_again.is_err() {
        assert_eq!(
            new_user_again.err().unwrap(),
            SmartVaultErr::UserAlreadyExists(new_user_1.id.to_string())
        );
    } else {
        panic!(
            "Error. User with following ID was created twice: {}",
            new_user_1.id.to_string()
        )
    }

    // let's add a secret

    // so let's delete the user 1
    delete_user(&a1, new_user_1.id).await?;
    println!("   User successfully deleted");

    // let's delete the user 1 again -> this must fail, because it has been deleted alreay
    let del = delete_user(&a1, new_user_1.id).await;
    if del.is_err() {
        assert_eq!(
            del.err().unwrap(),
            SmartVaultErr::UserDoesNotExist(new_user_1.id.to_string())
        );
    } else {
        panic!(
            "Error. The following user was deleted, even thouh it should not have existed: {}",
            new_user_1.id.to_string()
        );
    }

    Ok(())
}

async fn delete_user(agent: &Agent, u: Principal) -> anyhow::Result<(), SmartVaultErr> {
    let r: Result<(), SmartVaultErr> = make_call_with_agent(
        agent,
        CallType::Update("delete_user".into()),
        Some(u.as_slice()),
    )
    .await
    .unwrap();

    r
}

async fn create_user(agent: &Agent) -> anyhow::Result<User, SmartVaultErr> {
    let user: Result<User, SmartVaultErr> = make_call_with_agent(
        agent,
        CallType::Update("create_user".into()),
        Option::<Vec<u8>>::None,
    )
    .await
    .unwrap();

    user
}
