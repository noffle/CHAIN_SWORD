var worldBody

// EXPERIMENTS
var EXPERIMENTS = {
  'sword-float': true,
  '8-dir':       false,
}
console.log('experiments', EXPERIMENTS)

var currentLevel = 0
var ticks = 0

var scores = []

var players = []

var WINS_TO_PROCEED = 10
var SWORD_SPEED = 650
var SWORD_PULL_SELF_SPEED = 400 * 1.5
var SWORD_PULL_SWORD_SPEED = 550

var Throw = {
  Ready: 1,
  Thrown: 2,
  Locked: 3,
  PullingSelf: 4,
  PullingSword: 5,
  Slashing: 6,
  NoSword: 7,
  Dead: 8
}

var tints = {
  strings: [
    "#ff0000",
    "#00ff00",
    "#ff00ff",
    "#ffff00"
  ],
  numbers: [
    0xff0000,
    0x00ff00,
    0xff00ff,
    0xffff00
  ]
}

function createPlayerScore (idx) {
	var style = { font: "25px Arial", fill: tints.strings[idx], align: "center" };
  var text = game.add.text(game.world.centerX - 250 + idx * 150, game.world.height-10, "P1:  3", style);
  text.anchor.set(0.5);
  text.visible = false

  var bubbleBg = game.add.sprite(text.x, text.y - 7, 'bubble_bg')
  bubbleBg.anchor.set(0.5, 0.5)
    // to: function (properties, duration, ease, autoStart, delay, repeat, yoyo) {
  game.add.tween(bubbleBg).to({y: bubbleBg.y - 5}, 1500, Phaser.Easing.Quadratic.InOut, true, 0, 10000, true).start();

  var bubbleFg = game.add.sprite(text.x, text.y - 7, 'bubble_fg')
  bubbleFg.anchor.set(0.5, 0.5)
  bubbleFg.tint = tints.numbers[idx]
    // to: function (properties, duration, ease, autoStart, delay, repeat, yoyo) {
  game.add.tween(bubbleFg).to({y: bubbleFg.y - 5}, 1500, Phaser.Easing.Quadratic.InOut, true, 0, 10000, true).start();

  var bubblePop = game.add.sprite(text.x, text.y - 7, 'bubble_pop')
  bubblePop.anchor.set(0.5, 0.5)
  bubblePop.visible = false

  var score = { value: 0, sprite: text, bubbleBg: bubbleBg, bubbleFg: bubbleFg }

  score.set = function (value) {
    this.sprite.text = 'P' + idx + '  ' + value
    this.value = value
  }

  score.inc = function () {
    this.set(this.value + 1)

    if (this.value === WINS_TO_PROCEED) {
      game.sfx.music.stop()
      unhookAllInput()
      runWinnerSequence(idx)
    }
  }

  score.dec = function () {
    this.set(this.value - 1)
  }

  score.join = function () {
    this.bubbleBg.visible = false
    this.bubbleFg.visible = false
    bubblePop.visible = true
    setTimeout(function () {
      bubblePop.visible = false
      text.visible = true
      score.set(0)
    }, 200)
  }

  score.leave = function () {
    bubblePop.visible = false
    this.sprite.visible = false
    this.bubbleBg.visible = true
    this.bubbleFg.visible = true
    this.set(0)
  }

  return score
}

var inputs

function playerJoin (idx) {
  players[idx] = this.createPlayer(this.spawns[idx].x, this.spawns[idx].y, tints.numbers[idx])
  players[idx].spawnDelay = 70

  players[idx].invincibilityCountdown = 220

  players[idx].input = inputs[idx]
  game.state.getCurrentState().spawnDeathDust(players[idx])
  scores[idx].join()
  game.sfx.spawn.play()
  // if (game.input.gamepad.pad4.connected) {
}

function PlayState(game) {
}

PlayState.prototype.preload = function() {
  console.log('preload');

  game.load.image('star_small', 'assets/graphics/_star_small.png');
  game.load.image('star_big', 'assets/graphics/_star_big.png');

  game.load.spritesheet('dust', 'assets/graphics/_dust.png', 8, 8);

  game.load.tilemap('level1', 'assets/maps/sgunn.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.tilemap('level2', 'assets/maps/pit.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.tilemap('level3', 'assets/maps/tfall.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.tilemap('level4', 'assets/maps/corridors.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.tilemap('level5', 'assets/maps/islands.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.image('tileset', 'assets/graphics/_tileset.png');

  game.load.spritesheet('player', 'assets/graphics/_player.png', 10*2, 16*2);
  game.load.spritesheet('player_sword', 'assets/graphics/_sword.png', 17*2, 16*2);
  game.load.image('player_sword_slash', 'assets/graphics/_sword_slash.png')
  game.load.image('sword', 'assets/graphics/_raw_sword.png');

  game.load.image('chain', 'assets/graphics/_chain_segment.png')
  game.load.image('chain_particle', 'assets/graphics/_chain_particle.png')
  game.load.image('1x1_particle', 'assets/graphics/_1x1_particle.png')

  game.load.image('textbox', 'assets/graphics/_textbox.png');

  game.load.image('bubble_bg', 'assets/graphics/_bubble.png');
  game.load.image('bubble_fg', 'assets/graphics/_bubble_letter.png');
  game.load.image('bubble_pop', 'assets/graphics/_bubble_pop.png');

  game.load.audio('shoot', 'assets/sounds/shoot.wav');
  game.load.audio('jump', 'assets/sounds/jump.wav');
  game.load.audio('spawn', 'assets/sounds/spawn.wav');
  game.load.audio('death', 'assets/sounds/death.wav');
  game.load.audio('chain', 'assets/sounds/chain_loop.wav');
  game.load.audio('impact1', 'assets/sounds/impact1.wav');
  game.load.audio('impact2', 'assets/sounds/impact2.wav');
  game.load.audio('impact3', 'assets/sounds/impact3.wav');
  // game.load.audio('impact4', 'assets/sounds/impact4.wav');
  game.load.audio('shatter', 'assets/sounds/shatter.wav');
  game.load.audio('music', 'assets/sounds/music.mp3');

  game.scale.pageAlignHorizontally = true;
  game.scale.pageAlignVertically = true;
  game.scale.refresh();
};

PlayState.prototype.create = function() {
  console.log('create');

  game.input.gamepad.start();

  inputs = [
    {
      gamepad: game.input.gamepad.pad1,
      up: Phaser.Keyboard.UP,
      down: Phaser.Keyboard.DOWN,
      left: Phaser.Keyboard.LEFT,
      right: Phaser.Keyboard.RIGHT,
      jump: Phaser.Keyboard.Z,
      shoot: Phaser.Keyboard.X
    },
    {
      gamepad: game.input.gamepad.pad2,
      up: Phaser.Keyboard.W,
      down: Phaser.Keyboard.S,
      left: Phaser.Keyboard.A,
      right: Phaser.Keyboard.D,
      jump: Phaser.Keyboard.O,
      shoot: Phaser.Keyboard.P
    },
    {
      gamepad: game.input.gamepad.pad3,
      // up: Phaser.Keyboard.UP,
      // down: Phaser.Keyboard.DOWN,
      // left: Phaser.Keyboard.LEFT,
      // right: Phaser.Keyboard.RIGHT,
      // jump: Phaser.Keyboard.Z,
      shoot: Phaser.Keyboard.T
    },
    {
      gamepad: game.input.gamepad.pad4,
      // up: Phaser.Keyboard.UP,
      // down: Phaser.Keyboard.DOWN,
      // left: Phaser.Keyboard.LEFT,
      // right: Phaser.Keyboard.RIGHT,
      // jump: Phaser.Keyboard.Z,
      // shoot: Phaser.Keyboard.T
    }
  ]
  injectInput(inputs[0], false)
  injectInput(inputs[1], false)
  injectInput(inputs[2], false)
  injectInput(inputs[3], false)

  game.physics.startSystem(Phaser.Physics.P2JS);
  game.physics.p2.gravity.y = 900;
  game.physics.p2.restitution = 0.1
  game.physics.p2.world.defaultContactMaterial.friction = 0.5
  game.physics.p2.world.setGlobalStiffness(1e5);
  // game.physics.p2.TILE_BIAS = 40;

  game.sfx = {}
  game.sfx.shoot = game.add.audio('shoot');
  game.sfx.shoot.volume = 0.3
  game.sfx.jump = game.add.audio('jump');
  game.sfx.jump.volume = 0.6
  game.sfx.spawn = game.add.audio('spawn');
  game.sfx.death = game.add.audio('death');
  game.sfx.chain = game.add.audio('chain');
  game.sfx.chain.loop = true
  game.sfx.chain.volume = 0.1
  game.sfx.impact1 = game.add.audio('impact1');
  game.sfx.impact1.volume = 0.8
  game.sfx.impact2 = game.add.audio('impact2');
  game.sfx.impact2.volume = 0.8
  game.sfx.impact3 = game.add.audio('impact3');
  game.sfx.impact3.volume = 0.8
  game.sfx.shatter = game.add.audio('shatter');
  game.sfx.shatter.volume = 0.8

  game.sfx.music = game.add.audio('music');
  game.sfx.music.play()
  game.sfx.music.loop = true
  game.sfx.music.volume = 0.7

  this.dustCollisionGroup = game.physics.p2.createCollisionGroup();
  this.chainCollisionGroup = game.physics.p2.createCollisionGroup();
  this.playerCollisionGroup = game.physics.p2.createCollisionGroup();
  this.groundCollisionGroup = game.physics.p2.createCollisionGroup();

  this.map = game.add.tilemap('level' + (currentLevel+1));
  this.map.addTilesetImage('_tileset', 'tileset');
  this.bg = this.map.createLayer('BG');

  var stars = game.add.group();

  this.spawns = []
  var spawns = this.spawns;
  if (this.map.objects.Respawns) {
    this.map.objects.Respawns.forEach(function(spawn, b, c) {
      spawns.push({
        x: spawn.x,
        y: spawn.y
      })
    });
  }

  this.groundMaterial = game.physics.p2.createMaterial('ground');
  this.playerMaterial = game.physics.p2.createMaterial('player');
  this.chainMaterial = game.physics.p2.createMaterial('chain');
  var groundPlayerCM = game.physics.p2.createContactMaterial(this.groundMaterial, this.playerMaterial)
  groundPlayerCM.friction = 0.2
  groundPlayerCM.restitution = 0.15
  groundPlayerCM.stiffness = 1e7
  var groundChainCM = game.physics.p2.createContactMaterial(this.groundMaterial, this.chainMaterial)
  groundChainCM.friction = 0.3
  groundChainCM.restitution = 0.5

  // sword group
  this.swords = game.add.group()

  this.fg = this.map.createLayer('FG');
  this.map.setCollisionBetween(1, 400, true, this.fg);
  this.fg.resizeWorld();
  var tiles = game.physics.p2.convertTilemap(this.map, this.fg)
    var that = this
    tiles.forEach(function (tile) {
        tile.setCollisionGroup(that.groundCollisionGroup)
        tile.collides([that.playerCollisionGroup, that.chainCollisionGroup])
        tile.setMaterial(that.groundMaterial)
        // tile.debug = true
        })
  game.physics.p2.setBoundsToWorld(true, true, true, true, false)

    game.physics.p2.setWorldMaterial(this.groundMaterial, true, true, true, true);

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

  scores[0] = createPlayerScore(0)
  scores[1] = createPlayerScore(1)
  scores[2] = createPlayerScore(2)
  scores[3] = createPlayerScore(3)

  players = []

  worldBody = game.add.sprite(0, 0, 'star_small')
  game.physics.p2.enable(worldBody);
  worldBody.body.static = true
  worldBody.body.debug = true
}

PlayState.prototype.createPlayer = function(x, y, team) {
  var spawns = game.state.getCurrentState().spawns

  var player = game.add.sprite(x, y, 'player');
  player.swordState = Throw.Ready
  player.animations.add('idle', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 10, true);
  player.animations.add('jump_upward', [2], 10, false);
  player.animations.add('jump_downward', [3], 10, false);
  player.animations.play('idle');
  player.anchor.set(0.4, 0.5);
  game.physics.p2.enable(player);
  player.body.setMaterial(this.playerMaterial)
  player.body.fixedRotation = true
  // player.body.setCircle(15, 5, 0)
  player.body.setCollisionGroup(this.playerCollisionGroup)
  player.body.collides([this.groundCollisionGroup])
  // player.body.debug = true
  player.body.mass = 10
  player.body.collideWorldBounds = true;
  player.walkForce = 40000;
  player.jumpForce = 360;
  player.fireDelay = 250;
  player.fireCountdown = 0;
  player.wallJumpCountdown = 0
  player.team = team
  player.jumpCountdown = 0
  player.psychicCountdown = 0

  player.body.onBeginContact.add(function (body, shapeA, shapeB, equation) {
    if (shapeB.material.name == 'ground') {
      if (this.body.velocity.y < -10 && this.body.velocity.y > -40) {
        game.state.getCurrentState().spawnLandingDust(this.x, this.y + this.height * 0.5 - 4)
      }
      if (this.body.velocity.y < -25) {
        game.sfx.impact2.play()
      }
    }
    // console.log(shapeA.material)
    // console.log(shapeB.material)
  }, player)

  var sword = game.add.sprite(16*2, 96*2, 'player_sword');
  sword.animations.add('idle', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], 10, true);
  sword.animations.add('jump_upward', [2], 10, false);
  sword.animations.add('jump_downward', [3], 10, false);
  sword.animations.play('idle');
  sword.tint = player.team
  player.anchor.set(0.4, 0.5);
  player.sword = sword;

  player.onSideWall = function() {
    var yAxis = [1, 0]
    var result = false;
    for (var i=0; i < game.physics.p2.world.narrowphase.contactEquations.length; i++)
    {
      var c = game.physics.p2.world.narrowphase.contactEquations[i];
      if (c.bodyA === player.body.data || c.bodyB === player.body.data)
      {
        var d = p2.vec2.dot(c.normalA, yAxis);
        if (c.bodyA === player.body.data)
        {
          d *= -1;
        }
        if (d > 0.5 || d < -0.5)
        {
          result = d
        }
      }
    }
    return (!result ? false : d)
  }

  player.onGround = function () {
    var yAxis = [0, 1]
    var result = false;
    for (var i=0; i < game.physics.p2.world.narrowphase.contactEquations.length; i++)
    {
      var c = game.physics.p2.world.narrowphase.contactEquations[i];
      if (c.bodyA === player.body.data || c.bodyB === player.body.data)
      {
        var d = p2.vec2.dot(c.normalA, yAxis);
        if (c.bodyA === player.body.data)
        {
          d *= -1;
        }
        if (d > 0.5)
        {
          result = true;
        }
      }
    }
    return result;
  }

  player.canJump = function s() {
    if (this.jumpCountdown > 0) {
      return false
    }
    return this.onGround()
    // return this.body.onFloor() || this.body.touching.down;
  };

  player.slash = function() {
    var slash = game.add.sprite(this.x + this.scale.x * 8, this.y, 'player_sword_slash');
    slash.anchor.set(0.5, 0.5);
    game.physics.p2.enable(slash)
    // slash.body.setCollisionGroup(this.slashCollisionGroup)
    slash.body.collides([])
    slash.body.kinematic = true
    slash.body.allowGravity = false
    slash.tint = this.team
    slash.scale.x = this.scale.x
    // slash.scale.x *= 2.5
    // slash.scale.y *= 1.5

    var dirX = this.scale.x
    var lifetime = 0.06

    this.slashSprite = slash
    this.swordState = Throw.Slashing

    slash.update = function () {
      this.body.moveRight(dirX * 512)
      // this.body.moveDown(dirX * 64)
      this.scale.x *= 1.1
      this.scale.y *= 1.01
      lifetime -= game.time.physicsElapsed
      if (lifetime <= 0) {
        player.slashSprite = null
        player.swordState = Throw.Ready
        this.destroy()
      }
    }
  }

  player.jump = function() {
    // regular jumping
    if (this.canJump()) {
      this.body.moveUp(this.jumpForce)
      // this.body.velocity.y = -this.jumpForce;
      this.jumpCountdown = 500
      game.sfx.jump.play();
      game.state.getCurrentState().spawnJumpDust(this.x, this.y + this.height * 0.5)
    }

    // wall jumping
    if (!this.canJump() && this.onSideWall() && this.jumpCountdown < 0) {
      this.body.moveUp(this.jumpForce * 1.0)
      var wallDir = this.onSideWall()
      var wallJumpForce = 200

      // give a boost if you face away from the wall
      if ((this.scale.x < 0 && wallDir > 0) || (this.scale.x > 0 && wallDir < 0)) {
        wallJumpForce *= 8
        this.body.moveUp(this.jumpForce * 1.5)
      }

      if (wallDir > 0) this.body.moveLeft(200)
      else this.body.moveRight(200)
      this.jumpCountdown = 500
      this.wallJumpCountdown = 500
      game.state.getCurrentState().spawnJumpDust(this.x, this.y + this.height * 0.5)
    }
  };

  player.update = function() {
    if (game.paused) return

    if (this.y > 2000) {
      murderPlayer(this, null)
      return
    }

    if (this.onGround() && ticks % 4 === 0) {
      this.body.velocity.x *= 0.99
    }
    // return this.body.onFloor() || this.body.touching.down;

    this.sword.visible = (this.swordState === Throw.Ready && this.visible)

    if (this.spawnDelay) this.spawnDelay--

    if (this.invincibilityCountdown > 0) {
      this.invincibilityCountdown--
      this.visible = this.invincibilityCountdown % 10 >= 5
    } else {
      this.visible = true
    }

    if (this.wip) return

    // check for other swords hitting us
    for (var i=0; i < players.length; i++) {
      if (!players[i]) continue
      if (players[i] !== this) {
        var player = players[i]

        if (player.chain) {
          var dist = game.math.distance(this.x, this.y, player.chain.sword.x, player.chain.sword.y)
          if (dist <= 16 && this.visible) {
            if (this.invincibilityCountdown > 0 && !player.chain.sword.lock) {
              player.chain.detach()
              player.chain.hit = true
              break
            }

            var that = this
            that.wip = true
            gameFreeze(0.1, function() {
              game.paused = false
              that.wip = false

              scores[players.indexOf(player)].inc()

              murderPlayer(that, player)
            })
            break
          }
        }
      }
    }

    // check for sword vs sword collisions
    if (this.chain) {
      for (var i=0; i < players.length; i++) {
        if (!players[i]) continue
        if (players[i] !== this && players[i].chain && players[i].chain.sword) {
          var player = players[i]
          var dist = game.math.distance(player.chain.sword.x, player.chain.sword.y, this.chain.sword.x, this.chain.sword.y)
          if (dist <= 17 && !this.chain.hit) {
            if (!player.chain.sword.lock) {
              player.chain.detach()
              player.chain.hit = true
            }
            if (!this.chain.sword.lock) {
              this.chain.detach()
              this.chain.hit = true
            }
            game.state.getCurrentState().spawnOmniDust(this.chain.sword.x, this.chain.sword.y)
            game.sfx.impact3.play()
            break
          }
        }
      }
    }

    // check for other swords colliding with my chain
    if (this.chain) {
      // step along player->sword line, checking distance along the way to each sword
      var start = [this.x, this.y]
      var end = [this.chain.sword.x, this.chain.sword.y]
      var step = [end[0] - start[0], end[1] - start[1]]
      var len = Math.sqrt(step[0]*step[0] + step[1]*step[1])
      if (len > 0) {
        var STEP_SIZE = 16
        step[0] = (step[0] / len) * STEP_SIZE
        step[1] = (step[1] / len) * STEP_SIZE
        var steps = len / STEP_SIZE
        for (var i=0; i < players.length; i++) {
          if (!players[i]) continue
          if (players[i] !== this && players[i].chain && !this.chain.hit) {
            var player = players[i]
            if (player.chain) {
              var pos = [start[0], start[1]]
              var done = false
              for (var j=0; j < steps && !done; j++) {
                var dist = game.math.distance(pos[0], pos[1], player.chain.sword.x, player.chain.sword.y)
                if (dist <= 10) {
                  var that = this
                  this.chain.hit = true
                  gameFreeze(0.1, function() {
                    that.lastHit = player  // mark this player as the killer if the player dies from falling down a pit, swordless
                    game.state.getCurrentState().spawnLandingDust(player.chain.sword.x, player.chain.sword.y)
                    player.chain.reelIn()
                    player.chain.detach()
                    game.sfx.shatter.play()
                    if (that.chain) {
                      // spawn broken chain fragments
                      var steps = 0
                      stepAlongLineSeg(start, end, STEP_SIZE / 2, function (x, y) {
                        var seg = game.state.getCurrentState().spawnChainSeg(x, y)
                        seg.tint = that.team
                        seg.alpha = 0.6
                        var dist = game.math.distance(x, y, player.chain.sword.x, player.chain.sword.y) + 0.01
                        var impact = 50 - dist/5
                        impact = Math.max(0, impact * 15)
                        seg.body.velocity.x += Math.cos(player.chain.sword.rotation) * impact + game.rnd.between(-5, 5)
                        seg.body.velocity.y += Math.sin(player.chain.sword.rotation) * impact + game.rnd.between(-5, 5)
                        seg.lifetime = 3 + steps * 0.02
                        steps++
                        return true
                      })

                      that.chain.sprite.kill()

                      // create new 'sword pickup' object at old sword's coords
                      var sword = game.add.sprite(that.chain.sword.x, that.chain.sword.y, 'sword')
                      game.physics.p2.enable(sword, false);
                      sword.tint = that.team
                      sword.body.mass = 10
                      sword.body.angularVelocity = game.rnd.between(-10, 10)
                      // sword.body.debug = true
                      sword.body.setMaterial(game.state.getCurrentState().chainMaterial)
                      sword.body.setCollisionGroup(game.state.getCurrentState().chainCollisionGroup)
                      sword.body.collides([game.state.getCurrentState().groundCollisionGroup, game.state.getCurrentState().chainCollisionGroup])
                      sword.anchor.set(0.5, 0.5)
                      sword.body.allowGravity = true
                      sword.body.velocity.x += Math.cos(player.chain.sword.rotation) * 450
                      sword.body.velocity.y += Math.sin(player.chain.sword.rotation) * 450
                      that.looseSword = sword
                      sword.update = function () {
                        if (EXPERIMENTS['sword-float']) {
                          if (this.y > 510) {
                            if (ticks % 15 === 0) {
                              game.state.getCurrentState().spawnLandingDust(this.body.x, this.body.y + 20)
                            }
                          }
                          if (this.y > 520) {
                            this.body.velocity.y = -20
                          }
                        }
                        for (var i=0; i < players.length; i++) {
                          if (!players[i]) continue
                          if (players[i].swordState === Throw.NoSword) {
                            var dist = game.math.distance(players[i].x, players[i].y, this.x, this.y)
                            // console.log(dist)
                            if (dist <= 16) {
                              this.lastHit = null  // clear the 'lastHit' register now that their sword is back
                              var that = this
                              gameFreeze(0.1, function() {
                                players[i].swordState = Throw.Ready
                                players[i].fireCountdown = 500
                                that.kill()
                                that.destroy()
                              })
                              return
                            }
                          }
                        }
                      }
                      sword.body.onBeginContact.add(function (body, shapeA, shapeB, equation) {
                        if (shapeB.material && shapeB.material.name == 'ground') {
                          if (Math.abs(this.body.velocity.y) > 10) {
                            game.state.getCurrentState().spawnLandingDust(this.x, this.y)
                            game.sfx.impact3.play()
                          }
                        } else {
                          this.body.angularVelocity += 30
                          this.body.velocity.y += -35
                        }
                      }, sword)
                      game.physics.p2.removeConstraint(that.chain.sword.lock)
                      that.chain.sword.kill()
                      that.chain = null
                    }
                    that.swordState = Throw.NoSword
                    done = true
                    return
                  })
                }
                pos[0] += step[0]
                pos[1] += step[1]
              }
            }
          }
        }
      }
    }

    if (this.chain && this.chain.sprite) {
      var sword = this.chain.sword
      var angle = game.math.angleBetween(this.x, this.y, sword.x, sword.y)
      this.chain.sprite.x = this.x
      this.chain.sprite.y = this.y
      this.chain.sprite.angle = angle * (180 / Math.PI)
      var dist = game.math.distance(this.x, this.y, sword.x, sword.y) + 5
      this.chain.sprite.width = dist
    }

    if (this.canJump()) {
      this.animations.play('idle');
      this.sword.animations.play('idle');
    } else if (this.body.velocity.y > 10) {
      this.animations.play('jump_upward');
      this.sword.animations.play('jump_upward');
    } else if (this.body.velocity.y < -10) {
      this.animations.play('jump_downward');
      this.sword.animations.play('jump_downward');
    }
    if (this.swordState === Throw.PullingSelf) {
      this.animations.play('jump_upward');
    }

    if (this.input.isLeft() && this.body.velocity.x < 6 && this.wallJumpCountdown <= 0) {
      this.body.force.x += -this.walkForce;
      // this.body.moveLeft(100)
      this.scale.x = -1;
      this.sword.scale.x = -1;
    }
    else if (this.input.isRight() && this.body.velocity.x > -6 && this.wallJumpCountdown <= 0) {
      this.body.force.x += this.walkForce;
      // this.body.moveRight(100)
      this.scale.x = 1;
      this.sword.scale.x = 1;
    } else {
      // this.body.force.x = 0
    }

    if (this.looseSword) {
      this.looseSword.tint = this.team
    }

    // Shoot
    if (!this.spawnDelay && this.input.isShooting()) {
      // Premature reel-in
      // if (this.swordState === Throw.Thrown && this.fireCountdown <= 100) {
      //   this.chain.reelIn()
      // }
      // Throw sword
      if (this.swordState === Throw.Ready && this.fireCountdown <= 0) {
        var dir = this.getAimDir()
        if (EXPERIMENTS['8-dir']) dir = this.getAimDir8()
        this.shootChain(dir[0], dir[1])
        this.fireCountdown = this.fireDelay;
      }
      // Summon sword
      if (this.swordState == Throw.NoSword && this.looseSword && (this.psychicCountdown > 0 || (this.psychicCountdown > -3000 && this.wasUsingPsychicLastFrame))) {
        var angle = game.math.angleBetween(this.x, this.y, this.looseSword.x, this.looseSword.y)
        var force = [Math.cos(angle) * -100, Math.sin(angle) * -100]
        // this.looseSword.body.force.x += force[0]
        // this.looseSword.body.force.y += force[1]
        this.looseSword.body.moveRight(force[0])
        this.looseSword.body.moveDown(force[1])
        this.looseSword.tint = 0xFFFFFF
        this.psychicCountdown -= game.time.elapsed
        this.wasUsingPsychicLastFrame = true
      }
    } else {
      this.psychicCountdown += game.time.elapsed * 4
      this.psychicCountdown = Math.min(1, this.psychicCountdown)
    }

    // Detach sword from target
    // if (game.input.keyboard.justReleased(this.input.shoot)) {
    if (!this.input.isShooting() && this.chain) {
      if (this.swordState === Throw.PullingSelf || this.swordState === Throw.PullingSword) {
        this.chain.detach()
      }
    }

    // if (game.input.keyboard.isDown(this.input.shoot)) {
    if (!this.spawnDelay && this.input.isShooting()) {
      if (this.chain && this.swordState === Throw.Locked && this.fireCountdown <= 0) {
        this.chain.reelIn()
        game.sfx.chain.play()
      }
    }
    this.fireCountdown -= game.time.elapsed;
    this.jumpCountdown -= game.time.elapsed;
    this.wallJumpCountdown -= game.time.elapsed;

    // if (game.input.keyboard.isDown(this.input.jump)) {
    if (this.input.isJumping()) {
      this.jump();
    }

    this.sword.x = this.x - this.anchor.x * this.width + this.body.velocity.x * game.time.physicsElapsed
    this.sword.y = this.y - this.anchor.y * this.height + this.body.velocity.y * game.time.physicsElapsed

    // reel sword back in
    if (this.chain && (this.swordState === Throw.PullingSelf || this.swordState === Throw.PullingSword)) {
      var sword = this.chain.sword
      if (this.swordState === Throw.PullingSelf) {
        this.pullAccum += 20
        var angle = game.math.angleBetween(this.x, this.y, sword.x, sword.y)
        var pullForce = Math.min(SWORD_PULL_SELF_SPEED, this.pullAccum)
        if (pullForce < 175) {
          pullForce = 0
        }
        this.body.moveRight(Math.cos(angle) * pullForce)
        this.body.moveDown(Math.sin(angle) * pullForce)
      } else if (this.swordState === Throw.PullingSword) {
        var angle = game.math.angleBetween(sword.x, sword.y, this.x, this.y)
        this.pullAccum += 40
        var pullForce = Math.min(SWORD_PULL_SWORD_SPEED, this.pullAccum)
        sword.body.moveRight(Math.cos(angle) * pullForce)
        sword.body.moveDown(Math.sin(angle) * pullForce)
        sword.body.rotation = angle - Math.PI
        sword.rotation = angle - Math.PI
      }
      if (game.math.distance(this.x, this.y, sword.x, sword.y) < 21) {
        game.physics.p2.removeConstraint(sword.lock)
        sword.kill()
        sword.destroy()
        this.chain.sprite.kill()
        this.chain.sprite.destroy()
        this.chain = null
        this.swordState = Throw.Ready
        game.sfx.chain.stop()
        this.fireCountdown = this.fireDelay;
      }
    }
  };

  player.getAimDir8 = function() {
    var dirX = 0
    var dirY = 0

    if (this.input.isUp()) dirY = -1
    if (this.input.isDown()) dirY = 1
    if (this.input.isLeft()) dirX = -1
    if (this.input.isRight()) dirX = 1

    if (dirX === 0 && dirY === 0) {
      dirX = this.scale.x
    }

    return [dirX, dirY]
  }

  player.getAimDir = function() {
    var dirX = this.scale.x
    var dirY = 0
    // if (game.input.keyboard.isDown(this.input.up)) {
    if (this.input.isUp()) {
      dirY = -1
      dirX = 0
    }
    // if (game.input.keyboard.isDown(this.input.down)) {
    if (this.input.isDown()) {
      dirY = 1
      dirX = 0
    }
    // if (this.input.isLeft()) {
    //   dirX = -1
    // }
    // if (this.input.isRight()) {
    //   dirX = 1
    // }

    return [dirX, dirY]
  }

  player.shootChain = function(dirX, dirY) {
    this.pullAccum = 0
    var lastSeg;
    var height = 5
    var width = 10
    var maxForce = 2000000
    var length = 15
    var state = game.state.getCurrentState()

    this.swordState = Throw.Thrown

    game.sfx.shoot.play()
    game.sfx.chain.play()
    game.state.getCurrentState().spawnOmniDust(this.x, this.y)

    this.body.velocity.x -= dirX * 100
    this.body.velocity.y -= dirY * 100

    // sword
    var sword = game.state.getCurrentState().swords.create(this.x, this.y, 'sword')
    game.physics.p2.enable(sword, false);
    sword.body.mass = 200
    sword.body.setRectangle(16, 8, 0, 0)
    sword.body.setCollisionGroup(state.chainCollisionGroup)
    sword.body.collides([state.groundCollisionGroup, state.chainCollisionGroup])
    sword.anchor.set(0, 0.5)
    sword.tint = this.team
    sword.body.allowGravity = false
    sword.body.fixedRotation = true
    sword.done = false
    // sword.body.debug = true
    sword.update = function () {
      if (!this.hitGround) {
        sword.body.moveRight(SWORD_SPEED * dirX)
        sword.body.moveDown(SWORD_SPEED * dirY - 20)

        var angle = game.math.angleBetween(this.x, this.y, player.x, player.y)
        sword.body.rotation = angle - Math.PI
        sword.rotation = angle - Math.PI
      }
    }
    sword.body.onBeginContact.add(function (body, shapeA, shapeB, equation) {
      if (!this.done && !this.hitGround && shapeB.material && shapeB.material.name === 'ground') {
        // console.log(equation)
        // var swordDir = [dirX, dirY]
        // var dot1 = p2.vec2.dot(equation[0].normalA, swordDir)
        // var dot2 = p2.vec2.dot(equation[1].normalA, swordDir)
        // console.log(dot1)
        // console.log(dot2)
        // console.dir(equation[0])
        // console.dir(equation[1])
        // if (1===1 || dot1 === 1 || dot2 === 1) {
          this.hitGround = true
          game.state.getCurrentState().spawnOmniDust(this.x, this.y)
          game.sfx.impact3.play()
          var maxForce = 2000000
          this.lock = game.physics.p2.createRevoluteConstraint(this.body, [0, 0], worldBody, [this.x - dirX*10, this.y - dirY*10], maxForce);
          this.body.allowGravity = false
          this.done = true
          player.swordState = Throw.Locked
          game.sfx.chain.stop()
        // }
      }
    }, sword)

    var chain = this.game.add.tileSprite(player.x, player.y, 8, 9, 'chain');
    chain.anchor.set(0, 0.5)
    chain.tint = player.team

    player.chain = {}
    player.chain.sprite = chain

    player.chain.sword = sword
    player.chain.reelIn = function () {
      player.swordState = Throw.PullingSelf
    }
    player.chain.detach = function () {
      if (sword.lock) {
        game.physics.p2.removeConstraint(sword.lock)
      }
      sword.hitGround = true
      sword.lock = null
      sword.body.mass = 5
      sword.body.fixedRotation = true
      sword.body.allowGravity = true
      player.swordState = Throw.PullingSword

      sword.body.collides([])
    }

    if (dirY < 0) {
      sword.body.angle = -90
      sword.angle = -90
    }
    if (dirY > 0) {
      sword.body.angle = 90
      sword.angle = 90
    }
  };

  return player
};


PlayState.prototype.update = function() {

  ticks++

  for (var i in players) {
    players[i].update()
  }

  for (var i=0; i < inputs.length; i++) {
    if (inputs[i].isShooting() && !players[i]) {
      playerJoin.call(this, i)
    }
  }

  // Slash
  // if (game.input.keyboard.justPressed(Phaser.Keyboard.C) && this.player.swordState === Throw.Ready && this.player.fireCountdown <= 0) {
  //   this.player.slash()
  //   this.player.fireCountdown = 2
  // }

  this.stars.forEachAlive(function(s) {
    s.x += s.speed;
    if (s.x > game.world.width + 10) {
      s.reset()
    }
  });
};

// no worky
// PlayState.prototype.render = function() {
//   if (players[0] && players[0].chain) game.debug.body(players[0].chain.sword)
// }

PlayState.prototype.spawnDust = function(x, y) {
  var dust = this.dust.create(x, y, 'dust');
  dust.anchor.set(0.5, 0.5);
  dust.animations.add('normal', [0, 1, 2, 3, 4], 10);
  dust.animations.play('normal', null, false, true);
  game.physics.p2.enable(dust)
  dust.body.setCollisionGroup(this.dustCollisionGroup)
  dust.body.kinematic = true
  dust.body.allowGravity = false
  setTimeout(function() { dust.destroy() }, 1000)
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

PlayState.prototype.spawnLandingDust = function(x, y, rot) {
  rot = rot || 0
  for (var i=0; i < 6; i++) {
    var dust = game.state.getCurrentState().spawnDust(x, y)
    dust.body.velocity.x = Math.cos(rot) * (i < 3 ? -1 : 1) * game.rnd.between(30, 40) + Math.cos(rot-Math.PI/2) * 20
    dust.body.velocity.y = Math.sin(rot) * (i < 3 ? -1 : 1) * game.rnd.between(30, 40) + Math.sin(rot-Math.PI/2) * 20
    dust.update = function() {
      this.body.velocity.y -= 20
      // this.body.velocity.x *= 0.99999
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

PlayState.prototype.spawnDeathDust = function(player) {
  for (var i=0; i < 20; i++) {
    var dust = game.state.getCurrentState().spawnDust(
      player.x + game.rnd.between(-5, 5),
      player.y + game.rnd.between(0, 20))
    dust.body.mass = 1
    dust.body.velocity.x = game.rnd.between(-200, 200)
    dust.body.velocity.y = -50
    // dust.body.damping = 0.999
    dust.update = function () {
      // console.log('pre', this.body.velocity.x)
      this.body.velocity.x *= 0.9
      // console.log('post', this.body.velocity.x)
      // dust.body.velocity.y *= 1.2
    }
    dust.tint = player.team
  }
}

PlayState.prototype.spawnChainSeg = function(x, y) {
  var chain = game.add.sprite(x, y, 'chain_particle')
  game.physics.p2.enable(chain, false);
  chain.body.mass = 1
  chain.body.setCircle(6)
  chain.body.angularVelocity = game.rnd.between(-5, 5)
  chain.body.velocity.y = 50
  // chain.body.debug = true
  chain.body.setMaterial(game.state.getCurrentState().chainMaterial)
  chain.body.setCollisionGroup(game.state.getCurrentState().chainCollisionGroup)
  chain.body.collides([game.state.getCurrentState().groundCollisionGroup])
  chain.anchor.set(0.5, 0.5)
  chain.body.allowGravity = true


  chain.lifetime = 5
  var fading = false
  chain.update = function () {
    this.lifetime -= game.time.physicsElapsed
    if (this.lifetime < 0.5) {
      if (!fading) {
        game.add.tween(chain).to({alpha: 0}, 500).start();
        fading = true
      }
    }
    if (this.lifetime < 0) {
      // game.state.getCurrentState().spawnOmniDust(this.x, this.y)
      this.destroy()
    }
  }

  // chain.body.onBeginContact.add(function (body, shapeA, shapeB, equation) {
  //   game.state.getCurrentState().spawnLandingDust(this.x, this.y + this.height * 0.5 - 4)
  //   this.destroy()
  // }, chain)

  return chain
}

PlayState.prototype.spawnTinyParticle = function(x, y) {
  var chain = game.add.sprite(x, y, '1x1_particle')
  game.physics.p2.enable(chain, false);
  chain.body.mass = 1
  chain.scale.set(2, 2)
  chain.body.setCircle(4)
  chain.body.setMaterial(game.state.getCurrentState().chainMaterial)
  chain.body.setCollisionGroup(game.state.getCurrentState().chainCollisionGroup)
  chain.body.collides([game.state.getCurrentState().groundCollisionGroup])
  chain.anchor.set(0.5, 0.5)
  chain.body.allowGravity = true

  chain.lifetime = 3
  var fading = false
  chain.update = function () {
    this.lifetime -= game.time.physicsElapsed
    if (this.lifetime < 0.5) {
      if (!fading) {
        game.add.tween(chain).to({alpha: 0}, 500).start();
        fading = true
      }
    }
    if (this.lifetime < 0) {
      this.destroy()
    }
  }

  return chain
}

function stepAlongLineSeg(start, end, STEP_SIZE, cb) {
  var step = [end[0] - start[0], end[1] - start[1]]
  var len = Math.sqrt(step[0]*step[0] + step[1]*step[1])
  var pos = [start[0], start[1]]
  if (len > 0) {
    var STEP_SIZE = 16
    step[0] = (step[0] / len) * STEP_SIZE
    step[1] = (step[1] / len) * STEP_SIZE
    var steps = len / STEP_SIZE
    for (var i=0; i < steps; i++) {
      var ret = cb(pos[0], pos[1])
      if (!ret) { break }
      pos[0] += step[0]
      pos[1] += step[1]
    }
  }
}

function gameFreeze(duration, cb) {
  duration = 0.01
  game.paused = true
  setTimeout(function() {
    game.paused = false
    cb()
  }, duration * 1000)
}

var w = 160 * 4;
var h = 144 * 4;
var game = new Phaser.Game(w, h, Phaser.AUTO, 'monochain');
game.state.add('play', PlayState);
game.state.start('play');

// samurai gunn: 22x16

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

var DEAD_ZONE = 0.5

function range (start, end) {
  if (end === undefined) { end = start; start = 0 }
  var elems = []
  for (var i=start; i <= end; i++) {
    elems.push(i)
  }
  return elems
}

function unhookAllInput () {
  range(4).forEach(function (i) { unhookInput(inputs[i]) })
}

function runWinnerSequence (winnerIdx) {
	var style = { font: "85px Arial Bold", fill: tints.strings[winnerIdx], align: "center" };
  var text = game.add.text(game.world.centerX, game.world.centerY, 'P'+(winnerIdx+1)+' WINS!', style);
  text.anchor.set(0.5, 0.5);
    // to: function (properties, duration, ease, autoStart, delay, repeat, yoyo) {
  game.add.tween(text.scale)
    .from({x: 0, y: 0})
    .to({x: 1, y: 1}, 1500, Phaser.Easing.Bounce.InOut)
    .start();

	var style = { font: "75px Arial Bold", fill: '#ffffff', align: "center" };
  var val = 10
  var countdown = game.add.text(game.world.centerX, game.world.centerY + 200, '', style);
  countdown.anchor.set(0.5, 0.5);
  var ix = setInterval(function () {
    val--
    countdown.text = val
    if (val === 0) {
      clearInterval(ix)
      restartWorld()
    }
  }, 700)
}

function murderPlayer (victim, killer) {
  if (victim.swordState === Throw.Dead) return

  // pit death
  if (!killer) {
    if (victim.lastHit !== null && victim.lastHit !== undefined) {
      // someone broke their chain before they fell
      scores[players.indexOf(victim.lastHit)].inc()
      victim.lastHit = null
    } else {
      // punish self-killing players
      scores[players.indexOf(victim)].dec()
    }
  }

  victim.swordState = Throw.Dead

  game.sfx.death.play()
  game.sfx.chain.stop() // just in case

  if (victim.looseSword) {
    var sword = victim.looseSword
    victim.looseSword = null
    var tween = game.add.tween(sword).to({alpha: 0}, 1000)
    tween.onComplete.add(function() {
      this.destroy()
    }, sword)
    tween.start()
  }
  if (killer) killer.chain.detach()
  if (victim.chain) {
    if (victim.chain.sword.lock) {
      game.physics.p2.removeConstraint(victim.chain.sword.lock)
    }
    victim.chain.sprite.kill()
    victim.chain.sprite.destroy()
    victim.chain.sword.kill()
    victim.chain.sword.destroy()
    victim.chain = null
  }
  game.state.getCurrentState().spawnDeathDust(victim)
  for (var i=0; i < 20; i++) {
    var seg = game.state.getCurrentState().spawnTinyParticle(victim.x, victim.y)
    seg.tint = victim.team
    // seg.alpha = 0.6
    var rot = Math.random() * Math.PI * 2
    var force = Math.random() * 800
    var secondaryRot = killer ? killer.chain.sword.rotation : Math.Pi/2
    seg.body.velocity.x += Math.cos(rot) * force*0.3 + Math.cos(secondaryRot) * force
    seg.body.velocity.y += Math.sin(rot) * force*0.3 + Math.sin(secondaryRot) * force
  }
  victim.visible = false
  victim.body.x = -10000
  victim.body.y = -10000
  victim.x = -10000
  victim.y = -10000

  game.time.events.add(1500, function() {
    var spawns = game.state.getCurrentState().spawns
    var spawn = spawns[Math.floor(Math.random() * spawns.length)]
    this.body.x = spawn.x
    this.body.y = spawn.y
    this.x = spawn.x
    this.y = spawn.y
    this.fireCountdown = 500
    this.swordState = Throw.Ready
    this.body.velocity.x = 0
    this.body.velocity.y = 0
    this.visible = true
    this.invincibilityCountdown = 300
    game.state.getCurrentState().spawnDeathDust(this)
    game.sfx.spawn.play()
  }, victim);
}

function restartWorld () {
  currentLevel = (currentLevel + 1) % 4
  game.state.restart(true)
  // game.state.add('play', PlayState);
  // game.state.start('play');
}

function unhookInput (input) {
  if (!input) return
  input.isJumping = function () { return false }
  input.isShooting = function () { return false }
  input.isLeft = function () { return false }
  input.isRight = function () { return false }
  input.isUp = function () { return false }
  input.isDown = function () { return false }
}

function injectInput(input, generate) {
  input.isJumping = function() {
    if (generate) { return Math.random() < 0.1 }
    return game.input.keyboard.isDown(this.jump)
        || (this.gamepad && this.gamepad.connected
        && this.gamepad._buttons[0].isDown);
  };
  input.isShooting = function() {
    if (generate) { return Math.random() < 0.01 }
    return game.input.keyboard.isDown(this.shoot)
        || (this.gamepad && this.gamepad.connected
        && this.gamepad._buttons[1].isDown);
  };
  input.isLeft = function() {
    if (generate) { return Math.random() < 0.1 }
    return game.input.keyboard.isDown(this.left) || (this.gamepad && this.gamepad.connected && this.gamepad._axes[0] < -DEAD_ZONE)
  }
  input.isRight = function() {
    if (generate) { return Math.random() < 0.1 }
    return game.input.keyboard.isDown(this.right) || (this.gamepad && this.gamepad.connected && this.gamepad._axes[0] > DEAD_ZONE)
  }
  input.isUp = function() {
    if (generate) { return Math.random() < 0.1 }
    return game.input.keyboard.isDown(this.up) || (this.gamepad && this.gamepad.connected && this.gamepad._axes[1] < -DEAD_ZONE)
  }
  input.isDown = function() {
    if (generate) { return Math.random() < 0.1 }
    return game.input.keyboard.isDown(this.down) || (this.gamepad && this.gamepad.connected && this.gamepad._axes[1] > DEAD_ZONE)
  }
}
