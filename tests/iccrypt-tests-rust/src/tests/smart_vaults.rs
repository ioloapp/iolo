#![allow(dead_code)]

use anyhow::Result;
use candid::Principal;
use colored::Colorize;
use ic_agent::{identity::BasicIdentity, Agent, Identity};

use crate::{
    types::{
        secret::{
            CreateSecretArgs, Secret, SecretCategory, SecretDecryptionMaterial, SecretListEntry,
        },
        smart_vault_err::SmartVaultErr,
        testament::{CreateTestamentArgs, Testament},
        user::User,
    },
    utils::{
        agent::{create_identity, get_dfx_agent_with_identity, make_call_with_agent, CallType},
        vetkd::{
            aes_gcm_decrypt, aes_gcm_encrypt, get_aes_256_gcm_key_for_testament,
            get_aes_256_gcm_key_for_uservault, get_local_random_aes_256_gcm_key,
        },
    },
};

pub async fn test_smart_vaults() -> Result<()> {
    println!(
        "\n{}",
        "Testing smart vaults and testaments".yellow().bold()
    );
    // test_user_lifecycle().await?;
    // test_secret_lifecycle().await?;
    test_testament_lifecycle().await?;
    Ok(())
}

async fn test_testament_lifecycle() -> anyhow::Result<()> {
    // create identities (keypairs) and the corresponding senders (principals)

    // Alice
    let i1: BasicIdentity = create_identity();
    let p1: Principal = i1.sender().unwrap();
    let a1: Agent = get_dfx_agent_with_identity(i1).await?;

    // Bob
    let identity_bob: BasicIdentity = create_identity();
    // let principal_bob: Principal = identity_bob.sender().unwrap();
    let _agent_bob: Agent = get_dfx_agent_with_identity(identity_bob).await?;

    // Eve
    let identity_eve: BasicIdentity = create_identity();
    // let principal_eve: Principal = identity_eve.sender().unwrap();
    let _agent_eve: Agent = get_dfx_agent_with_identity(identity_eve).await?;

    // let's create a new ic crypt user
    let new_user_1 = create_user(&a1).await?;
    assert_eq!(&new_user_1.id, &p1);
    println!("   {}{:?}", "New user created: ", new_user_1.id);

    // Let's create a secret
    let username = "Tobias";
    let password = "123";
    let notes = "My Notes";

    // Get local random aes gcm 256 key to encrypt the secret fields
    let secret_encryption_key = get_local_random_aes_256_gcm_key().await.unwrap();

    // Encrypt secret fields
    let (encrypted_username, username_decryption_nonce) =
        aes_gcm_encrypt(username.as_bytes(), &secret_encryption_key)
            .await
            .unwrap();

    let (encrypted_password, password_decryption_nonce) =
        aes_gcm_encrypt(password.as_bytes(), &secret_encryption_key)
            .await
            .unwrap();

    let (encrypted_notes, notes_decryption_nonce) =
        aes_gcm_encrypt(notes.as_bytes(), &secret_encryption_key)
            .await
            .unwrap();

    // Encrypt the encryption key
    let key_encryption_key = get_aes_256_gcm_key_for_uservault().await.unwrap();
    let (encrypted_secret_decryption_key, nonce_encrypted_secret_decryption_key) =
        aes_gcm_encrypt(&secret_encryption_key, &key_encryption_key)
            .await
            .unwrap();

    let decryption_material: SecretDecryptionMaterial = SecretDecryptionMaterial {
        encrypted_decryption_key: encrypted_secret_decryption_key,
        iv: nonce_encrypted_secret_decryption_key.to_vec(),
        username_decryption_nonce: Some(username_decryption_nonce.to_vec()),
        password_decryption_nonce: Some(password_decryption_nonce.to_vec()),
        notes_decryption_nonce: Some(notes_decryption_nonce.to_vec()),
    };

    // let's add the secret
    let create_secret_args = CreateSecretArgs {
        decryption_material: decryption_material.clone(),
    };

    let mut secret: Secret = add_user_secret(&a1, &create_secret_args).await.unwrap();
    // dbg!(&secret);

    // update the secret:
    secret.name = Some("Hey, cool".into());
    secret.category = Some(SecretCategory::Password);
    secret.username = Some(encrypted_username.clone());
    secret.password = Some(encrypted_password.clone());
    secret.url = Some("www.google.com".to_string());
    secret.notes = Some(encrypted_notes.clone());

    let secret = update_user_secret(&a1, secret).await?;

    // dbg!(&secret);

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    ////
    ////  let us create a testament
    ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    println!("{}", "Let's create a testament - yeah".yellow().bold());
    let testament_create_args: CreateTestamentArgs = CreateTestamentArgs {};
    let mut testament: Testament = create_user_testament(&a1, &testament_create_args)
        .await
        .unwrap();

    // get all testaments
    let testament_list: Result<Vec<Testament>, SmartVaultErr> = make_call_with_agent(
        &a1,
        CallType::Query("get_testament_list".into()),
        Option::<Vec<u8>>::None,
    )
    .await
    .unwrap();

    dbg!(&testament_list);

    // We need to encrypt the fields in the testament
    // For this we need a testament encryption key
    let testament_key_encryption_key = get_aes_256_gcm_key_for_testament(testament.id)
        .await
        .unwrap();
    let (encrypted_secret_decryption_key, nonce_encrypted_secret_decryption_key) =
        aes_gcm_encrypt(&secret_encryption_key, &testament_key_encryption_key)
            .await
            .unwrap();

    let decryption_material: SecretDecryptionMaterial = SecretDecryptionMaterial {
        encrypted_decryption_key: encrypted_secret_decryption_key,
        iv: nonce_encrypted_secret_decryption_key.to_vec(),
        username_decryption_nonce: Some(username_decryption_nonce.to_vec()),
        password_decryption_nonce: Some(password_decryption_nonce.to_vec()),
        notes_decryption_nonce: Some(notes_decryption_nonce.to_vec()),
    };

    dbg!("Chaning the name of my testament");
    testament.name = Some("Mein Testament".into());
    let testament = update_user_testament(&a1, testament).await?;
    dbg!("Did this work?");
    dbg!(&testament);

    // get all testaments
    let testament_list: Result<Vec<Testament>, SmartVaultErr> = make_call_with_agent(
        &a1,
        CallType::Query("get_testament_list".into()),
        Option::<Vec<u8>>::None,
    )
    .await
    .unwrap();

    dbg!(&testament_list);

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    ////
    ////  AFTER A LOOOONG TIME
    ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    // 1) Get the cryptographic decryption material (dm) for that particular secret,
    // which can be found in the user's UserVault KeyBox.
    let dmr: Result<SecretDecryptionMaterial, SmartVaultErr> = make_call_with_agent(
        &a1,
        CallType::Query("get_secret_decryption_material".into()),
        Some(secret.id),
    )
    .await
    .unwrap();

    let dm: SecretDecryptionMaterial = dmr.unwrap();

    // the dm (decryption material) contains the "encrypted decryption key".
    // so first, let's get the key to decrypt this "encrypted decryption key" -> vetkd
    let aes_256_key_decryption_key = get_aes_256_gcm_key_for_uservault().await.unwrap();
    let decrypted_decryption_key = aes_gcm_decrypt(
        &dm.encrypted_decryption_key,
        &aes_256_key_decryption_key,
        dm.iv.as_slice().try_into().unwrap(),
    )
    .await
    .unwrap();

    // dbg!(&decrypted_decryption_key);

    let decrypted_username = aes_gcm_decrypt(
        &secret.username.unwrap(),
        &decrypted_decryption_key,
        dm.username_decryption_nonce.unwrap().try_into().unwrap(),
    )
    .await
    .unwrap();

    let uname: String = String::from_utf8(decrypted_username).unwrap();
    assert_eq!(uname, username);
    // dbg!(uname);

    let decrypted_password = aes_gcm_decrypt(
        &secret.password.unwrap(),
        &decrypted_decryption_key,
        dm.password_decryption_nonce.unwrap().try_into().unwrap(),
    )
    .await
    .unwrap();

    let pwd: String = String::from_utf8(decrypted_password).unwrap();
    assert_eq!(pwd, password);
    dbg!(pwd);

    let decrypted_notes = aes_gcm_decrypt(
        &secret.notes.unwrap(),
        &decrypted_decryption_key,
        dm.notes_decryption_nonce.unwrap().try_into().unwrap(),
    )
    .await
    .unwrap();

    let nts: String = String::from_utf8(decrypted_notes).unwrap();
    assert_eq!(nts, notes);
    dbg!(nts);

    // Cleanup
    delete_user(&a1, new_user_1.id).await?;
    println!("   User successfully deleted");
    Ok(())
}

async fn test_user_lifecycle() -> anyhow::Result<()> {
    // create identities (keypairs) and the corresponding senders (principals)
    let i1: BasicIdentity = create_identity();
    let p1: Principal = i1.sender().unwrap();
    let a1: Agent = get_dfx_agent_with_identity(i1).await?;

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

    // Cleanup
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

pub async fn create_user(agent: &Agent) -> anyhow::Result<User, SmartVaultErr> {
    let user: Result<User, SmartVaultErr> = make_call_with_agent(
        agent,
        CallType::Update("create_user".into()),
        Option::<Vec<u8>>::None,
    )
    .await
    .unwrap();

    user
}

async fn add_user_secret(
    agent: &Agent,
    args: &CreateSecretArgs,
) -> anyhow::Result<Secret, SmartVaultErr> {
    let s: Result<Secret, SmartVaultErr> =
        make_call_with_agent(agent, CallType::Update("create_secret".into()), Some(args))
            .await
            .unwrap();

    s
}

async fn update_user_secret(agent: &Agent, args: Secret) -> anyhow::Result<Secret, SmartVaultErr> {
    let s: Result<Secret, SmartVaultErr> =
        make_call_with_agent(agent, CallType::Update("update_secret".into()), Some(args))
            .await
            .unwrap();

    s
}

async fn update_user_testament(
    agent: &Agent,
    args: Testament,
) -> anyhow::Result<Testament, SmartVaultErr> {
    let t: Result<Testament, SmartVaultErr> = make_call_with_agent(
        agent,
        CallType::Update("update_testament".into()),
        Some(args),
    )
    .await
    .unwrap();

    t
}

async fn create_user_testament(
    agent: &Agent,
    args: &CreateTestamentArgs,
) -> anyhow::Result<Testament, SmartVaultErr> {
    let t: Result<Testament, SmartVaultErr> = make_call_with_agent(
        agent,
        CallType::Update("create_testament".into()),
        Some(args),
    )
    .await
    .unwrap();

    t
}

async fn test_secret_lifecycle() -> anyhow::Result<()> {
    // create identities (keypairs) and the corresponding senders (principals)
    let i1: BasicIdentity = create_identity();
    let p1: Principal = i1.sender().unwrap();
    let a1: Agent = get_dfx_agent_with_identity(i1).await?;

    // let's create a new ic crypt user
    let new_user_1 = create_user(&a1).await?;
    assert_eq!(&new_user_1.id, &p1);
    println!("   {}{:?}", "New user created: ", new_user_1.id);

    // Let's create a secret
    let username = "Tobias";
    let password = "123";
    let notes = "My Notes";

    // Get local random aes gcm 256 key to encrypt the secret fields
    let secret_encryption_key = get_local_random_aes_256_gcm_key().await.unwrap();

    // Encrypt secret fields
    let (encrypted_username, username_decryption_nonce) =
        aes_gcm_encrypt(username.as_bytes(), &secret_encryption_key)
            .await
            .unwrap();

    let (encrypted_password, password_decryption_nonce) =
        aes_gcm_encrypt(password.as_bytes(), &secret_encryption_key)
            .await
            .unwrap();

    let (encrypted_notes, notes_decryption_nonce) =
        aes_gcm_encrypt(notes.as_bytes(), &secret_encryption_key)
            .await
            .unwrap();

    // Encrypt the encryption key
    let key_encryption_key = get_aes_256_gcm_key_for_uservault().await.unwrap();
    let (encrypted_secret_decryption_key, nonce_encrypted_secret_decryption_key) =
        aes_gcm_encrypt(&secret_encryption_key, &key_encryption_key)
            .await
            .unwrap();

    let decryption_material: SecretDecryptionMaterial = SecretDecryptionMaterial {
        encrypted_decryption_key: encrypted_secret_decryption_key,
        iv: nonce_encrypted_secret_decryption_key.to_vec(),
        username_decryption_nonce: Some(username_decryption_nonce.to_vec()),
        password_decryption_nonce: Some(password_decryption_nonce.to_vec()),
        notes_decryption_nonce: Some(notes_decryption_nonce.to_vec()),
    };

    // let's add the secret
    let create_secret_args = CreateSecretArgs {
        decryption_material: decryption_material.clone(),
    };

    let mut secret: Secret = add_user_secret(&a1, &create_secret_args).await.unwrap();
    dbg!(&secret);

    // update the secret:
    secret.name = Some("Hey, cool".into());
    secret.category = Some(SecretCategory::Password);
    secret.username = Some(encrypted_username.clone());
    secret.password = Some(encrypted_password.clone());
    secret.url = Some("www.google.com".to_string());
    secret.notes = Some(encrypted_notes.clone());

    let secret = update_user_secret(&a1, secret).await?;

    // get list of all secrets:
    dbg!("let's check whether new secret gets returned by: get_secret_list");

    let secret_list: Result<Vec<SecretListEntry>, SmartVaultErr> = make_call_with_agent(
        &a1,
        CallType::Query("get_secret_list".into()),
        Option::<Vec<u8>>::None,
    )
    .await
    .unwrap();
    dbg!("does not work - does not work - does not work - does not work - does not work - does not work - does not work - ");
    dbg!(secret_list.unwrap());

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    ////
    ////  some time later: user comes back and retrieves secret.
    ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    // 1) Get the cryptographic decryption material (dm) for that particular secret,
    // which can be found in the user's UserVault KeyBox.
    let dmr: Result<SecretDecryptionMaterial, SmartVaultErr> = make_call_with_agent(
        &a1,
        CallType::Query("get_secret_decryption_material".into()),
        Some(secret.id),
    )
    .await
    .unwrap();

    let dm: SecretDecryptionMaterial = dmr.unwrap();

    // the dm (decryption material) contains the "encrypted decryption key".
    // so first, let's get the key to decrypt this "encrypted decryption key" -> vetkd
    let aes_256_key_decryption_key = get_aes_256_gcm_key_for_uservault().await.unwrap();
    let decrypted_decryption_key = aes_gcm_decrypt(
        &dm.encrypted_decryption_key,
        &aes_256_key_decryption_key,
        dm.iv.as_slice().try_into().unwrap(),
    )
    .await
    .unwrap();

    // dbg!(&decrypted_decryption_key);

    let decrypted_username = aes_gcm_decrypt(
        &secret.username.unwrap(),
        &decrypted_decryption_key,
        dm.username_decryption_nonce.unwrap().try_into().unwrap(),
    )
    .await
    .unwrap();

    let uname: String = String::from_utf8(decrypted_username).unwrap();
    assert_eq!(uname, username);
    // dbg!(uname);

    let decrypted_password = aes_gcm_decrypt(
        &secret.password.unwrap(),
        &decrypted_decryption_key,
        dm.password_decryption_nonce.unwrap().try_into().unwrap(),
    )
    .await
    .unwrap();

    let pwd: String = String::from_utf8(decrypted_password).unwrap();
    assert_eq!(pwd, password);
    dbg!(pwd);

    let decrypted_notes = aes_gcm_decrypt(
        &secret.notes.unwrap(),
        &decrypted_decryption_key,
        dm.notes_decryption_nonce.unwrap().try_into().unwrap(),
    )
    .await
    .unwrap();

    let nts: String = String::from_utf8(decrypted_notes).unwrap();
    assert_eq!(nts, notes);
    dbg!(nts);

    // Cleanup
    delete_user(&a1, new_user_1.id).await?;
    println!("   User successfully deleted");
    Ok(())
}
