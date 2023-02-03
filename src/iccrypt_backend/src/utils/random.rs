use uuid::Uuid;

pub async fn get_new_uuid() -> String {
    let ra: [u8; 16] = get_random_array().await;
    Uuid::from_bytes(ra).as_hyphenated().to_string()
}

cfg_if::cfg_if! {
    if #[cfg(test)] {
        // local rust, dummy mockup implementation.
        async fn get_random_array() -> [u8;16] {
            [rand::random();16]
        }

    } else {
        async fn get_random_array() -> [u8;16]{
            let management_canister = ic_cdk::export::Principal::management_canister();
            let mut random_bytes: Vec<u8> = match ic_cdk::call(management_canister, "raw_rand", ()).await {
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
