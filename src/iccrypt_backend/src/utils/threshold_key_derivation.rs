pub async fn derive_encryption_key(master_key_id: i32, derivation_id: &str) -> Option<Vec<u8>> {
    fetch_encryption_key(master_key_id, derivation_id).await
}

cfg_if::cfg_if! {
    if #[cfg(test)] {
        // local rust, dummy mockup implementation.
        async fn fetch_encryption_key(master_key_id: i32, derivation_id: &str) -> Option<Vec<u8>> {
            Some(vec![1,2,3].to_vec())
        }

    } else {
        use candid::Principal;
        async fn fetch_encryption_key(master_key_id: i32, derivation_id: &str) -> Option<Vec<u8>>{
            let ic_key_derivation_canister = Principal::from_text("r7inp-6aaaa-aaaaa-aaabq-cai").unwrap();
            // remote: fn derive_encryption_key(master_key_id: i32, derivation_id: String) -> Option<Vec<u8>>

            let random_bytes: Vec<u8> = match ic_cdk::call(ic_key_derivation_canister, "derive_encryption_key", (master_key_id, derivation_id)).await {
                Ok((res,)) => res,
                Err((_, err)) => ic_cdk::trap(&format!("Failed to fetch encryption key with error: {}", err)),
            };

            // random_bytes.resize(16, 0);

            // let bytes: [u8; 16] = random_bytes.try_into().unwrap_or_else(|v: Vec<u8>| {
            //     panic!("Expected a Vec of length {} but it was {}", 16, v.len())
            // });

            Some(random_bytes)
        }
    }
}
