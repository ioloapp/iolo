use candid::candid_method;

pub mod smart_vaults;
pub mod users;

// thread_local! {
//     // SECRETS: UserId -> PasswordMap -> Password
//     static SECRETS: RefCell<MasterVault> = RefCell::new(MasterVault::new());
//     static SETTINGS: RefCell<String> = RefCell::new(String::new());
// }

#[ic_cdk_macros::init]
fn init() {}

#[ic_cdk_macros::query]
#[candid_method(query)]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
