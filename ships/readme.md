Client to Server messages:
1. Update engines
2. Update cannon velocity
3. Fire cannon
4. Change flag
5. Change nickname [meta]
6. Disconnect [meta]

Server to Client messages:
1. Ship update (max of 5kb)
2. Complete refresh (5kb)
3. Ship create
4. Ship remove (on disconnect)

- Get messages working
- Add robustness checks (if we can't keep messaging rate up, need to do something)
- Add abuse checks (if user is sending too many messages in one second, close connection)
