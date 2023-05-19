## Current implementation
1. Listen events block by block
2. Submit events to Proof Market
    - For correct work we will need to insure idempotency of bid creation
    - TODO: Check on proof market side if bid already exists

