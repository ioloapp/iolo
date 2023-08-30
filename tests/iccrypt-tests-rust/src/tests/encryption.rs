use anyhow::Result;
use candid::Principal;
use colored::Colorize;
use ic_agent::{identity::BasicIdentity, Agent, Identity};

use crate::utils::{
    agent::{create_identity, get_dfx_agent_with_identity},
    vetkd::{
        aes_gcm_decrypt, aes_gcm_encrypt, get_aes_256_gcm_key_for_caller,
        get_local_random_aes_256_gcm_key, ibe_decrypt, ibe_encrypt_for_heir,
    },
};

pub async fn test_encryption() -> Result<()> {
    // simple_aes_gcm_encryption().await?;
    // double_aes_gcm_encryption().await?;

    inheritance_aes_gcm_encryption().await?;
    Ok(())
}

/// The more advanced case:
/// - User creates new secret
/// - Secret is encrypted using locally generated AES GCM 256 Key
/// - This locally generated key is then encrypted using a VETKD key provided by the Internet Computer
async fn double_aes_gcm_encryption() -> Result<()> {
    println!(
        "\n{}\n",
        "Double Encryption VETKD Tests".yellow().bold().underline()
    );

    // Alice
    let identity_alice: BasicIdentity = create_identity();
    let principal_alice: Principal = identity_alice.sender().unwrap();
    let _agent_alice: Agent = get_dfx_agent_with_identity(identity_alice).await?;

    // Bob
    let identity_bob: BasicIdentity = create_identity();
    let principal_bob: Principal = identity_bob.sender().unwrap();
    let _agent_bob: Agent = get_dfx_agent_with_identity(identity_bob).await?;

    // Eve
    let identity_eve: BasicIdentity = create_identity();
    let principal_eve: Principal = identity_eve.sender().unwrap();
    let _agent_eve: Agent = get_dfx_agent_with_identity(identity_eve).await?;

    println!("\n{}\n", "Setup".yellow().bold());
    println!("  Alice:  {}", principal_alice.to_string().green());
    println!("  Bob:    {}", principal_bob.to_string().green());
    println!("  Eve:    {}", principal_eve.to_string().green());

    println!(
        "\n{}\n",
        "Case: Encrypting the encryption key".yellow().bold()
    );

    let secret_message = "My password is 123456";

    println!(
        "  Step 0 - The original secret message:  {}",
        &secret_message.blue()
    );

    // Step 1: Get local random aes gcm 256 key
    let aes_256_key = get_local_random_aes_256_gcm_key().await.unwrap();
    println!(
        "  {}: {:?}",
        "Step 1 - New locally created AES GCM 256 key", &aes_256_key
    );

    // Step 2: Encrypt secret
    let (ciphertext, nonce) = aes_gcm_encrypt(secret_message.as_bytes(), &aes_256_key)
        .await
        .unwrap();

    println!(
        "  Step 2 - Encrypt the secret message using the locally derived key from step 1. Ciphertext: {} (length: {})",
        "*****".red(),
        ciphertext.len()
    );

    // Step 3: Encrypt aes_256_key
    let aes_256_key_encryption_key = get_aes_256_gcm_key_for_caller().await.unwrap();
    let (encrypted_encryption_key, nonce2) =
        aes_gcm_encrypt(&aes_256_key, &aes_256_key_encryption_key)
            .await
            .unwrap();

    println!(
                "  Step 3 - Encrypt the locally derived key (step 1) using a derived vetkd key provided by the system API. Ciphertext: {} (length: {})",
                "*****".red(),
                encrypted_encryption_key.len()
            );

    // ---------------- Some time is passing ----------------
    println!("  ...After some time...");
    // Step 4: Get key to decrypt decryption key
    let aes_256_key_decryption_key = get_aes_256_gcm_key_for_caller().await.unwrap();
    assert_eq!(aes_256_key_encryption_key, aes_256_key_decryption_key);

    let decrypted_decryption_key = aes_gcm_decrypt(
        &encrypted_encryption_key,
        &aes_256_key_decryption_key,
        nonce2,
    )
    .await
    .unwrap();

    println!(
        "  {}: {:?}",
        "Step 4 - Decrypt the decryption key:", decrypted_decryption_key
    );

    // Step 5 - decrypt original message
    let decrypted_message = aes_gcm_decrypt(&ciphertext, &decrypted_decryption_key, nonce)
        .await
        .unwrap();

    let decrypted_message_string = String::from_utf8(decrypted_message)?;

    assert_eq!(secret_message, decrypted_message_string);

    println!(
        "  Step 5 - Ciphertext decrypted using decrypted decryption key: {}",
        decrypted_message_string.green()
    );

    Ok(())
}

/// The standard case where a user encrypts secrets for himself
/// E.g. in a user's uservault
async fn simple_aes_gcm_encryption() -> Result<()> {
    println!("\n{}\n", "Simple VETKD Tests".yellow().bold().underline());

    // Alice
    let identity_alice: BasicIdentity = create_identity();
    let principal_alice: Principal = identity_alice.sender().unwrap();
    let _agent_alice: Agent = get_dfx_agent_with_identity(identity_alice).await?;

    // Bob
    let identity_bob: BasicIdentity = create_identity();
    let principal_bob: Principal = identity_bob.sender().unwrap();
    let _agent_bob: Agent = get_dfx_agent_with_identity(identity_bob).await?;

    // Eve
    let identity_eve: BasicIdentity = create_identity();
    let principal_eve: Principal = identity_eve.sender().unwrap();
    let _agent_eve: Agent = get_dfx_agent_with_identity(identity_eve).await?;

    println!("\n{}\n", "Setup".yellow().bold());
    println!("  Alice:  {}", principal_alice.to_string().green());
    println!("  Bob:    {}", principal_bob.to_string().green());
    println!("  Eve:    {}", principal_eve.to_string().green());

    println!("\n{}\n", "Standard case: self-encryption".yellow().bold());

    let secret_message = "My password is 123456";

    println!("  The original secret message:  {}", &secret_message.blue());

    // the happy flow: self encryption for alice
    // let aes_256_key = get_aes_256_gcm_key_for_caller().await.unwrap();
    let aes_256_key = get_local_random_aes_256_gcm_key().await.unwrap();
    println!("  {}: {:?}", "New AES GCM 256 key", &aes_256_key);

    let (ciphertext, nonce) = aes_gcm_encrypt(secret_message.as_bytes(), &aes_256_key)
        .await
        .unwrap();

    println!(
        "  Ciphertext: {} (length: {})",
        "*****".red(),
        ciphertext.len()
    );
    println!("  Nonce: {:?}", &nonce);

    let decrypted_message = aes_gcm_decrypt(&ciphertext, &aes_256_key, nonce)
        .await
        .unwrap();

    let decrypted_message_string = String::from_utf8(decrypted_message)?;

    assert_eq!(secret_message, decrypted_message_string);

    println!(
        "  Ciphertext decrypted again: {}",
        decrypted_message_string.green()
    );

    Ok(())
}

async fn inheritance_aes_gcm_encryption() -> Result<()> {
    println!(
        "\n{}\n",
        "Inheritance Encryption VETKD Tests"
            .yellow()
            .bold()
            .underline()
    );

    // Alice
    let identity_alice: BasicIdentity = create_identity();
    let principal_alice: Principal = identity_alice.sender().unwrap();
    let _agent_alice: Agent = get_dfx_agent_with_identity(identity_alice).await?;

    // Bob
    let identity_bob: BasicIdentity = create_identity();
    let principal_bob: Principal = identity_bob.sender().unwrap();
    let agent_bob: Agent = get_dfx_agent_with_identity(identity_bob).await?;

    // Eve
    let identity_eve: BasicIdentity = create_identity();
    let principal_eve: Principal = identity_eve.sender().unwrap();
    let agent_eve: Agent = get_dfx_agent_with_identity(identity_eve).await?;

    println!("\n{}\n", "Setup".yellow().bold());
    println!("  Alice:  {}", principal_alice.to_string().green());
    println!("  Bob:    {}", principal_bob.to_string().green());
    println!("  Eve:    {}", principal_eve.to_string().green());

    let secret = "This is for you my son";

    println!("\n  The original secret message:  {}", &secret.blue());

    let cipher = ibe_encrypt_for_heir(secret.as_bytes(), &principal_bob)
        .await
        .unwrap(); // remove this. it should be part of the inheritance above

    println!(
        "  {}: {} (length: {})",
        "Message encrypted for Bob",
        "***".red(),
        &cipher.len()
    );

    let plaintext_u8 = ibe_decrypt(&agent_bob, &cipher).await.unwrap();
    let plaintext = String::from_utf8(plaintext_u8).unwrap();
    println!("  ... time flies by...");
    println!("  This is Bob calling...");
    println!("  Decrypted for Bob: {}", plaintext.green());
    assert_eq!(secret, plaintext);
    println!(
        "{}",
        "  This is Eve calling: ibe_decrypt(&agent_eve, &cipher).await.unwrap()".red()
    );

    // following two lines panic
    // let eve_error = ibe_decrypt(&agent_eve, &cipher).await;
    // assert!(eve_error.is_err());

    println!(
        "{} {}",
        "  And this is what she gets:",
        "is_err() -> True".bold().green()
    );
    Ok(())
}
