pub async fn derive_encryption_key(master_key_id: i32, derivation_id: &str) -> Option<Vec<u8>> {
    fetch_encryption_key(master_key_id, derivation_id).await
}

pub async fn derive_decryption_key(master_key_id: i32, derivation_id: &str) -> Option<Vec<u8>> {
    fetch_decryption_key(master_key_id, derivation_id).await
}

pub async fn derive_encryption_key_pem(master_key_id: i32, derivation_id: &str) -> Option<String> {
    fetch_encryption_key_pem(master_key_id, derivation_id).await
}

pub async fn derive_decryption_key_pem(master_key_id: i32, derivation_id: &str) -> Option<String> {
    fetch_decryption_key_pem(master_key_id, derivation_id).await
}

cfg_if::cfg_if! {
    if #[cfg(test)] {
        // local rust, dummy mockup implementation.
        async fn fetch_encryption_key(master_key_id: i32, derivation_id: &str) -> Option<Vec<u8>> {
            // TODO: this is not a real rsa encryption key
            Some(vec![master_key_id as u8,derivation_id.as_bytes()[0],3].to_vec())
        }

        async fn fetch_decryption_key(master_key_id: i32, derivation_id: &str) -> Option<Vec<u8>> {
            // TODO: this is not a real rsa decryption key
            Some(vec![master_key_id as u8,derivation_id.as_bytes()[0],3].to_vec())
        }

        async fn fetch_encryption_key_pem(master_key_id: i32, derivation_id: &str) -> Option<String> {
            // TODO: this is not a real rsa encryption key
            Some(String::from("FOO"))
        }

        async fn fetch_decryption_key_pem(master_key_id: i32, derivation_id: &str) -> Option<String> {
            // TODO: this is not a real rsa decryption key
            Some(String::from("FOO"))
        }

    } else {
        use candid::Principal;
        // TODO: put ID of canister somewhere global?
        const IC_KEY_DERIVATION_CANISTER: &str = "r7inp-6aaaa-aaaaa-aaabq-cai";

        async fn fetch_encryption_key(master_key_id: i32, derivation_id: &str) -> Option<Vec<u8>>{
            let ic_key_derivation_canister = Principal::from_text(IC_KEY_DERIVATION_CANISTER).unwrap();

            let random_bytes: Vec<u8> = match ic_cdk::call(ic_key_derivation_canister, "derive_encryption_key", (master_key_id, derivation_id)).await {
                Ok((res,)) => res,
                Err((_, err)) => ic_cdk::trap(&format!("Failed to fetch encryption key with error: {}", err)),
            };

            Some(random_bytes)
        }

        async fn fetch_decryption_key(master_key_id: i32, derivation_id: &str) -> Option<Vec<u8>>{
            let ic_key_derivation_canister = Principal::from_text(IC_KEY_DERIVATION_CANISTER).unwrap();

            let random_bytes: Vec<u8> = match ic_cdk::call(ic_key_derivation_canister, "derive_decryption_key", (master_key_id, derivation_id)).await {
                Ok((res,)) => res,
                Err((_, err)) => ic_cdk::trap(&format!("Failed to fetch decryption key with error: {}", err)),
            };

            Some(random_bytes)
        }

        async fn fetch_encryption_key_pem(master_key_id: i32, derivation_id: &str) -> Option<String>{
            let ic_key_derivation_canister = Principal::from_text(IC_KEY_DERIVATION_CANISTER).unwrap();

            let random_string: String = match ic_cdk::call(ic_key_derivation_canister, "derive_encryption_key_pem", (master_key_id, derivation_id)).await {
                Ok((res,)) => res,
                Err((_, err)) => ic_cdk::trap(&format!("Failed to fetch encryption key with error: {}", err)),
            };

            Some(random_string)
        }

        async fn fetch_decryption_key_pem(master_key_id: i32, derivation_id: &str) -> Option<String>{
            let ic_key_derivation_canister = Principal::from_text(IC_KEY_DERIVATION_CANISTER).unwrap();

            let random_string: String = match ic_cdk::call(ic_key_derivation_canister, "derive_decryption_key_pem", (master_key_id, derivation_id)).await {
                Ok((res,)) => res,
                Err((_, err)) => ic_cdk::trap(&format!("Failed to fetch decryption key with error: {}", err)),
            };

            Some(random_string)
        }
    }
}
