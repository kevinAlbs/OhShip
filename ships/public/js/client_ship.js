var ClientShip = function(startingState) {
    // Called when ship state update is recieved from server.
    this.applyServerUpdate = function(json) {
        updateState = json.data;
    }

    this.attemptCannonFire = function() {
        // TODO: ensure count.
        return new ClientCannonball({
            x: state.x,
            y: state.y,
            angle: state.cannonRotation
        });
    }

    this.isSinking = function () {
        return state.sunk && sinkTimer > 0;
    }

    this.isFinishedSinking = function() {
        return state.sunk && sinkTimer <= 0;
    }

    this.getState = function() {
        return state;
    }

    // Update the ship mask and add particles.
    this.handleCollision = function(x, y) {
        // x and y are given from global coordinates.
        var globalPoint = new PIXI.Point(x,y);
        var localPoint = shipSprite.toLocal(globalPoint);
        console.log(localPoint);
        destructionMaskGraphic.beginFill(0x000000);
        destructionMaskGraphic.drawCircle(localPoint.x + hw, localPoint.y + hh, 10);
        destructionMaskGraphic.endFill();
        applyDestructionMask();
    }

    // Interpolates current state for one frame.
    this.tick = function(delta) {
        updateStateIfNecessary();

        if (state.sunk) { // TODO: clean
            if (sinkTimer > 0) {
                shipSprite.rotation += .0001 * delta;
                shipSprite.alpha = Math.min(1, .5 + sinkTimer / 1000);
                shipSprite.scale.set(.9 + .1 * (sinkTimer / 1000));
                cannonSprite.rotation += .0001 * delta;
                cannonSprite.alpha = Math.min(1, .1 + sinkTimer / 1000);
                cannonSprite.scale.set(.9 + .1 * (sinkTimer / 1000));
                sinkTimer -= delta;
            }
            if (sinkTimer <= 0) {
                stage.removeChild(shipSprite);
                stage.removeChild(cannonSprite);
            }
            return;
        }

        delta /= 30;

        var rotationDelta = (state.leftEngine - state.rightEngine) / 100;
        var forwardDelta = state.leftEngine + state.rightEngine;

        state.rotation += rotationDelta * delta;
        state.x += forwardDelta * Math.cos(state.rotation) * delta;
        state.y += forwardDelta * Math.sin(state.rotation) * delta;

        shipSprite.position.set(state.x, state.y);
        shipSprite.rotation = state.rotation;

        cannonSprite.position.set(state.x, state.y);
        cannonSprite.rotation = state.cannonRotation;
    };

    function updateStateIfNecessary() {
        if (!updateState) return;
        _.extend(state, updateState);

        if (updateState.sunk) {
            sinkTimer = 1000;
        }

        console.log(state);
        updateState = null;
    }

    function applyDestructionMask() {
        // For whatever reason, generateCanvasTexture only uses positive coordinates, so translate.
        // TODO: Is this a bug or misunderstanding?
        if (maskSprite) shipSprite.removeChild(maskSprite);
        maskSprite = PIXI.Sprite.from(destructionMaskGraphic.generateCanvasTexture())
        maskSprite.position.x = -hw;
        maskSprite.position.y = -hh;
        shipSprite.addChild(maskSprite);
        shipSprite.mask = maskSprite;
    }
    
    // Add to rendering.
    var state = {
        x: 0,
        y: 0,
        leftEngine: 0,
        rightEngine: 0,
        rotation: 0,
        cannonRotation: 0,
        flagColor: 0xFF0000,
        sunk: false
    };

    _.extend(state, startingState);

    // If present, this is the udpated state recieved from server.
    var updateState = null;

    var sinkTimer = 0;

    // Add all sprites for this ship.
    var shipSprite = new PIXI.Sprite(PIXI.loader.resources.ship.texture);
    shipSprite.anchor.set(.5, .5);

    shipSprite.position.x = state.x;
    shipSprite.position.y = state.y;
    shipSprite.rotation = state.rotation;

    var cannonSprite = new PIXI.Sprite(PIXI.loader.resources.cannon.texture);
    cannonSprite.anchor.set(.3, .5);
    cannonSprite.rotation = state.cannonRotation;
    stage.addChild(shipSprite);
    //stage.addChild(cannonSprite);

    // Add the destruction mask, which will be temporarily stored as a graphic for easy updating
    // but needs to be converted to a sprite for application, which needs to be updated on change.

    var w = shipSprite.width
        , h = shipSprite.height
        , hw = shipSprite.width / 2 // half width
        , hh = shipSprite.height / 2 // half height
        ;

    var maskSprite = null; // Initially null until a destruction mask is applied.

    var destructionMaskGraphic = new PIXI.Graphics();
    // Start with complete white to show entire ship.
    destructionMaskGraphic.beginFill(0xFFFFFF);
    destructionMaskGraphic.drawRect(0, 0, w, h);
    destructionMaskGraphic.endFill();
    // Do not apply the mask yet as it is unnecessary until some destruction occurs.
};
