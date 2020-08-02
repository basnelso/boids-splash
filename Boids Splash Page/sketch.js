let boids = [];
let explosions = [50];

let menuTextSize = 30;
let slowDownCounter = 0;
let reducedMode = false;
let onMobile = false;

// Animation variables
let fade = 255;
let nameSize = 30;
let namePos = null;
let nameWidth = null;
let userSize = 1;
let buttonX = null;
let buttonY = null;
let scoreSize = 0;
let filtered = false;

// GAMESTATES:
// 0 => button not pushed, 1 => button pushed and in process of fading and moving,
// 2 => Name in position and shrinking. 3 => done shrinking, boid is growing
// 4 => game ready to play. 5 => Game ended 
let gameState = 0;

// Game variables
let user = null;
let frate = 60;
let gameTimer = 4*frate;
let score = 0;
let img = null;

// Database variables
let avgData = null;
const firebaseConfig = {
  // Commented out for security.
};

function setup() {
  firebase.initializeApp(firebaseConfig);
  createCanvas(windowWidth, windowHeight);
  frameRate(frate);
  
  // Determine if on mobile
  if (windowWidth < 400) {
    onMobile = true;
  }
  
  // Set start button coords
  buttonY = windowHeight / 2 + menuTextSize * 3;
  buttonX = windowWidth/2;
  
  createFlock();
}

function createFlock() {
  // Add an initial set of boids into the system
  let numBoids = 100;
  if (onMobile) {
    numBoids = 100;
  }
  for (let i = 0; i < numBoids; i++) {
    let gotCoords = false;
    while (!gotCoords) {
      xpos = random(width);
      ypos = random(height);
      if (!(xpos > buttonX - (width/2) - this.r && xpos < buttonX + (width/2) + this.r &&
        ypos > buttonY - (height/2) - this.r && ypos < buttonY + (height/2) + this.r)) {
        gotCoords = true;
      }
    }
    boids[i] = new Boid(random(width), random(height), false);
  }
  user = new Boid(windowWidth/2,windowHeight/2, true);
}

function draw() {
  clear()
  background(255, 0);
  setCursor();
  
  if (boids.length == 0) {
    gameState = 5;
  }
  
  if (reducedMode) {
    removeBoids();
  }
  
  // Run boids if the game hasn't ended.
  if (gameState < 5) {
    // Eat the nearest boid if its close enough
    let eatDist = 20;
    let closeIndex = user.closestBoid(boids);
    if (gameState == 4 && p5.Vector.dist(boids[closeIndex].pos, user.pos) < eatDist) {
      boids[closeIndex].eaten = true;
      if (boids[closeIndex].explosion == null) {
        score += 1;
      }
    }

    // Run all the boids (need to go in reverse because we potentially are removing from the array.)
    for (let i = boids.length - 1; i >= 0; i--) {
      boids[i].run(boids);
      if (boids[i].exploded) {
        boids.splice(i,1);
      }
    }
    // Run user boid.
    user.run(boids); 
  }
  

  // Control what the sketch does based on what gameState its in.
  if (gameState == 0) {
    drawMessage(fade);
    drawButton(fade);
  } else if (gameState == 1) {
    drawMessage(fade);
    drawButton(fade);
    fade -= 3;

    moveName();

    if (fade <= 0) {
      gameState++;
    }
  } else if (gameState == 2) {
    shrinkName();
  } else if (gameState == 3) {
    drawUserBoid();
  } else if (gameState == 4) {
    // Playing game in gamestate 4
    drawUserBoid();
    detectKeys();
    updateGame();
    displayGame();
  } else if (gameState == 5) {
    createEndingImage();
    drawGameEnd();
  }
  
  drawBorder();
  
  if (!onMobile) {
    drawReducedModeButton();
  }
}

function removeBoids() {
  for (let i = boids.length - 1; i >= 50; i--) {
    boids.splice(i,1);
  }
}

function drawMessage(alpha) {
  // Draw text in middle of screen
  textSize(menuTextSize);
  noStroke();
  fill(255, alpha);
  textAlign(CENTER);
  text("Hey!", windowWidth / 2, windowHeight / 2 - menuTextSize);

  let pos = windowWidth / 2 - 123;

  textAlign(LEFT);
  let first = "I'm ";
  text(first, pos, windowHeight / 2);
  pos += textWidth(first);

  if (gameState == 0) {
    let name = "Brady Snelson";
    fill(120, 304, 355);
    text(name, pos, windowHeight / 2);
    namePos = pos
    nameWidth = textWidth(name);
    pos += textWidth(name);
  }

  let last = ",";
  fill(255, alpha);
  text(last, pos, windowHeight / 2);

  textAlign(CENTER);
  text("Software Engineer", windowWidth / 2, windowHeight / 2 + menuTextSize);
}

function drawButton(alpha) {
  // Draw button in top left corner
  if (!onMobile) {
    rectMode(CENTER);
    if (mouseX < buttonX + 175 / 2 && mouseX > buttonX - 175 / 2 && mouseY < buttonY + 20 && mouseY > buttonY - 20) {
      fill(171, 224, 242, alpha);
    } else {
      fill(255, alpha);
    }
    rect(buttonX, buttonY, 175, 40);
  }

  textSize(18);
  textAlign(CENTER, CENTER);
  let t = null;

  if (onMobile) {
    fill(255);
    t = "Open on desktop to play!";
  } else {
    fill(0, 0, 0, 255);
    t = "Capture Some Boids";
  }
  text(t, buttonX, buttonY);
}

// Persistant border around the outside.
function drawBorder() {
  // Create window border
  rectMode(CORNER);
  noFill();
  stroke(255);
  strokeWeight(windowWidth / 100);
  rect(0, 0, windowWidth, windowHeight);
}

// Animation to shift name to the center once the start button has been hit.
function moveName() {
  let name = "Brady Snelson";
  fill(120, 304, 355);

  textSize(nameSize);
  noStroke();
  textAlign(LEFT);
  text(name, namePos, windowHeight / 2);

  if (namePos > windowWidth / 2 - nameWidth / 2) {
    namePos -= 0.3;
  }
}

// Once name is in position and text is done fading, shrink it.
function shrinkName() {
  let name = "Brady Snelson";
  fill(120, 304, 355);

  textAlign(CENTER);
  textSize(nameSize);
  noStroke();
  text(name, windowWidth / 2, windowHeight / 2);
  if (nameSize > 1) {
    nameSize -= 0.25;
  } else {
    gameState++;
  }
}

function drawReducedModeButton() {
  fill(255);
  textSize(10);
  noStroke();
  if (reducedMode) {
    textAlign(LEFT, CENTER);
    text("(Running in reduced mode.)", 25, 50);
  } else {
    if (!onMobile && mouseX < 50 + 25 && mouseX > 50 - 25 && mouseY < 50 + 25 && mouseY > 50 -25) {
      fill(171, 224, 242);
    } else {
      fill(255);
    }
    circle(50,50,50);
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, 255);
    text("Slow?\nClick Here", 50, 50);
  }
}

function updateGame() {
  if (gameTimer > 0) {
    gameTimer--;
  } else {
    gameState++;
  }
}

function displayGame() {
  textSize(24);
  noStroke();
  fill(120, 304, 355);
  textAlign(CENTER);
  let time = gameTimer/frate;
  if (time >= 10) {
    time = str(time).substring(0,2)
  } else {
    time = str(time).substring(0,3)
  }
  text(`Time left: ${time}`, windowWidth/2, windowHeight/10);
  text(`Score: ${score}`, windowWidth/2, windowHeight/10 + 30);
}

function drawUserBoid() {
  fill(120, 304, 355);
  noStroke();
  push();
  translate(user.pos.x, user.pos.y)
  rotate(user.velocity.heading());
  beginShape();
  vertex(2 * userSize, 0);
  vertex(-1 * userSize, 1 * userSize);
  vertex(-1 * userSize, -1 * userSize);
  endShape(CLOSE);
  pop();

  if (userSize > 10) {
    gameState = 4;
  } else {
    userSize += 0.5;
  }
}

function createEndingImage() {
  if (img == null) {
    img = createGraphics(windowWidth, windowHeight);
    let boidSize = 5;
    img.fill(255);
    img.noStroke();

    // Render each boid
    for (let i = 0; i < boids.length; i++) {
      let b = boids[i];
      img.push();
      img.translate(b.pos.x, b.pos.y);
      img.rotate(b.velocity.heading());
      img.beginShape();
      img.vertex(2*boidSize, 0);
      img.vertex(-boidSize, boidSize);
      img.vertex(-boidSize, -boidSize);
      img.endShape(CLOSE);
      img.pop();
    }

    // Render user controlled boid
    img.fill(120, 304, 355);
    img.push();
    img.translate(user.pos.x, user.pos.y);
    img.rotate(user.velocity.heading());
    img.beginShape();
    img.vertex(2 * userSize, 0);
    img.vertex(-1 * userSize, 1 * userSize);
    img.vertex(-1 * userSize, -1 * userSize);
    img.endShape(CLOSE);
    img.pop();
  }
}

async function drawGameEnd() {
  // Draw graphics
  if (!filtered) {
    img.filter(BLUR, 3);
    filtered = true;
  }
  
  image(img, 0, 0);

  if (avgData == null) {  
    await getAverage();
    calculateAverage();
  }

  
  // Draw score
  if (scoreSize < 64) {
    scoreSize += 1;
  }
  noStroke();
  fill(120, 304, 355);
  textSize(scoreSize);
  text(`Your Score: ${score}`, windowWidth/2, 100);
  text(`Average Score: ${str(avgData[0]).substring(0,5)}`, windowWidth/2, 175);
  
  // Draw restart button
  let x = windowWidth/2;
  let y = windowHeight/2;
  rectMode(CENTER);
  if (mouseX < x + 175 / 2 && mouseX > x - 175 / 2 && mouseY < y + 20 && mouseY > y - 20) {
    fill(171, 224, 242);
  } else {
    fill(255);
  }
  rect(x, y, 175, 40);

  textSize(18);
  textAlign(CENTER, CENTER);
  let t = null;

  fill(0, 0, 0, 255);
  text("Play Again!", x, y);
}


function getAverage() {
  return new Promise(function(resolve,reject) {
    avgData = 1
    let database = firebase.database();
    let ref = database.ref('stats');
    ref.once('value').then(function(snapshot) {
      let data = snapshot.val();
      let key = Object.keys(data)[0];
      let avg = data[key].average;
      let count = data[key].count;

      avgData = [avg, count, key];
      resolve(true);
    });
  });
}

function calculateAverage() {
  let database = firebase.database();
  let id = avgData[2];
  let ref = database.ref(`stats/${avgData[2]}`);
  
  // Calculate new average
  let oldAvg = avgData[0];
  let count = avgData[1] + 1;
  let newAvg = ((oldAvg * (count - 1)) + score)/count;
  
  // Update database
  ref.update({
    average: newAvg,
    count: count,
  });
  
}


///////////////////////
// User input functions
//////////////////////

function mousePressed() {
  if (!onMobile && gameState == 0 && mouseX < buttonX + 175 / 2 && mouseX > buttonX - 175 / 2 && mouseY < buttonY + 20 && mouseY > buttonY - 20) {
    gameState++;
  }
  
  if (!onMobile && mouseX < 50 + 25 && mouseX > 50 - 25 && mouseY < 50 + 25 && mouseY > 50 -25) {
    reducedMode = true;
  }
  
  let x = windowWidth/2;
  let y = windowHeight/2;
  if (gameState == 5 && mouseX < x + 175 / 2 && mouseX > x - 175 / 2 && mouseY < y + 20 && mouseY > y - 20) {
    restartGame();
  }
}

function detectKeys() {
  if (gameState == 4) {
    if (keyIsDown(UP_ARROW)) {
      user.effectY(-1);
    } else if (keyIsDown(DOWN_ARROW)) {
      user.effectY(1);
    }
    if (keyIsDown(LEFT_ARROW)) {
      user.effectX(-1);
    } else if (keyIsDown(RIGHT_ARROW)) {
      user.effectX(1);
    }
  }
  
}

function setCursor() {
  if (!onMobile && mouseX < 50 + 25 && mouseX > 50 - 25 && mouseY < 50 + 25 && mouseY > 50 -25 ||
      mouseX < buttonX + 175 / 2 && mouseX > buttonX - 175 / 2 && mouseY < buttonY + 20 && mouseY > buttonY - 20) {
    cursor("pointer");
  } else {
    cursor(ARROW);
  }
}

function restartGame() {
  createFlock();
  gameState = 3;
  score = 0;
  gameTimer = 4*frate;
  img = null;
  filtered = false;
}
