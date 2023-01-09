cfg_if::cfg_if! {
    if #[cfg(test)] {
        pub fn get_current_time() -> u64 {
            std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("Error getting system time")
            .as_secs()
        }
    } else {
        pub fn get_current_time() -> u64 {
            ic_cdk::api::time()
        }
    }
}

// alternative
// pub fn get_current_time_v2() -> u64 {
//     let time: u64;
//     if cfg!(test) {
//         // we are in the test environment -> local rust
//         time = std::time::SystemTime::now()
//             .duration_since(std::time::UNIX_EPOCH)
//             .expect("error getting system time")
//             .as_secs();
//     } else {
//         // we are running on the ic
//         time = ic_cdk::api::time();
//     }
//     time
// }
