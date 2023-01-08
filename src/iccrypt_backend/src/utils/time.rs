// cfg_if::cfg_if! {
//     if #[cfg(test)] {
//         // we are in the test environment

//         pub fn get_current_time() -> u64 {
//             dbg!("i am here in test ----------------------");
//             // std::time::SystemTime::now()
//             // .duration_since(std::time::UNIX_EPOCH)
//             // .expect("Error getting system time")
//             // .as_secs()
//             123
//         }
//     } else {
//         // we are running on the ic (local or web)
//         pub fn get_current_time() -> u64 {
//             //ic_cdk::api::time()
//             dbg!("i am here in not test ----------------------");
//             123
//         }
//     }
// }

pub fn get_current_time() -> u64 {
    123
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
