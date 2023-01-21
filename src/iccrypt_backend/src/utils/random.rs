use uuid::Uuid;

pub async fn get_new_uuid() -> String {
    let mut random_bytes = get_random_seed().await;

    //random_bytes.resize(new_len, value)
    random_bytes.resize(16, 0);

    let bytes: [u8; 16] = random_bytes.try_into().unwrap_or_else(|v: Vec<u8>| {
        panic!("Expected a Vec of length {} but it was {}", 16, v.len())
    });

    Uuid::from_bytes(bytes).as_hyphenated().to_string()
}

cfg_if::cfg_if! {
    if #[cfg(test)] {
        // local rust. dummy mockup implementation.
        // TODO: do we want to use a real rng?
        async fn get_random_seed() -> Vec<u8> {
            let mut random_bytes: Vec<u8> = Vec::new();
            for x in 1..33 {
                random_bytes.push(x);
            }
            random_bytes
        }
    } else {
        // Internet Computer
        use candid::Principal;
        use ic_cdk::{call, trap};
        async fn get_random_seed() -> Vec<u8> {
            let random_bytes: Vec<u8> = match call(Principal::management_canister(), "raw_rand", ()).await {
                Ok((res,)) => res,
                Err((_, err)) => trap(&format!("Failed to get random seed: {}", err)),
            };
            random_bytes
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn utest_uuid() {
        let uuid = get_new_uuid().await;
        assert_eq!(
            uuid,
            Uuid::try_parse(&uuid).unwrap().as_hyphenated().to_string()
        );
    }
}
