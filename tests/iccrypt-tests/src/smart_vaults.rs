use std::borrow::BorrowMut;
use std::sync::{Arc, Mutex};
use std::thread;

use crate::common::get_iccrypt_backend_canister;
use crate::common::{create_identity, get_dfx_agent_with_identity};
use anyhow::{anyhow, Result};
use candid::{CandidType, Deserialize, Encode, Principal};
use ic_agent::identity::BasicIdentity;
use ic_agent::{Agent, Identity};

use iccrypt_backend::common::error::SmartVaultErr;
use iccrypt_backend::common::user::User;
use indicatif::{ProgressBar, ProgressStyle};

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
    dbg!("Testing smart vaults");
    // test_user_lifecycle().await?;
    test_mass_user_creation().await?;
    Ok(())
}

async fn test_user_lifecycle() -> anyhow::Result<()> {
    // create identities (keypairs) and the corresponding senders (principals)
    let i1: BasicIdentity = create_identity();
    let p1: Principal = i1.sender().unwrap();
    let i2: BasicIdentity = create_identity();
    let p2: Principal = i2.sender().unwrap();

    // the two agents will use different identities (caller)
    let a1: Agent = get_dfx_agent_with_identity(i1).await?;
    let a2: Agent = get_dfx_agent_with_identity(i2).await?;

    // let's create a new ic crypt user
    let new_user_1 = create_user(&a1).await?;
    assert_eq!(new_user_1.id(), &p1);

    // create the user again. this must fail
    let new_user_again = create_user(&a1).await;

    if new_user_again.is_err() {
        assert_eq!(
            new_user_again.err().unwrap(),
            SmartVaultErr::UserAlreadyExists(new_user_1.id().to_string())
        );
    } else {
        return Err(anyhow!(format!(
            "Error. User with following ID was created twice: {}",
            new_user_1.id().to_string()
        )));
    }

    // so let's delete the user 1
    let del = delete_user(&a1).await;
    assert!(del.is_ok());

    // let's delete the user 1 again -> this must fail, because it has been deleted alreay
    let del = delete_user(&a1).await;
    if del.is_err() {
        assert_eq!(
            del.err().unwrap(),
            SmartVaultErr::UserDoesNotExist(new_user_1.id().to_string())
        );
    } else {
        return Err(anyhow!(format!(
            "Error. The following user was deleted, even thouh it should not have existed: {}",
            new_user_1.id().to_string()
        )));
    }

    Ok(())
}

async fn test_mass_user_creation() -> anyhow::Result<()> {
    let n = 100;
    type IdTuple = Vec<(Principal, Agent, User)>;
    let ids = Arc::new(Mutex::new(IdTuple::new()));
    let mut threads = vec![];
    let bar = Arc::new(Mutex::new(ProgressBar::new(n)));

    for _ in 0..n {
        let ids = Arc::clone(&ids);
        let bar = Arc::clone(&bar);
        threads.push(tokio::spawn(async move {
            let i: BasicIdentity = create_identity();
            let p: Principal = i.sender().unwrap();
            let a = get_dfx_agent_with_identity(i).await.unwrap();
            let u = create_user(&a).await.unwrap();

            // add the new identity tuple
            let mut idv = ids.lock().unwrap();
            idv.push((p, a, u));

            // update progess bar
            let mbar = bar.lock().unwrap();
            mbar.inc(1);
        }));
    }

    for t in threads {
        // Wait for the thread to finish. Returns a result.
        let x = t.await.unwrap();
    }
    bar.lock().unwrap().finish();
    let z = ids.lock().unwrap();
    dbg!(z.len());

    Ok(())
}

async fn create_user(agent: &Agent) -> Result<User, SmartVaultErr> {
    let res_create_user_ser: Vec<u8> = agent
        .update(&get_iccrypt_backend_canister(), "create_user")
        .with_arg(&Encode!().expect("Failed encoding argument for method 'crate_user'"))
        .call_and_wait()
        .await
        .unwrap_or_else(|e| {
            dbg!(e);
            panic!();
        });

    candid::de::IDLDeserialize::new(&res_create_user_ser)
        .expect("Failed to deserialized candid response")
        .get_value::<Result<User, SmartVaultErr>>()
        .unwrap()
}

async fn delete_user(agent: &Agent) -> Result<(), SmartVaultErr> {
    let res_delete_user_ser: Vec<u8> = agent
        .update(&get_iccrypt_backend_canister(), "delete_user")
        //.with_arg(&Encode!(&user)?)
        .with_arg(&Encode!().expect("Failed encoding arguments for candid method 'delete_user'"))
        .call_and_wait()
        .await
        .unwrap_or_else(|e| {
            dbg!(e);
            panic!();
        });

    candid::de::IDLDeserialize::new(&res_delete_user_ser)
        .expect("Failed to deserialized candid response")
        .get_value::<Result<(), SmartVaultErr>>()
        .unwrap()
}
