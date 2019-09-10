// Rewrite the good old bricks game
(function main () {
    // some constants
    mon_jeu.life    = 10;
    mon_jeu.blessed = false;
    mon_jeu.niveau  = 0;
    mon_jeu.perdu   = false;    // On n'est pas encore mort.
    
    // module aliases
    var Engine     = Matter.Engine,
        Render     = Matter.Render,
        World      = Matter.World,
        Events     = Matter.Events,
        Composites = Matter.Composites,
        Body       = Matter.Body,
        Bodies     = Matter.Bodies;

    // créer un moteur
    var engine     = Engine.create(),
        monde      = engine.world;

    mon_jeu.monde  = monde;
    mon_jeu.engine = engine;

    // créer un renderer
    var render = Render.create({
        element: document.body,
        engine : engine,
        options: {
            width : 800,
            height: 750,
            wireframes: false,
            background: '#222'
        },
    });
        
    // Éxecuter le moteur.
    Engine.run(engine);

    // Éxecuter the renderer.
    Render.run(render);

    // Créer les niveaux du jeu.
    mon_jeu.niveaux();
    mon_jeu.interval_de_niveaux = setInterval(() => { mon_jeu.niveaux(); }, 1000);
    
    // Créer le joueur, et d'autres bornes.
    var player = Bodies.rectangle(350,  50,  25, 25, {
        render: {
            fillStyle: 'blue',
            strokeStyle: 'blue',
            sprite: {
                texture: 'images/character-color.png',
                 xScale: 0.15,
                 yScale: 0.15,
            },
        },
        collisionFilter: {
            category: 0x0001,
        },
        inertia: Infinity,
    });
    
    player.friction       = 0;
    player.frictionStatic = 0;
    
    mon_jeu.player = player;

    var ground = Bodies.rectangle(400, 760, 810, 60, { isStatic: true,
                                                       render: {
                                                           fillStyle: '#f23',
                                                           strokeStyle: '#f23',
                                                       },
                                                       collisionFilter: {
                                                           category: 0x0001,
                                                       },});
    var ceil   = Bodies.rectangle(400, -30, 810, 120, { isStatic: true,
                                                       render: {
                                                           fillStyle: '#1ff',
                                                           strokeStyle: '#1ff',
                                                       },
                                                       collisionFilter: {
                                                           category: 0x0001,
                                                       },});

    // collision filtering
    var independentCategory = 0x0002;
    
    // create life indiators
    maj_la_vie();
    
    // Normal steps should have no frictions.
    // test.friction = 0;

    // add all of the bodies to the world
    World.add(monde, [player, ground, ceil]);

    // test goes up
    
    // Events.on(engine, 'afterUpdate', (evenement) => {
    //     Body.applyForce(test, test.position,
    //                     {x: 0,
    //                      y: -1.2 * monde.gravity.y * monde.gravity.scale * test.mass});
    //     // test.position.y -= 0.3;
    // });

    // Les bornes
    Events.on(engine, 'beforeUpdate', (evenement) => {
        if (player.position.x <= 4) {
            Body.setVelocity(player, {
                x: -1 * player.velocity.x,
                y: player.velocity.y,
            });
        }
        if (player.position.x >= (800 - 4)) {
            Body.setVelocity(player, {
                x: -1 * player.velocity.x,
                y: player.velocity.y,
            });
        }
    });

    // Events.on(engine, 'afterRender', (evenement) => {
    //     // Indiquer le niveaux maintenant
    //     nombre_de_niveaux();
    // });
    
    Events.on(engine, 'collisionActive', (evenement) => {
        var a_blesser = false,
            collide   = [];
        for (var i = 0; i < evenement.pairs.length; i++) {
            var pi = evenement.pairs[i];
            if (pi.bodyA.id == player.id) {
                collide.push(pi.bodyB);
            }
            if (pi.bodyB.id == player.id) {
                collide.push(pi.bodyA);
            }
            if ((pi.bodyA.id == ground.id && pi.bodyB.id == player.id) ||
                (pi.bodyB.id == ground.id && pi.bodyA.id == player.id)) {
                perdu();
                break;
            }
            if ((pi.bodyA.id == ceil.id && pi.bodyB.id == player.id) ||
                (pi.bodyB.id == ceil.id && pi.bodyA.id == player.id)) {
                a_blesser = true;
                // Body.setVelocity(player, {x: player.velocity.x, y: 0});
                // player.position.y += 2;
                break;
            }
        }
        
        if (a_blesser) {
            blesser();
            for (var i = 0; i < collide.length; i++) {
                var coli = collide[i];
                if (coli.id !== ceil.id) {
                    World.remove(monde, coli);
                }
            }
        }

    });

    document.body.addEventListener('keydown', (event) => {
        switch (event.key) {
        case 'ArrowRight':
            Body.setVelocity(player, {x: 0, y: player.velocity.y});
            player.position.x += 3;
            break;
        case 'ArrowLeft':
            Body.setVelocity(player, {x: 0, y: player.velocity.y});
            player.position.x -= 3;
            break;
        default:
            break;
        }
    });

    document.body.addEventListener('keyup', (event) => {
        switch (event.key) {
        case 'ArrowRight':
            Body.setVelocity(player, {x: 0, y: player.velocity.y});
            break;
        case 'ArrowLeft':
            Body.setVelocity(player, {x: 0, y: player.velocity.y});
            break;
        default:
            break;
        }
    });

    // La fonction qu'éxecute quand on a perdu.
    function perdu () {
        mon_jeu.perdu = true;
        mon_jeu.life  = 0;
        maj_la_vie();
        World.clear(monde);
        Engine.clear(engine);
        Render.stop(render);
        var can       = document.querySelector('canvas');
        var con       = can.getContext('2d');
        con.font      = '40px sans-serif';
        con.fillStyle = 'red';
        con.textAlign = 'center';
        con.fillText('Tu es mort!', 400, 250);
        con.fillStyle = '#fa4';
        con.fillText('You are dead!', 400, 350);
        // Nettoyer l'interval
        clearInterval(mon_jeu.interval_de_niveaux);
    }
    
    // La fonction pour mettre à jour la vie.
    function maj_la_vie () {
        if (mon_jeu.lifeBricks) {
            World.remove(monde, mon_jeu.lifeBricks);
        }
        mon_jeu.lifeBricks = Composites.stack(20, 50, mon_jeu.life, 1, 5, 0, function (x, y) {
            return Bodies.rectangle(x, y, 20, 10, {
                collisionFilter: {
                    mask: 0x0002,
                },
                render: {
                    fillStyle: 'red',
                    strokeStyle: 'red',
                },
                isStatic: true,
            });
        });
        World.add(monde, [mon_jeu.lifeBricks]);
    }
    
    // La fonction qu'éxecute quand on est blessé.
    function blesser () {
        if (mon_jeu.blessed) {
            return;
        }
        mon_jeu.blessed = true;
        mon_jeu.life   -= 1;
        maj_la_vie();
        setInterval(() => {mon_jeu.blessed = false;}, 500);
    }
    
    mon_jeu.blesser = blesser;

    // La fonction qu'éxecute quand on touche un escalier normal.
    function guerir () {
        mon_jeu.life += (mon_jeu.life < 10) ? 1 : 0;
        maj_la_vie();
    }
    
    mon_jeu.guerir = guerir;

})();
