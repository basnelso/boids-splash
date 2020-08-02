// Boid class
class Boid {
  constructor(x, y, isUser) {
    this.user = false;
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0);
    this.pos = createVector(x, y);
    this.lastPos = createVector(0,0);
    this.r = 1.0;
    this.maxspeed = 3; // Maximum speed
    this.maxforce = 0.05; // Maximum steering force
    this.eaten = false;
    this.exploded = false;
    this.explosion = null;
    
    if (isUser) {
      this.user = true;
      this.velocity = createVector(0, 0);
      this.maxspeed = 3.5;
    }
  }

  run(boids) {
    if (!this.eaten) {
      this.flock(boids);
      this.render();
      this.update();
      this.borders();
    } else {
      this.explode();
    }
  }

  // Forces go into acceleration
  applyForce(force) {
    this.acceleration.add(force);
  }

  // We accumulate a new acceleration each time based on three rules
  flock(boids) {
    let sep = this.separate(boids); // Separation
    let ali = this.align(boids); // Alignment
    let coh = this.cohesion(boids); // Cohesion
    let avo = this.avoid(); // Avoidance
    // Arbitrarily weight these forces
    sep.mult(2.5);
    ali.mult(1.0);
    coh.mult(1.0);
    avo.mult(2.5);
    // Add the force vectors to acceleration
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
    this.applyForce(avo);
  }

  // Method to update location
  update() {
    this.lastPos = this.pos.copy();
    // Update velocity
    if (!this.user) {
        this.velocity.add(this.acceleration);
    } else {
      this.slowDown();
    }
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.pos.add(this.velocity);
    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);
  }

  // A method that calculates and applies a steering force towards a target
  // STEER = DESIRED MINUS VELOCITY
  seek(target) {
    let desired = p5.Vector.sub(target, this.pos); // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce); // Limit to maximum steering force
    return steer;
  }

  // Draw boid
  render() {
    fill(255);
    let boidSize = null;
    if (!this.user) {
      if (onMobile) {
        fill(120, 304, 355);
        boidSize = 2;
      } else {
        fill(255);
        boidSize = 5;
      }
      noStroke();
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.velocity.heading());
      beginShape();
      vertex(2*boidSize, 0);
      vertex(-boidSize, boidSize);
      vertex(-boidSize, -boidSize);
      endShape(CLOSE);
      pop();
    } else if (gameState > 3) {
      drawUserBoid();
    } 
  }
  
  // Gets called when a boid gets eaten.
  explode() {
    if (!reducedMode) {
      if (this.explosion == null) {
        this.explosion = new Explosion(this.pos.x, this.pos.y, random(25, 100));
      }

      this.explosion.update();

      if (this.explosion.isFinished) {
        this.exploded = true;
      }
    } else {
      this.exploded = true;
    }
  }
  
  // Wraparound
  borders() {
    // Border collision detection
    if (this.pos.x < 0) {
      this.velocity.x = -this.velocity.x;
      this.pos.x = 1;
    }
    if (this.pos.y < 0) {
      this.velocity.y = -this.velocity.y;
      this.pos.y = 1;
    }
    if (this.pos.x > windowWidth) {
      this.velocity.x = -this.velocity.x;
      this.pos.x = windowWidth - 1;
    }
    if (this.pos.y > windowHeight) {
      this.velocity.y = -this.velocity.y;
      this.pos.y = windowHeight - 1;
    }
    
    // Button collision detection variables
    var topEdge = buttonY - 20;
    var bottomEdge = buttonY + 20;
    var rightEdge = buttonX + (175/2);
    var leftEdge = buttonX - (175/2);
    
    rectMode(CORNERS);
    noFill();
    strokeWeight(1);
    stroke(255,0,0);
    //rect(leftEdge, topEdge, rightEdge, bottomEdge);
    // Check if inside button.
    if (gameState == -1 && this.pos.x > leftEdge && this.pos.x < rightEdge &&
        this.pos.y > topEdge && this.pos.y < bottomEdge) {
      // Need to determine which direction boid is coming from.
      if (this.lastPos.y < topEdge && this.lastPos.x > leftEdge && this.lastPos.x < rightEdge) {
        this.velocity.y *= -1;
        this.pos.y = this.lastPos.y;
      } else if (this.lastPos.y > bottomEdge && this.lastPos.x > leftEdge && this.lastPos.x < rightEdge) {
        this.velocity.y *= -1;
        this.pos.y = this.lastPos.y;
      } else if (this.lastPos.x > rightEdge && this.lastPos.y < bottomEdge && this.lastPos.y > topEdge) {
        this.velocity.x = -this.velocity.x;
        this.pos.x = this.lastPos.x;
      } else if (this.lastPos.x < leftEdge && this.lastPos.y < bottomEdge && this.lastPos.y > topEdge) {
        this.velocity.x = -this.velocity.x;
        this.pos.x = this.lastPos.x;
      }
   
      
      var angle = this.velocity.heading();
      if ((angle > 45 && angle < 135) || (angle < -45 && angle > -135)) {
        this.velocity.y = -this.velocity.y;
      } else {
        this.velocity.x = -this.velocity.x;
      }
    }
  }

  // Separation
  // Method checks for nearby boids and steers away
  separate(boids) {
    let desiredseparation = 25.0;
    if (onMobile) {
      desiredseparation = 20;
    }
    let steer = createVector(0, 0);
    let count = 0;
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.pos, boids[i].pos);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0) && (d < desiredseparation)) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.pos, boids[i].pos);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++; // Keep track of how many
      }
    }
    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align(boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.pos, boids[i].pos);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(boids[i].velocity);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxspeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxforce);
      return steer;
    } else {
      return createVector(0, 0);
    }
  }

  // Cohesion
  // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
  cohesion(boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0); // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.pos, boids[i].pos);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(boids[i].pos); // Add location
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum); // Steer towards the location
    } else {
      return createVector(0, 0);
    }
  }
  
  // Avoidance
  // Calculate steering vector to move away from user controlled boid.
  avoid() {
    let sum = createVector(0,0);
    const vision = 150;
    let dist = p5.Vector.dist(this.pos, user.pos);
    if (dist > 0  && dist < vision && gameState == 4) {
      sum.add(user.pos);
      return this.seek(sum).mult(-1);
    } else {
      return createVector(0,0);
    }
  }
  
  // These are methods for the user's Boid
  effectX(direction) {
    if (direction > 0) {
      this.velocity.x += 1;
    } else {
      this.velocity.x += -1;
    }
  }
  
  effectY(direction) {
    if (direction > 0) {
      this.velocity.y += 1;
    } else {
      this.velocity.y += -1;
    }
  }
  
  slowDown() {
    var decrease = 0.05;
    if (abs(this.velocity.mag()) > 0.2) {
      if (this.velocity.x > 0) {
        this.velocity.x += -decrease;
      } else if (this.velocity.x < 0) {
        this.velocity.x += decrease;
      }
      if (this.velocity.y > 0) {
        this.velocity.y += -decrease;
      } else if (this.velocity.y < 0) {
        this.velocity.y += decrease;
      }
    }
  }
  
  closestBoid(boids) {
    let closest = null;
    let distance = windowWidth + windowHeight;
    for (let i = 0; i < boids.length; i++) {
      let currDist = p5.Vector.dist(this.pos, boids[i].pos);
      if (currDist < distance) {
        distance = currDist;
        closest = i;
      }  
    }
    return closest;
  }
}