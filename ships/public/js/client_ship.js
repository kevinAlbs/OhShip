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
        destructionMaskGraphic.drawCircle(localPoint.x + hw, localPoint.y + hh, 5);
        destructionMaskGraphic.endFill();
        applyDestructionMask();

        // Use the particle field to generated necessary particles.
        // TODO
        // Get bounding box.
        var boxX = globalPoint.x - 5, boxY = globalPoint.y - 5, boxW = 10, boxH = 10;
        var particleContainer = new PIXI.particles.ParticleContainer();
        particleContainer.x = boxX;
        particleContainer.y = boxY;
        console.log(particleContainer.x, particleContainer.y);
        particleContainer.rotation = shipSprite.rotation;
        var pixel = new PIXI.Graphics();
        pixel.beginFill(0x000000);
        pixel.drawRect(0,0,1,1);
        pixel.endFill();
        var pixelTex = pixel.generateCanvasTexture();
        

        for (var i = 0; i < boxH; i++) {
            for (var j = 0; j < boxW; j++) {
                var pixelSprite = PIXI.Sprite.from(pixelTex);
                pixelSprite.x = j;
                pixelSprite.y = i;
                particleContainer.addChild(pixelSprite);
            }
        }
        stage.addChild(particleContainer);
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

    // Create a ship shared particle pool.
    var pixel = new PIXI.Graphics();
    pixel.beginFill(0x000000);
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
        var renderer = new PIXI.CanvasRenderer(181, 91);
        renderer.backgroundColor = 0xFFFFFF;
        renderer.render(shipSprite);
        document.body.appendChild(renderer.view);
        var imageData = renderer.view.getContext("2d").getImageData(0,0,181,91);
        var s = "";
        console.log(imageData);
        for (var i = 0; i < imageData.height; i++) {
            for (var j = 0; j < imageData.width; j++) {
                // Check if ship pixel
                if (imageData.data[i*imageData.width*4 + j*4] < 255) s += "+";
                else s += "O";
            }
            s += "\n";
        }
        console.log(s);
        // var renderTex = PIXI.RenderTexture.create(181, 91);
        // console.log(renderTex);
        // renderer.render(shipSprite, renderTex);
        // var dataExtractor = new PIXI.extract.canvas(renderTex);
        // console.log(dataExtractor.pixels());
    }
    // Make a copy of the field.
}