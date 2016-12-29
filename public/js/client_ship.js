var ClientShip = function(startingState, playerId, nickname) {
    // Called when ship state update is recieved from server.
    this.applyServerUpdate = function(json) {
        console.log("Ship update ", json.data);
        updateState = json.data;
    }

    this.attemptCannonFire = function(startingState) {
        // TODO: ensure count.
        var positionErrorThreshold = 0;
        // TODO: If the starting state position is significantly different, just override, otherwise take midpoint.
        // But always use the angle given.
        return new ClientCannonball({
            x: startingState.x,
            y: startingState.y,
            angle: startingState.angle
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

    function tickState(delta, st) {
        scale = delta / 30;

        var rotationDelta = (st.leftEngine - st.rightEngine) / 100;
        var forwardDelta = st.leftEngine + st.rightEngine;

        // TODO: Somewhat hacky but easy way to compensate for rotation of ship sprite (chosen to
        // make particle field simpler to use). This may be OK.
        var hPi = Math.PI / 2;

        st.rotation += rotationDelta * scale;
        st.x += forwardDelta * Math.cos(st.rotation - hPi) * scale;
        st.y += forwardDelta * Math.sin(st.rotation - hPi) * scale;

        // Bound coordinates.
        st.x = Math.max(0, st.x);
        st.x = Math.min(st.x, GameConfig.worldWidth);
        st.y = Math.max(0, st.y);
        st.y = Math.min(st.y, GameConfig.worldHeight);
    }

    function interpolate(delta) {
        // If the target state position or rotation is beyond a threshold away from the displayed
        // state, completely override it. Otherwise, we'll interpolate it.
        var xDiff = targetState.x - state.x, yDiff = targetState.y - state.y;
        var rotDiff = targetState.rotation - state.rotation;
        if (Math.pow(xDiff, 2) + Math.pow(yDiff, 2) > Math.pow(GameConfig.shipRadius / 3, 2)) {
            // Override
            state.x = targetState.x;
            state.y = targetState.y;
        } else {
            // Interpolate
            state.x += xDiff * .05;
            state.y += yDiff * .05;
        }

        if (Math.abs(rotDiff) > Math.PI / 4) {
            // Override
            state.rotation = targetState.rotation;
        } else {
            // Interpolate
            state.rotation += (targetState.rotation - state.rotation) * .01;
        }
    }

    function tickEngines(delta) {
        function shouldTick(val, timer) {
            if (val == 0) return false;
            var maxTime = 300, minTime = 30;
            var timeToChange = (maxTime - minTime) * (1 - Math.abs(val)) + minTime;
            if (timer >= timeToChange) {
                return true;
            }
            return false;
        }

        if (shouldTick(state.leftEngine, leftEngineTimer)) {
            var dir = state.leftEngine > 0 ? -1 : 1;
            var next = leftEngineFrame + dir;
            if (next < 0) next = 7;
            else if (next > 7) next = 0;
            leftEngineSprite.gotoAndStop(next);
            leftEngineFrame = next;
            leftEngineTimer = 0;
        }

        if (shouldTick(state.rightEngine, rightEngineTimer)) {
            var dir = state.rightEngine > 0 ? 1 : -1;
            var next = rightEngineFrame + dir;
            if (next < 0) next = 7;
            else if (next > 7) next = 0;
            rightEngineSprite.gotoAndStop(next);
            rightEngineFrame = next;
            rightEngineTimer = 0;
        }

        leftEngineTimer += delta;
        rightEngineTimer += delta;
    }

    // Interpolates current state for one frame.
    this.tick = function(delta) {
        updateStateIfNecessary();

        if (state.sunk) interpolateSinking(delta);

        for (var i = 0; i < particleContainers.length; i++) {
            particleContainers[i].lifetime -= delta;
            if (particleContainers[i].lifetime <= 0) {
                particleContainers[i].container.destroy();
                particleContainers.splice(i, 1);
            }
        }

        tickState(delta, state);
        tickState(delta, targetState);
        interpolate(delta);

        shipSprite.position.set(state.x, state.y);
        shipSprite.rotation = state.rotation;

        shadowSprite.rotation = state.rotation;
        shadowSprite.position.set(state.x, state.y + 3);

        shipStructureSprite.position.set(state.x, state.y);
        shipStructureSprite.rotation = state.rotation;

        cannonSprite.position.set(state.x, state.y);
        cannonSprite.rotation = state.cannonRotation * 2 * Math.PI / 8;

        nicknameBox.position.set(state.x - nicknameBox.width / 2, state.y + 78);

        tickEngines(delta);
    };

    function updateStateIfNecessary() {
        if (!updateState) return;
        // Only directly copy over the engine values to the directly used state.
        if (updateState.hasOwnProperty('leftEngine')) state.leftEngine = updateState.leftEngine;
        if (updateState.hasOwnProperty('rightEngine')) state.rightEngine = updateState.rightEngine;
        if (updateState.hasOwnProperty('cannonRotation')) state.cannonRotation = updateState.cannonRotation;
        if (updateState.hasOwnProperty('sunk')) state.sunk = updateState.sunk;
        // The target state however, will store the most accurate representation.
        _.extend(targetState, updateState);

        if (updateState.sunk) {
            sinkTimer = 2000;
        }

        updateState = null;
    }

    // Call this when this ship will no longer be ticked.
    this.removeSprites = function() {
        stage.removeChild(shipStructureSprite);
        stage.removeChild(shadowSprite);
        stage.removeChild(shipSprite);
        stage.removeChild(cannonSprite);
        stage.removeChild(nicknameBox);
        particleContainers.forEach(function(particleContainer){
            stage.removeChild(particleContainer.container);
        });
    }

    function interpolateSinking(delta) {
        var delay = 1000; // time before sinking animation starts.
        sinkTimer -= delta;

        if (sinkTimer > 0 && sinkTimer < delay) {
            var t = sinkTimer;
            var rot = shipSprite.rotation + .0002 * delta
            , alpha = Math.min(1, .3 + t / 1000)
            , scale = .9 + .1 * (t / 1000)
            ;

            shipSprite.rotation = rot;
            shipSprite.alpha = alpha;
            shipSprite.scale.set(scale, scale);

            shipStructureSprite.rotation = rot;
            shipStructureSprite.alpha = alpha;
            shipStructureSprite.scale.set(scale, scale);

            shadowSprite.rotation = rot;
            shadowSprite.alpha = alpha;
            shadowSprite.scale.set(scale, scale);

            cannonSprite.alpha = alpha;
            cannonSprite.scale.set(scale, scale);
        }
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

    var targetState = {};
    _.extend(targetState, state);

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


    var engineFrames = [];
    for (var i = 0; i < 8; i++) {
        engineFrames.push(new PIXI.Texture(PIXI.loader.resources.engine.texture, new PIXI.Rectangle(i * 24, 0, 24, 24)));
    }
    var leftEngineSprite = new PIXI.extras.AnimatedSprite(engineFrames);
    var rightEngineSprite = new PIXI.extras.AnimatedSprite(engineFrames);

    var leftEngineTimer = 0, rightEngineTimer = 0;
    var leftEngineFrame = 0, rightEngineFrame = 0;

    leftEngineSprite.anchor.set(.5, .5);
    rightEngineSprite.anchor.set(.5, .5);

    leftEngineSprite.position.set(-18, 46);
    rightEngineSprite.position.set(18, 46);

    stage.addChild(shadowSprite);
    stage.addChild(shipStructureSprite);
    stage.addChild(shipSprite);
    stage.addChild(cannonSprite);
    
    shipStructureSprite.addChild(leftEngineSprite);
    shipStructureSprite.addChild(rightEngineSprite);

    // Add label for nickname
    var nicknameLbl = new PIXI.Text(nickname, {fontFamily: "Courier New", fontSize: 12, fill: 0x000000});
    var lblRect = nicknameLbl.getBounds();
    lblRect.pad(2,5);

    var nicknameBox = new PIXI.Graphics();
    nicknameBox.beginFill(0xFFFFFF, .5);
    nicknameBox.drawShape(lblRect);
    nicknameBox.endFill();
    nicknameBox.addChild(nicknameLbl);
    stage.addChild(nicknameBox);

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
    return new Uint32Array(ClientShip._kParticleFieldTemplate);
}