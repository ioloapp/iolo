use clap::{Args, Parser, Subcommand};

/// The ICCrypt test program
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
pub struct Arguments {
    /// Setup a clean IC and install the canisters
    #[arg(short, long)]
    pub clean: bool,

    /// Upgrade a canister. Use --upgrade all to upgrade all canisters
    #[arg(short, long)]
    pub upgrade: Option<String>,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Specify which tests to execute
    TestSet(TestArgs),
}

#[derive(Args)]
pub struct TestArgs {
    pub name: String,

    /// Upgrade canisters before executing test set
    #[arg(short, long)]
    pub upgrade: bool,
}
