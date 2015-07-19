Losing interest in this project for a few reasons:
- Not much learning potential except for design and getting P2 to work the way I want
- Getting an interesting game (with partial destruction, harpoons, etc.) requires a lot
more work than I want to invest

## Low Priority ##
- Remove jQuery dependency in controller
- Design a realistic theme for the controller
- Custom flags

## Notes ##
- In PhysicsEditor, export as Lime+Corona (JSON)
- Game ID should be only letters, so phone keyboard need not be switched
- Potentially redesign to use sprites instead of custom classes, thereby 
making it easier to define collisions (since collision event listeners have
native access to sprite). Additionally, if I want to minimize communication between
entity classes, they likely won't have much functionality aside from creation/modification,
all which can be done by simple methods...
But then again, where would I store metadata (owner of cannonball, or health of ship?)