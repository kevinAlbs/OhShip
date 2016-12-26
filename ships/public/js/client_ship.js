var ClientShip = function(startingState, playerId) {
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
        }, playerId);
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

    // Check if particle field has a 1 for this position, and set to 0 if it does.
    // Returns true if a 1 was there.
    this.checkAndSetParticleField = function(localX, localY) {
        if (!particleField) particleField = ClientShip.getParticleField();
        // Scale down and round.
        var x = Math.floor((localX + hw) / 2), y = Math.floor((localY + hh) / 2);
        if (x < 0 || y < 0 || x > 31 || y > particleField.length - 1) return false;
        var bitPos = (1 << (32 - 1 - x));
        var val = (particleField[y] & bitPos) != 0 ? 1 : 0;
        if (val == 0) return false;
        particleField[y] ^= bitPos; // Set bit to 0.
        return true;
    }

    // Update the ship mask and add particles.
    this.handleCollision = function(x, y) {
        // x and y are given from global coordinates.
        var globalPoint = new PIXI.Point(x,y);
        // TODO: is it bad to use stage without explicitly passing?
        var localPoint = shipSprite.toLocal(globalPoint, stage);
        console.log(localPoint);
        destructionMaskGraphic.beginFill(0x000000);
        destructionMaskGraphic.drawCircle(localPoint.x + hw, localPoint.y + hh, 5);
        destructionMaskGraphic.endFill();
        applyDestructionMask();

        // Get bounding box.
        var boxW = 10, boxH = 10;

        // Use the particle field to generated necessary particles.
        var particleContainer = new PIXI.particles.ParticleContainer();
        // Particle container will be centered at location of impact.
        particleContainer.x = globalPoint.x;
        particleContainer.y = globalPoint.y;
        particleContainer.pivot.set(.5, .5);
        particleContainer.rotation = shipSprite.rotation;
        for (var i = 0; i < boxH; i += 2) {
            for (var j = 0; j < boxW; j += 2) {
                // Coordinates in particle container of particle.
                var particleContainerX = j - boxW / 2;
                var particleContainerY = i - boxH / 2;
                // Coordinates relative to ship.
                var localX = localPoint.x + particleContainerX;
                var localY = localPoint.y + particleContainerY;
                if (this.checkAndSetParticleField(localX, localY)) {
                    // Emit.
                    console.log("Emitting");
                    ClientShip.particleEmitter.emit(
                        particleContainer, particleContainerX, particleContainerY, {explode: true});
                }
            }
        }
        stage.addChild(particleContainer);

        // Lifetime of particle container *must* be greater than the max lifetime of containing
        // particles.
        particleContainers.push({container: particleContainer, lifetime: 2000});
    }

    // Interpolates current state for one frame.
    this.tick = function(delta) {
        updateStateIfNecessary();

        if (state.sunk) { // TODO: clean
            // if (sinkTimer > 0) {
            //     shipSprite.rotation += .0001 * delta;
            //     shipSprite.alpha = Math.min(1, .5 + sinkTimer / 1000);
            //     shipSprite.scale.set(.9 + .1 * (sinkTimer / 1000));
            //     cannonSprite.rotation += .0001 * delta;
            //     cannonSprite.alpha = Math.min(1, .1 + sinkTimer / 1000);
            //     cannonSprite.scale.set(.9 + .1 * (sinkTimer / 1000));
            //     sinkTimer -= delta;
            // }
            // if (sinkTimer <= 0) {
            //     stage.removeChild(shipSprite);
            //     stage.removeChild(cannonSprite);
            // }
            // return;
        }

        for (var i = 0; i < particleContainers.length; i++) {
            particleContainers[i].lifetime -= delta;
            if (particleContainers[i].lifetime <= 0) {
                particleContainers[i].container.destroy();
                particleContainers.splice(i, 1);
            }
        }

        delta /= 30;

        var rotationDelta = (state.leftEngine - state.rightEngine) / 100;
        var forwardDelta = state.leftEngine + state.rightEngine;

        // TODO: Somewhat hacky but easy way to compensate for rotation of ship sprite (chosen to
        // make particle field simpler to use). This may be OK.
        var hPi = Math.PI / 2;

        state.rotation += rotationDelta * delta;
        state.x += forwardDelta * Math.cos(state.rotation - hPi) * delta;
        state.y += forwardDelta * Math.sin(state.rotation - hPi) * delta;

        // Bound coordinates.
        state.x = Math.max(0, state.x);
        state.x = Math.min(state.x, GameConfig.worldWidth);
        state.y = Math.max(0, state.y);
        state.y = Math.min(state.y, GameConfig.worldHeight);

        shipSprite.position.set(state.x, state.y);
        shipSprite.rotation = state.rotation;

        shadowSprite.rotation = state.rotation;
        shadowSprite.position.set(state.x, state.y + 3);

        shipStructureSprite.position.set(state.x, state.y);
        shipStructureSprite.rotation = state.rotation;

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
    shipSprite.position.set(state.x, state.y);
    shipSprite.rotation = state.rotation;

    var shipStructureSprite = new PIXI.Sprite(PIXI.loader.resources.shipStructure.texture);
    shipStructureSprite.anchor.set(.5, .5);
    shipStructureSprite.position.set(10, 10);

    var shadowSprite = new PIXI.Sprite(PIXI.loader.resources.ship.texture);
    shadowSprite.tint = 0x20160c;
    shadowSprite.anchor.set(.5, .5);

    var cannonSprite = new PIXI.Sprite(PIXI.loader.resources.cannon.texture);
    cannonSprite.anchor.set(.3, .5);
    cannonSprite.rotation = state.cannonRotation;

    stage.addChild(shadowSprite);
    stage.addChild(shipStructureSprite);
    stage.addChild(shipSprite);
    stage.addChild(cannonSprite);
    

    // Add the destruction mask, which will be temporarily stored as a graphic for easy updating
    // but needs to be converted to a sprite for application, which needs to be updated on change.

    var w = shipSprite.width
        , h = shipSprite.height
        , hw = shipSprite.width / 2 // half width
        , hh = shipSprite.height / 2 // half height
        ;

    var maskSprite = null; // Initially null until a destruction mask is applied.
    var particleField = null; // Initially null until needed.
    var particleContainers = []; // When a destruction occurs, it creates a temporary container.

    var destructionMaskGraphic = new PIXI.Graphics();
    // Start with complete white to show entire ship.
    destructionMaskGraphic.beginFill(0xFFFFFF);
    destructionMaskGraphic.drawRect(0, 0, w, h);
    destructionMaskGraphic.endFill();
    // Do not apply the mask yet as it is unnecessary until some destruction occurs.

    // Create a ship shared particle pool.
    var pixel = new PIXI.Graphics();
    // pixel.beginFill(0x000000);
    pixel.beginFill(0x3f2e1c);
    pixel.drawRect(0,0,2,2);
    pixel.endFill();
    ClientShip.particleEmitter = new ParticleEmitter(pixel.generateCanvasTexture());
    ClientShip.particleEmitter.create(1000, {});

};

ClientShip.getParticleField = function() {
    // Initialize a static template upon first use.
    if (!ClientShip._kParticleFieldTemplate) {
        // There has got to be a better way in PIXI to get image data from a rendered texture.
        // This post asks the same question
        // http://www.html5gamedevs.com/topic/7074-get-pixeldata-in-a-webgl-canvas/
        // There seems to be a CanvasExtract class for just this, but did not have any luck:
        // http://pixijs.download/release/docs/PIXI.CanvasExtract.html
        // TODO: See if CanvasExtract can be used for cleanliness.

        var shipSprite = new PIXI.Sprite(PIXI.loader.resources.ship.texture);
        var hw = Math.floor(shipSprite.width / 2), hh = Math.floor(shipSprite.height / 2);
        var renderer = new PIXI.CanvasRenderer(hw, hh);
        var particleField = new Uint32Array(hh);
        if (!hw == 32)
            throw 'Particle field implementation assumes ships sprite has width of 64 pixels';
        renderer.backgroundColor = 0xFFFFFF;
        shipSprite.anchor.set(.5, .5);
        shipSprite.position.set(hw / 2, hh / 2);
        // Scale this down slightly since it appears that the particle field covers a slight amount
        // of the border. TODO: why? Actually it seems like it favors the right side...
        shipSprite.scale.set(.47, .47);
        renderer.render(shipSprite);
        document.body.appendChild(renderer.view);
        var imageData = renderer.view.getContext("2d").getImageData(0,0,hw,hh);
        for (var i = 0; i < hh; i++) {
            for (var j = 0; j < hw; j++) {
                if (imageData.data[i * hw * 4 + j * 4] < 255)
                    particleField[i] |= 1 << (32 - 1 - j);
            }
        }

        // To visualize the bitfield, uncomment below.
        // var str = "";
        // for (var i = 0; i < hh; i++) {
        //     for (var j = 0; j < hw; j++) {
        //         str += (particleField[i] & (1 << (32 - 1 - j))) == 0 ? 0 : 1;
        //     }
        //     str += "\n";
        // }
        // console.log(str);

        ClientShip._kParticleFieldTemplate = particleField;
    }
    // Return a copy of the field template.
    return ClientShip._kParticleFieldTemplate.slice();
}