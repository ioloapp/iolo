use std::fs;

use candid::Deserialize;
use serde::Serialize;

#[derive(Serialize, Deserialize, Debug)]
pub struct KeyPair {
    pub private_key: Vec<u8>,
    pub public_key: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct KeyPairs(pub Vec<KeyPair>);

pub fn read_keys() -> KeyPairs {
    dbg!("hi");
    let data = fs::read_to_string("KeyPairs").expect("Unable to read file");
    let kp: KeyPairs = serde_json::from_str(&data).unwrap();
    kp
}
