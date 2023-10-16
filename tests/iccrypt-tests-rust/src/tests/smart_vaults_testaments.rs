use std::collections::{BTreeMap, HashSet};

use anyhow::Result;
use candid::Principal;
use colored::Colorize;
use ic_agent::{identity::BasicIdentity, Agent, Identity};

use crate::{
    types::{
        secret::{AddSecretArgs, Secret, SecretCategory, SecretSymmetricCryptoMaterial},
        smart_vault_err::SmartVaultErr,
        testament::{AddTestamentArgs, Testament},
    },
    utils::{
        agent::{create_identity, get_dfx_agent_with_identity, make_call_with_agent, CallType},
        secret::add_user_secret,
        user::{create_user, delete_user},
        vetkd::{
            aes_gcm_decrypt, aes_gcm_encrypt, get_aes_256_gcm_key_for_testament,
            get_aes_256_gcm_key_for_uservault, get_local_random_aes_256_gcm_key,
        },
    },
};

pub async fn test_smart_vaults_testaments() -> Result<()> {
    println!(
        "\n{}",
        "Testing smart vaults and testaments".yellow().bold()
    );
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

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //  first - we need a user and a  frist secret
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////

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

    // Encrypt secret fields using the secret_encryption_key.
    // note: we get the cipher plus the nonce required for decryption.
    // nonce is public information
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

    // Encrypt the encryption key we used for encrypting the secret using the uservault encryption key
    let uservault_encryption_key = get_aes_256_gcm_key_for_uservault().await.unwrap();
    let (encrypted_secret_decryption_key, nonce_encrypted_secret_decryption_key) =
        aes_gcm_encrypt(&secret_encryption_key, &uservault_encryption_key)
            .await
            .unwrap();

    let crypto_material: SecretSymmetricCryptoMaterial = SecretSymmetricCryptoMaterial {
        encrypted_symmetric_key: encrypted_secret_decryption_key,
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
        symmetric_crypto_material: crypto_material.clone(),
    };

    let secret: Secret = add_user_secret(&a1, &add_secret_args).await.unwrap();

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    ////
    ////    we are all good
    ////
    ////    let us create a testament now
    ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    println!("{}", "Let's create a testament - yeah".yellow().bold());
    // at this point, creating a testament does not require any args. this probably will change in the future,
    // which is why we alraedy introduce the wrapper (=CreateTestamentArgs)
    let ada: AddTestamentArgs = AddTestamentArgs {
        id: "Testament 1".into(),
        name: Some("Mein Testament".into()),
        heirs: HashSet::new(),
        secrets: HashSet::new(),
        key_box: BTreeMap::new(),
    };

    let mut testament = add_user_testament(&a1, &ada).await.unwrap();

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
    let testament_encryption_key = get_aes_256_gcm_key_for_testament(testament.id.clone())
        .await
        .unwrap();

    // remember the "secret_encryption_key"? it was the one we derived locally and used for encrypting the actual secret fields like pwd and username.
    // as we will make this secret part of the testament (keybox) we need to get that secret_encryption_key and make it part of the testament (of course encrypted
    // by the testament encryption key)
    let (encrypted_secret_decryption_key, nonce_encrypted_secret_decryption_key) =
        aes_gcm_encrypt(&secret_encryption_key, &testament_encryption_key)
            .await
            .unwrap();

    println!(
        "{}",
        "this is the key we use for encrypting the testament".yellow()
    );
    dbg!(&testament_encryption_key);

    let crypto_material: SecretSymmetricCryptoMaterial = SecretSymmetricCryptoMaterial {
        encrypted_symmetric_key: encrypted_secret_decryption_key,
        iv: nonce_encrypted_secret_decryption_key.to_vec(),
        username_decryption_nonce: Some(username_decryption_nonce.to_vec()),
        password_decryption_nonce: Some(password_decryption_nonce.to_vec()),
        notes_decryption_nonce: Some(notes_decryption_nonce.to_vec()),
    };

    dbg!("Chaning the name of my testament and put the key into the keybox");
    testament.name = Some("Mein Testament".into());
    testament.key_box.insert(secret.id.clone(), crypto_material);
    let testament = update_user_testament(&a1, testament).await?;
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
    ////  TODO: THIS IS NOT COMPLETE YET - THE FOLLOWING SECTION IS BASED ON CODE FOR USERVAULT TEST.
    ////
    ////  AFTER A LOOOONG TIME
    ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    // 1) Get the cryptographic decryption material (dm) for that particular secret,
    // which can be found in the user's UserVault KeyBox.
    let dmr: Result<SecretSymmetricCryptoMaterial, SmartVaultErr> = make_call_with_agent(
        &a1,
        CallType::Query("get_secret_symmetric_crypto_material".into()),
        Some(secret.id),
    )
    .await
    .unwrap();

    let dm: SecretSymmetricCryptoMaterial = dmr.unwrap();

    // the dm (decryption material) contains the "encrypted decryption key".
    // so first, let's get the key to decrypt this "encrypted decryption key" -> vetkd
    let uservault_decryption_key = get_aes_256_gcm_key_for_uservault().await.unwrap();
    let decrypted_decryption_key = aes_gcm_decrypt(
        &dm.encrypted_symmetric_key,
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

async fn add_user_testament(
    agent: &Agent,
    args: &AddTestamentArgs,
) -> anyhow::Result<Testament, SmartVaultErr> {
    let t: Result<Testament, SmartVaultErr> =
        make_call_with_agent(agent, CallType::Update("add_testament".into()), Some(args))
            .await
            .unwrap();
    t
}
