var HEIGHT = 400, WIDTH = 700;

var socket = io.connect("http://76.28.150.193:8888");

function Player(game) {
    this.width = 20;
    this.height = 70;
    this.x = 0;
    this.y = (HEIGHT / 2) - this.height / 2;
    this.game = game;
    this.ctx = game.ctx;
    this.score = 0;
    this.speed = 6;
}

Player.prototype.draw = function () {
    this.ctx.fillStyle = "White";
    this.ctx.strokeStyle = "White";
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
    this.ctx.font = "40pt Calibri";
    this.ctx.fillText(this.score, WIDTH / 2 - 60, 35);
};

Player.prototype.update = function () {
   if(this.game.w){
       if(this.y > 0){
           this.y -= this.speed;
       }
   } else if(this.game.s){
       if((this.y+this.height)<HEIGHT) {
           this.y += this.speed;
       }
   } else {
       this.y += 0;
   }

};

function AI(game){
    this.width = 20;
    this.height = 70;
    this.x = WIDTH - this.width;
    this.y = (HEIGHT / 2) - this.height / 2;
    this.game = game;
    this.ctx = game.ctx;
    this.score = 0;
    this.speed = 8;
}

AI.prototype.draw = function () {
    this.ctx.fillStyle = "White";
    this.ctx.strokeStyle = "White";
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
    this.ctx.font = "40pt Calibri";
    this.ctx.fillText(this.score, WIDTH / 2 + 40, 35);
};

AI.prototype.update = function() {
    var ball = this.game.entities[2];
    if(ball.y < this.y && ball.x > (WIDTH / 2)) {
        this.y -= this.speed;
    }
    if(ball.y > this.y && ball.x > (WIDTH / 2) && this.y < HEIGHT - this.height) {
        this.y += this.speed;
    }
    if(!ball.right) {
        if(this.y > (HEIGHT / 2) - this.height / 2) {
            if(this.y > 0)
                this.y -= this.speed;
        }
        if(this.y < (HEIGHT / 2) - this.height / 2) {
            if(this.y < HEIGHT)
                this.y += this.speed;
        }
    } else {
        this.y += 0;
    }

};

function Ball(game){
    this.radius = 10;
    this.x = WIDTH / 2;
    this.y = HEIGHT / 2;
    this.game = game;
    this.ctx = game.ctx;
    this.velY = 0;
    this.velX = -10;
    this.speed = 10;
    this.right = false;
}

Ball.prototype.draw = function() {
    this.ctx.beginPath();
    this.ctx.arc(this.x,this.y,this.radius,0,2*Math.PI);
    this.ctx.fillStyle = "White";
    this.ctx.fill();
    this.ctx.strokeStyle = "White";
    this.ctx.stroke();
};

Ball.prototype.update = function() {
    var player = this.game.entities[0];
    var ai = this.game.entities[1];
    this.y += this.velY;
    this.x += this.velX;
    if((this.y+this.radius) > HEIGHT) {
        this.velY *= -1;
    }
    if(this.y < 0) {
        this.velY *= -1;
    }
    if((this.x > WIDTH - ai.width) && (this.y + this.radius > ai.y && this.y < ai.y + ai.height)){
        var phi = GetPhi(this.y,this.radius,ai.y,ai.height);
        this.velX = -1*this.speed * Math.cos(phi);
        this.velY = this.speed * Math.sin(phi);
        this.right = false;
    }
    if((this.x < player.width) && (this.y + this.radius > player.y && this.y < player.y + player.height)) {
        var phi = GetPhi(this.y,this.radius,player.y,player.height);
        this.velX = this.speed * Math.cos(phi);
        this.velY = this.speed * Math.sin(phi);
        this.right = true;
    }

    if(this.x < -this.radius || this.x > WIDTH){
        if(this.right) {
            player.score++;
        } else {
            ai.score++;
        }
        reset(this);
    }

};

function GetPhi(ballY, ballR, y, height) {
    var n = (ballY + ballR - y)/ (height + ballR);
    return 0.25 * 3.14 *(2*n -1);
}

function reset(ent){
    ent.right = !ent.right;
    ent.velX *= -1;
    ent.x = WIDTH / 2;
    ent.y = HEIGHT / 2;
}

(function(){

    socket.on("load", function (data) {
        console.log("Loading data");
        console.log(data);

        gameEngine.startLoop();

        var player = gameEngine.entities[0];
        var ai = gameEngine.entities[1];
        var ball = gameEngine.entities[2];

        player.y = data.data.playerPos;
        player.score = data.data.playerScore;
        player.speed = data.data.playerSpeed;

        ai.y = data.data.aiPos;
        ai.score = data.data.aiScore;
        ai.speed = data.data.aiSpeed;

        ball.right = data.data.ballDir;
        ball.x = data.data.ballX;
        ball.y = data.data.ballY;
        ball.speed = data.data.ballSpeed;

    });

    socket.on("reconnect", function () {
        console.log("Socket reconnected.")
    });

    var saveBtn = document.getElementById("SaveBtn");
    var loadBtn = document.getElementById("LoadBtn");
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");

    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
    gameEngine.start();

    gameEngine.addEntity(new Player(gameEngine));
    gameEngine.addEntity(new AI(gameEngine));
    gameEngine.addEntity(new Ball(gameEngine));

    saveBtn.onclick = function() {
        var player = gameEngine.entities[0];
        var ai = gameEngine.entities[1];
        var ball = gameEngine.entities[2];

        gameEngine.stop();

        socket.emit("save",
            { studentname: "Long Nguyen",
                statename: "GameState",
                data: {
                    playerPos: player.y,
                    playerScore: player.score,
                    playerSpeed: player.speed,
                    aiPos: ai.y,
                    aiScore: ai.score,
                    aiSpeed: ai.speed,
                    ballX: ball.x,
                    ballY: ball.y,
                    ballDir: ball.right,
                    ballSpeed: ball.speed
                }});

        console.log("Game state is saved!!!");

    };

    loadBtn.onclick = function() {
        socket.emit("load", { studentname: "Long Nguyen", statename: "GameState" });
    }
})();
