Tests have moved.

In order to have proper outside-in tests comprising all the canisters, integration tests have moved to iccrypt/tests/.

The rust project at iccrypt/tests/iccrypt-tests-js uses the IC Javascript agent to perform outside-in tests. It is a bin project. So moving into that directory and calling >cargo run will perform all the tests.



