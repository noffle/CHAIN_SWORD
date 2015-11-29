// so fight me, pff
var chains

var Throw = {
  Ready: 1,
  Thrown: 2,
  Locked: 3,
  PullingSelf: 4,
  PullingSword: 5,
}

function PlayState(game) {
}

PlayState.prototype.preload = function() {
  console.log('preload');

  game.load.image('star_small', 'assets/graphics/_star_small.png');
  game.load.image('star_big', 'assets/graphics/_star_big.png');

  game.load.spritesheet('dust', 'assets/graphics/_dust.png', 8, 8);

  game.load.tilemap('level1', 'assets/maps/test.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.image('tileset', 'assets/graphics/_tileset.png');

  game.load.spritesheet('player', 'assets/graphics/_player.png', 10*2, 16*2);
  game.load.spritesheet('sword', 'assets/graphics/_sword.png', 17*2, 16*2);

  game.load.spritesheet('chain', 'assets/graphics/_chain_segment.png', 5*2, 5*2);

  game.load.image('textbox', 'assets/graphics/_textbox.png');

  game.load.audio('gun', 'assets/sounds/gun.wav');
  game.load.audio('jump', 'assets/sounds/jump.wav');

  game.scale.pageAlignHorizontally = true;
  game.scale.pageAlignVertically = true;
  game.scale.refresh();
};

PlayState.prototype.create = function() {
  console.log('create');

  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.arcade.gravity.y = 1350;
  game.physics.arcade.TILE_BIAS = 40;

  game.gun = game.add.audio('gun');
  game.jump = game.add.audio('jump');

  this.map = game.add.tilemap('level1');
  this.map.addTilesetImage('_tileset', 'tileset');
  this.bg = this.map.createLayer('BG');

  var stars = game.add.group();

  this.fg = this.map.createLayer('FG');
  this.map.setCollisionBetween(1, 300, true, this.fg);
  this.fg.resizeWorld();

  // for(var y = 0; y < this.fg.height; ++y){
  //   for(var x = 0; x < this.fg.width; ++x){
  //       var tile = this.fg.map.getTile(x, y);
  //       if (tile) {
  //         console.log(tile.index, tile.collideDown)
  //         // tile.collidesDown
  //       }
  //   }
  // }

  for (var i=0; i < 10; i++) {
    var sprite = (game.rnd.between(0,100) < 30) ? 'star_big' : 'star_small';
    var star = stars.create(0, 0, sprite)
    star.reset = function() {
      this.x = -10;
      this.y = game.rnd.between(0, 16 * 6);
      this.speed = game.rnd.frac() * this.maxSpeed;
    };
    star.reset()
    star.x = game.rnd.between(0, game.world.width),
    star.maxSpeed = (sprite === 'star_big') ? 0.2 : 0.4;
    star.speed = game.rnd.frac() * star.maxSpeed;
    star.checkWorldBounds = true;
  }
  this.stars = stars;

  // Dust clouds
  this.dust = game.add.group();

  chains = game.add.group();

  var player = game.add.sprite(16*3, 136*2, 'player');
  player.animations.add('idle', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 10, true);
  player.animations.add('jump_upward', [2], 10, false);
  player.animations.add('jump_downward', [3], 10, false);
  player.animations.play('idle');
  player.anchor.set(0.4, 0.5);
  game.physics.enable(player);
  player.body.bounce.set(0.1, 0.03);
  player.body.collideWorldBounds = true;
  player.body.drag.set(2000, 0);
  player.body.maxVelocity.x = 150;
  player.body.setSize(8*2, 12*2, 0*2, 2*2);
  player.swordState = Throw.Ready
  player.walkForce = 1500;
  player.jumpForce = 460;
  player.fireDelay = 150;
  player.fireCountdown = 0;
  player.team = 0xFF0000;
  this.player = player;

  var sword = game.add.sprite(16*2, 96*2, 'sword');
  sword.animations.add('idle', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 10, true);
  sword.animations.add('jump_upward', [2], 10, false);
  sword.animations.add('jump_downward', [3], 10, false);
  sword.animations.play('idle');
  sword.tint = player.team
  player.anchor.set(0.4, 0.5);
  player.sword = sword;

  player.canJump = function() {
    return this.body.onFloor() || this.body.touching.down;
  };

  player.jump = function() {
    if (this.canJump()) {
      this.body.velocity.y = -this.jumpForce;
      game.jump.play();
      game.state.getCurrentState().spawnJumpDust(this.x, this.y + this.height * 0.5)
    }
  };

  player.update = function() {
    player.sword.visible = (this.swordState === Throw.Ready)

    if (player.chain && player.chain.sprite) {
      var sword = player.chain.sword
      var angle = game.math.angleBetween(player.x, player.y, sword.x, sword.y)
      player.chain.sprite.x = player.x
      player.chain.sprite.y = player.y
      player.chain.sprite.angle = angle * (180 / Math.PI)
      var dist = game.math.distance(player.x, player.y, sword.x, sword.y)
      player.chain.sprite.width = dist
    }

    if (this.canJump()) {
      player.animations.play('idle');
      player.sword.animations.play('idle');
    } else if (this.body.velocity.y < -10) {
      player.animations.play('jump_upward');
      player.sword.animations.play('jump_upward');
    } else if (this.body.velocity.y > 10) {
      player.animations.play('jump_downward');
      player.sword.animations.play('jump_downward');
    }

    player.sword.x = player.x - player.anchor.x * player.width + player.body.velocity.x * game.time.physicsElapsed
    player.sword.y = player.y - player.anchor.y * player.height + player.body.velocity.y * game.time.physicsElapsed

    // reel sword back in
    if (this.swordState === Throw.PullingSelf || this.swordState === Throw.PullingSword) {
      var sword = player.chain.sword
      if (player.swordState === Throw.PullingSelf) {
        player.pullAccum += 1
        var angle = game.math.angleBetween(this.x, this.y, sword.x, sword.y)
        var pullForce = Math.min(20, player.pullAccum)
        player.body.velocity.x += Math.cos(angle) * pullForce
        player.body.velocity.y += Math.sin(angle) * pullForce
        // player.body.moveRight(Math.cos(angle) * pullForce)
        // player.body.moveDown(Math.sin(angle) * pullForce)
      } else if (player.swordState === Throw.PullingSword) {
        var angle = game.math.angleBetween(sword.x, sword.y, this.x, this.y)
        var pullForce = 20
        sword.body.velocity.x += Math.cos(angle) * pullForce
        sword.body.velocity.y += Math.sin(angle) * pullForce
      }
      if (game.math.distance(this.x, this.y, sword.x, sword.y) < 21) {
        player.chain.sprite.kill()
        player.chain = null
        sword.kill()
        player.swordState = Throw.Ready
      }
    }
  };

  player.shootChain = function(dirX, dirY) {
    this.pullAccum = 0
    var lastSeg;
    var height = 5
    var width = 10
    var maxForce = 2000000
    var length = 15
    var state = game.state.getCurrentState()

    this.swordState = Throw.Thrown

    // sword
    var sword = game.add.sprite(this.x, this.y, 'sword')
    game.physics.arcade.enable(sword, false);
    sword.anchor.set(0.2, 0.5)
    sword.scale.x = this.scale.x
    sword.tint = this.team
    sword.body.allowGravity = false
    sword.body.fixedRotation = true
    sword.update = function () {
      if (!this.hitGround) {
        // sword.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x)
        sword.body.velocity.x = 750 * dirX
        sword.body.velocity.y = 750 * dirY
      }
    }
    // sword.body.onBeginContact.add(function (body, shapeA, shapeB, equation) {
    //   if (!this.done && !this.hitGround && shapeB.material.name === 'ground') {
    //     this.hitGround = true
    //     game.state.getCurrentState().spawnOmniDust(this.x, this.y)
    //     var maxForce = 2000000
    //     this.lock = game.physics.p2.createRevoluteConstraint(this.body, [0, -10], worldBody, [this.x, this.y], maxForce);
    //     this.body.allowGravity = false
    //     this.done = true
    //     player.swordState = Throw.Locked
    //   }
    // }, sword)

    var chain = this.game.add.tileSprite(player.x, player.y, 128, 8, 'chain');
    chain.anchor.set(0, 0.5)
    chain.tint = player.team

    player.chain = {}
    player.chain.sprite = chain

    player.chain.sword = sword
    player.chain.reelIn = function () {
      player.retractSword = true
      player.swordState = Throw.PullingSelf
    }
    player.chain.detach = function () {
      sword.body.allowGravity = true
      player.swordState = Throw.PullingSword
    }

    if (dirY === -1) {
      sword.angle = -90
    }
    // if (dirY === 1) {
    //   sword.angle = 90
    // }
  };
};


PlayState.prototype.update = function() {
  game.physics.arcade.collide(this.player, this.fg, function(plr, tile) {
    if (plr.body.velocity.y < -3 && plr.body.velocity.y > -30) {
      game.state.getCurrentState().spawnLandingDust(plr.x, plr.y + plr.height * 0.5 - plr.body.velocity.y / 2)
    }
  })
  game.physics.arcade.collide(chains, this.fg, function(chain, tile) {
      chain.body.velocity.x *= 0.96
      chain.body.velocity.y *= 0.96
    });

  if (this.player.chain) {
    game.physics.arcade.collide(this.player.chain.sword, this.fg, function(sword, tile) {
      if (!sword.hitGround) {
        sword.hitGround = true
        game.state.getCurrentState().spawnOmniDust(sword.x, sword.y)
        game.state.getCurrentState().player.swordState = Throw.Locked
      }
    })
  }

  this.player.body.acceleration.x = 0;
  if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
    this.player.body.acceleration.x = -this.player.walkForce;
    this.player.scale.x = -1;
    this.player.sword.scale.x = -1;
  }
  if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
    this.player.body.acceleration.x = this.player.walkForce;
    this.player.scale.x = 1;
    this.player.sword.scale.x = 1;
  }

  this.player.update();

  // Detach sword from target
  if (game.input.keyboard.justReleased(Phaser.Keyboard.X)) {
    if (this.player.swordState === Throw.PullingSelf || this.player.swordState === Throw.PullingSword) {
      this.player.chain.detach()
    }
  }

  if (game.input.keyboard.justPressed(Phaser.Keyboard.X)) {
    // Throw sword
    if (this.player.swordState === Throw.Ready) {
      var dirX = this.player.scale.x
      var dirY = 0
      if (game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        dirY = -1
        dirX = 0
      }
      if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
        dirY = 1
        dirX = 0
      }
      this.player.shootChain(dirX, dirY)
      this.player.fireCountdown = this.player.fireDelay;
      // game.gun.play();
    } else if (this.player.swordState === Throw.Locked && this.player.fireCountdown <= 0) {
      this.player.chain.reelIn()
    }
  }
  this.player.fireCountdown -= game.time.elapsed;
  this.player.jumpCountdown -= game.time.elapsed;

  if (game.input.keyboard.isDown(Phaser.Keyboard.Z)) {
    this.player.jump();
  }


  this.stars.forEachAlive(function(s) {
    s.x += s.speed;
    if (s.x > game.world.width + 10) {
      s.reset()
    }
  });
};

PlayState.prototype.render = function() {
  // game.debug.body(this.player);
}

PlayState.prototype.spawnDust = function(x, y) {
  var dust = this.dust.create(x, y, 'dust');
  dust.anchor.set(0.5, 0.5);
  dust.animations.add('normal', [0, 1, 2, 3, 4], 10);
  dust.animations.play('normal', null, false, true);
  game.physics.enable(dust, Phaser.Physics.ARCADE);
  dust.body.allowGravity = false
  var ang = game.math.degToRad(game.rnd.angle());
  dust.body.velocity.x = Math.random() * 100 - 50
  dust.body.velocity.y = Math.sin(ang) * 10;
  // game.add.tween(dust).to({angle: 360}, 3200).start();
  return dust
}

PlayState.prototype.spawnJumpDust = function(x, y) {
  for (var i=0; i < 2; i++) {
    var dust = game.state.getCurrentState().spawnDust(x, y)
    dust.body.velocity.x = (i < 1 ? -1 : 1) * game.rnd.between(20, 30)
    dust.body.velocity.y = game.rnd.between(0, -10)
  }
  for (var i=0; i < 3; i++) {
    var dust = game.state.getCurrentState().spawnDust(x + game.rnd.between(-5, 5), y)
    dust.body.velocity.x = game.rnd.between(-10, 10)
    dust.body.velocity.y = game.rnd.between(-25, -50)
  }
}

PlayState.prototype.spawnLandingDust = function(x, y) {
  for (var i=0; i < 6; i++) {
    var dust = game.state.getCurrentState().spawnDust(x, y)
    dust.body.velocity.x = (i < 3 ? -1 : 1) * game.rnd.between(90, 130)
    dust.body.velocity.y = 20
    dust.update = function() {
      this.body.velocity.y -= 2
      this.body.velocity.x *= 0.92
    }
  }
}

PlayState.prototype.spawnOmniDust = function(x, y) {
  for (var i=0; i < 6; i++) {
    var dust = game.state.getCurrentState().spawnDust(x, y)
    var ang = Math.random() * Math.PI * 2
    dust.body.velocity.x = Math.cos(ang) * game.rnd.between(25, 50)
    dust.body.velocity.y = Math.sin(ang) * game.rnd.between(25, 50)
  }
}

var w = 160 * 4;
var h = 144 * 4;
var game = new Phaser.Game(w, h, Phaser.AUTO, 'monochain');
game.state.add('play', PlayState);
game.state.start('play');



Phaser.TileSprite.prototype.kill = function() {
    this.stopScroll();
    this.alive = false;
    this.exists = false;
    this.visible = false;

    if (this.events)
    {
        this.events.onKilled.dispatch(this);
    }

    return this;
};
