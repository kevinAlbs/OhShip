# Networking #
Goal is to support at least 1000 players at a time with minimal lag.

- Compress refresh updates or buffered state changes (if size > threshold)
	- [Snappy](https://github.com/kesla/node-snappy)
	- [Zlib](http://nodeca.github.io/pako/)
- Potentially use heirarchy of servers to distribute bandwidth load
- Use UNIX timestamp and keep running average/variance to alert user if too much latency.
- Use [bufferedAmount attribute](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) to check if user is not able to send messages

- Only do client prediction after server initiates action. If the error for a property is more than a threshold, do a complete refresh for that ship. Keep a count of the number of refreshes, if a count for a specified interval is above a threshold, display a warning.

- Cannonballs are initiated by server, but should be nearly deterministic.

Server Events:
- Cannonball fired (x, y, direction, ship_id)
- Ship movement (left, right)
- Ship sinking (ship_id, [angle])
- Ship revived
- Flag change
- User connect/disconnect
- Score change

Draw state machine

Working on:
- Test with stupid AI to see max capacity on digital ocean server.