use anyhow::Result;
use candid::Principal;
use colored::Colorize;
use ic_agent::{identity::BasicIdentity, Agent, Identity};

use crate::{
    types::{
        secret::{
            AddSecretArgs, Secret, SecretCategory, SecretDecryptionMaterial, SecretListEntry,
        },
        smart_vault_err::SmartVaultErr,
    },
    utils::{
        agent::{create_identity, get_dfx_agent_with_identity, make_call_with_agent, CallType},
        secret::{add_user_secret, update_user_secret},
        user::{create_user, delete_user},
        vetkd::{
            aes_gcm_decrypt, aes_gcm_encrypt, get_aes_256_gcm_key_for_uservault,
            get_local_random_aes_256_gcm_key,
        },
    },
};

pub async fn test_smart_vaults_secrets() -> Result<()> {
    println!(
        "\n{}",
        "Testing smart vaults and testaments".yellow().bold()
    );
    test_secret_lifecycle().await?;
    Ok(())
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
    let uservault_encryption_key = get_aes_256_gcm_key_for_uservault().await.unwrap();
    let (encrypted_secret_decryption_key, nonce_encrypted_secret_decryption_key) =
        aes_gcm_encrypt(&secret_encryption_key, &uservault_encryption_key)
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
    // to create a secret the backend only asks for the decryption material
    let add_secret_args = AddSecretArgs {
        id: "1".to_string(),
        category: Some(SecretCategory::Password),
        name: Some("Hey, cool".to_string()),
        username: Some(encrypted_username.clone()),
        password: Some(encrypted_password.clone()),
        url: Some("www.google.com".to_string()),
        notes: Some(encrypted_notes.clone()),
        decryption_material: decryption_material.clone(),
    };

    let mut secret: Secret = add_user_secret(&a1, &add_secret_args).await.unwrap();

    secret.name = Some("another_name".into());

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
    let uservault_decryption_key = get_aes_256_gcm_key_for_uservault().await.unwrap();
    let decrypted_decryption_key = aes_gcm_decrypt(
        &dm.encrypted_decryption_key,
        &uservault_decryption_key,
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
