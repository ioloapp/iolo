use candid::candid_method;
use ic_cdk::caller;

pub mod smart_vaults;
pub mod smart_wallets;
pub mod users;
pub mod utils;

// for the candid file creation
use crate::smart_vaults::secret::Secret;
use crate::smart_vaults::user_safe::UserSafe;
use crate::users::user::UserID;
candid::export_service!();

#[ic_cdk_macros::init]
fn init() {}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn say_hi() -> String {
    let caller = caller();
    let mut r: String = String::from("Greetings from the backend. It is currently ");
    r.push_str(&ic_cdk::api::time().to_string());
    r.push_str(" o'clock and i can see you with caller ID: ");
    r.push_str(&caller.to_string());
    r
}

#[cfg(test)]
mod tests {
    use crate::__export_service;

    #[test]
    fn get_candid() {
        println!("####### Candid START #######");
        println!();
        std::println!("{}", __export_service());
        println!();
        println!("####### Candid END #######");
    }
}
