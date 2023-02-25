use candid::{CandidType, Deserialize};
use serde::Serialize;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub enum ReturnMessage<T, E> {
    Ok(T),
    Err(E),
}
