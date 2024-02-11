pub async fn get_new_random() -> [u8; 16] {
    get_random_array().await
}

cfg_if::cfg_if! {
    if #[cfg(test)] {
        // local rust, dummy mockup implementation.
        async fn get_random_array() -> [u8;16] {
            // create 16 random u8
            (0..16)
                .map(|_| rand::random::<u8>())
                .collect::<Vec<u8>>()
                .try_into()
                .unwrap_or([0; 16])
        }

    } else {
        use candid::Principal;
        async fn get_random_array() -> [u8;16]{
            let mut random_bytes: Vec<u8> = match ic_cdk::call(Principal::management_canister(), "raw_rand", ()).await {
                Ok((res,)) => res,
                Err((_, err)) => ic_cdk::trap(&format!("Failed to get random seed: {}", err)),
            };

            random_bytes.resize(16, 0);

            let bytes: [u8; 16] = random_bytes.try_into().unwrap_or_else(|v: Vec<u8>| {
                panic!("Expected a Vec of length {} but it was {}", 16, v.len())
            });

            bytes
        }
    }
}
