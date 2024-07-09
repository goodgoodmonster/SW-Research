// HTML 요소들을 가져오기
const startGameButton = document.getElementById('startGame');
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');

// 게임 변수를 초기화
let keysDown = {};
let fighter = { x: 50, y: canvas.height / 2, speed: 5 };
let lastUpdateTime = 0;
let acDelta = 0;
let msPerFrame = 1000;
let bool_bg = false;
let bool_fighter = false;
let bool_laser = false;
let bool_asteroid = false;
let bool_explode = false;
let lasers = [];
let laserTotal = 10; 
let speed = 0;
let asteroid = {};
let randScale;
let ang = 0;
let arrScale = [0.4, 0.6, 0.8, 1];
let hitexplosion = {};
let bool_hitexplosion = false;
let spriteCount = 1;
let bool_fighterexplosion = false;
let score = 0;
let lives = 2;
let isGameOver = false;

const bgImage = new Image();
bgImage.src = "images/space.png";
const fighterImage = new Image();
fighterImage.src = "images/fighter.png";
const laserImage = new Image();
laserImage.src = "images/laser.png";
const asteroidImage = new Image();
asteroidImage.src = "images/asteroid.png";
const explodeImage = new Image();
explodeImage.src = "images/explode.png";

const laserSound = new Audio('sounds/Laser.wav');
const explodeSound = new Audio('sounds/explosion.wav');
const hitexplodeSound = new Audio('sounds/explosion-02.wav');
hitexplodeSound.volume = 0.5;
const gameOverSound = new Audio("sounds/game_over.wav");
gameOverSound.loop = true;
gameOverSound.volume = .25;
gameOverSound.load();

bgImage.onload = () => bool_bg = true;
fighterImage.onload = () => bool_fighter = true;
laserImage.onload = () => bool_laser = true;
asteroidImage.onload = () => bool_asteroid = true;
explodeImage.onload = () => bool_explode = true;

startGameButton.addEventListener('click', () => {
    canvas.style.display = 'block';
    startGameButton.style.display = 'none';
    reset();
    main();
});

// 레이저 사운드를 플레이
function soundPlay() {
    laserSound.volume = 0.12;
    laserSound.load();
    laserSound.play();
}

// 폭발 이미지를 그린다.
function drawExplode() {
    ctx.drawImage(explodeImage,
                    spriteCount * 39, 0,
                    39, 40,
                    hitexplosion.x, hitexplosion.y,
                    39 * (1 + randScale), 40 * (1 + randScale));
    spriteCount++;
    if (spriteCount > 13) {
        spriteCount = 1;
        bool_hitexplosion = false;
    }
}

// 레이저를 그린다.
function drawLaser() {
    if (lasers.length) {
        for (var i = 0; i < lasers.length; i++) {
          ctx.drawImage(laserImage, lasers[i][0], lasers[i][1]);
        }
    }
}

// 레이저를 움직인다.
function moveLaser() {
    for (var i = 0; i < lasers.length; i++) {
        if (lasers[i][0] > 0) {
            lasers[i][0] += 20;
        }
        
        if (lasers[i][0] > 600) {
            lasers.splice(i, 1);
        }
    }
}

// 배경을 그린다.
var Background = function () {
    this.x = 0, this.y = 0;

    this.render = function() {
        ctx.drawImage(bgImage, this.x--, 0);
        
        if (this.x <= -600) {
            this.x = 0;
        }
    };
};

// 운석의 크기를 배열에서 램덤으로 뽑아 오기 위해서 만들었다.
function shuffle(arr) {
    var rand = Math.floor((Math.random() * arr.length));
    return arr[rand];
}

// 운석의 초기값
var reset = function () {
    speed = Math.floor(Math.random() * 5) + 5;
    asteroid.x = canvas.width;
    asteroid.y = Math.floor(Math.random() * 350);
    
    if (asteroid.y < 40) {
        asteroid.y = 40;
    }
    
    if (asteroid.y > 360) {
        asteroid.y = 360;
    }
    
    randScale = shuffle(arrScale);
};

// 운석을 그린다.
function moveAstroid () {
    var w = asteroidImage.width * randScale; 
    var h = asteroidImage.height * randScale;
    var coordX = (asteroidImage.width / 2) * randScale;
    var coordY = (asteroidImage.height / 2) * randScale;
    
    ctx.save();
    ctx.translate(asteroid.x + coordX, asteroid.y + coordY);
    ctx.rotate(Math.PI / 180 * (ang += 5));
    ctx.translate(-asteroid.x - coordX, -asteroid.y - coordY);
    ctx.drawImage(asteroidImage, asteroid.x, asteroid.y, w, h);
    ctx.restore();

    if (asteroid.x > 0) {
        asteroid.x -= speed;
    } else {
        reset();
    }
}

// 배경 인스턴스를 만든다.
var background = new Background();

function fighterExplode() {
    ctx.drawImage(explodeImage, 
                    spriteCount * 39, 0, 
                    39, 40,
                    fighter.x, fighter.y,
                    39, 40);
    spriteCount++;
    
    if (spriteCount > 13) {
        spriteCount = 1;
        bool_fighterexplosion = false;
    }
}

// 콜리젼을 체크한다.
function isCollide(fighter, asteroid) {
    if (fighter.x < asteroid.x + 40 * (1 + randScale) && 
        fighter.x + fighterImage.width > asteroid.x &&
        fighter.y < asteroid.y + 40 * (1 + randScale) &&
        fighterImage.height + fighter.y > asteroid.y) {
        return true;
    }
}

// 콜리젼을 체크하여 true를 리턴하면 폭발 사운드와 이미지를 처리한다.
function checkCollision() {
    if (isCollide(fighter, asteroid)) {
        bool_fighterexplosion = true;
        explodeSound.load();
        explodeSound.play();
        lives--;
        livesDisplay.innerText = lives;
        reset();
        
        if (lives === 0) {
            gameOver();
        }
    }
}

// 레이저와 운석의 충돌 체크
function hitTest() {
    for (var i = 0; i < lasers.length; i++) {
        var laserXright = lasers[i][0] + laserImage.width;
        var laserXleft = lasers[i][0];
        var laserY = lasers[i][1];
        var w = (asteroidImage.width / 2) * (1 + randScale);
        var h = (asteroidImage.height / 2) * (1 + randScale);
        var cx = asteroid.x + w;
        var cy = asteroid.y + h;
        
        if (laserXright > asteroid.x && 
            laserXleft < cx + w && 
            laserY > asteroid.y && 
            laserY < cy + h) {
            lasers.splice(i, 1);
            bool_hitexplosion = true;
            hitexplosion.x = asteroid.x;
            hitexplosion.y = asteroid.y;
            score++;
            scoreDisplay.innerText = score;
            hitexplodeSound.load();
            hitexplodeSound.play();
            reset();
        }
    }
}

// 게임 오버를 처리한다.
function gameOver() {
    isGameOver = true;
    gameOverSound.play();
    ctx.font = "40px Arial";
    ctx.fillText("게임 오버", canvas.width / 2 - 100, canvas.height / 2);
    ctx.fillText("스코어: " + score, canvas.width / 2 - 80, canvas.height / 2 + 50);
}

// 키 입력 이벤트 처리
addEventListener("keydown", function (e) {
    keysDown[e.key] = true;
});

addEventListener("keyup", function (e) {
    delete keysDown[e.key];
});

function moveFighter () {
    if ("w" in keysDown) { 
        fighter.y -= fighter.speed;
        
        if (fighter.y < 15) {
            fighter.y = 15;
        }
    }
    if ("s" in keysDown) { 
        fighter.y += fighter.speed;
        
        if (fighter.y >= (canvas.height - fighterImage.height)) {
            fighter.y = (canvas.height - fighterImage.height);
        }
    }
    if ("a" in keysDown) { 
        fighter.x -= fighter.speed;
        
        if (fighter.x <= 0) {
            fighter.x = 0;
        }
    }
    if ("d" in keysDown) { 
        fighter.x += fighter.speed;
        
        if (fighter.x >= (canvas.width - fighterImage.width)) {
            fighter.x = (canvas.width - fighterImage.width);
        }
    }
}

function drawFighter () {
    ctx.drawImage(fighterImage, fighter.x, fighter.y);
}

// 레이저 발사
function fireLaser() {
    if (" " in keysDown) {
        if (lasers.length <= laserTotal) {
            lasers.push([fighter.x + 100, fighter.y + 28]);
        }
        soundPlay();
    }
}

function main() {
    if (!isGameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        background.render();
        drawFighter();
        moveFighter();
        moveLaser();
        drawLaser();
        fireLaser();
        moveAstroid();
        checkCollision();
        hitTest();
        
        if (bool_fighterexplosion) {
            fighterExplode();
        }

        if (bool_hitexplosion) {
            drawExplode();
        }

        requestAnimationFrame(main);
    }
}
