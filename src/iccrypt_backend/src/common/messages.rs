use candid::{CandidType, Deserialize};
use serde::Serialize;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub enum ReturnMessage<T> {
    Ok(T),
    Err(T),
}
