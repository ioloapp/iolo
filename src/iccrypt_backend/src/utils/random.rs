use uuid::Uuid;

pub async fn get_new_uuid() -> String {
    create_uuid().await
}

cfg_if::cfg_if! {
    if #[cfg(test)] {
        // local rust, dummy mockup implementation.
        async fn create_uuid() -> String {
            let id = Uuid::new_v4();
            id.to_string()
        }
    } else {
        // Internet Computer
        // use candid::Principal;
        // use ic_cdk::{call, trap};
        // #[ic_cdk_macros::query]
        async fn create_uuid() -> String{
            // this management canistesr call throws errors. don't know why. can't find a good
            // answer on the forum.
            // Error msg: Error: The Replica returned an error: code 5, message: "IC0504: Canister rrkah-fqaaa-aaaaa-aaaaq-cai violated contract: "ic0_call_new" cannot be executed in non replicated query mode"
            // TODO find fix for this!
            // let random_bytes: Vec<u8> = match call(Principal::management_canister(), "raw_rand", ()).await {
            //     Ok((res,)) => res,
            //     Err((_, err)) => trap(&format!("Failed to get random seed: {}", err)),
            // };
            // random_bytes

            // WORKAROUND: generating some pseudorandomness using the timestamp
            let mut random_bytes: Vec<u8> = Vec::new();
            let seed: u8 = ic_cdk::api::time() as u8;
            for x in 1..33 {
                random_bytes.push(seed + x);
            }

            random_bytes.resize(16, 0);

            let bytes: [u8; 16] = random_bytes.try_into().unwrap_or_else(|v: Vec<u8>| {
                panic!("Expected a Vec of length {} but it was {}", 16, v.len())
            });

            Uuid::from_bytes(bytes).as_hyphenated().to_string()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[tokio::test]
    async fn utest_uuid() {
        let uuid = get_new_uuid().await;
        assert_eq!(
            uuid,
            Uuid::try_parse(&uuid).unwrap().as_hyphenated().to_string()
        );
    }
}
