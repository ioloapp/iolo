use anyhow::Result;
use colored::Colorize;

use crate::utils::agent::{make_call_with_default_agent, CallType};

pub async fn test_utils() -> anyhow::Result<()> {
    println!(
        "{}",
        "\nTesting replica utility functions:\n".yellow().bold()
    );
    println!(
        "  {}{}",
        "Caller: ".green().bold(),
        itest_utils_caller().await?
    );
    println!(
        "  {}{}",
        "Time on the replica: ".bold().green(),
        itest_utils_time().await?
    );
    Ok(())
}

async fn itest_utils_caller() -> Result<String> {
    // dbg!("hihi");
    let caller: String =
        make_call_with_default_agent(CallType::Query("who_am_i".into()), Option::<Vec<u8>>::None)
            .await?;
    Ok(caller)
}

async fn itest_utils_time() -> Result<u64> {
    let time: u64 = make_call_with_default_agent(
        CallType::Query("what_time_is_it".into()),
        Option::<Vec<u8>>::None,
    )
    .await?;
    Ok(time)
}
