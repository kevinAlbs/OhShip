Implement rest of basic functionality messages:
    - kSpawn message

Implement stupid AI

Do a deterministic perf test with digital ocean server on maximum throughput without lag, capture metrics.

Implement a binary message type and optimize until tests are satisfied.

Clean server code when approach is satisfactory.
    - Add checks for abuse (e.g. too many messages within 1 second) and robustness (valid message format)
    - Add comments
    - Reconsider fixed frame time for server
    - Add basic (incomplete) unit test

Finish visual effects for front-end
    - Add player listing with stats and messages
    - Add error message display