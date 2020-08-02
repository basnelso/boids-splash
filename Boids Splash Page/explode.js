class Explosion {
  constructor(x, y, amnt) {
    this.explodeTimer = 100;
    this.particles = [amnt];
    this.pos = createVector(x, y);
    for (let i = 0; i < amnt; i++) {
      let maxSpeed = 15
      let velX = random(-maxSpeed, maxSpeed);
      let velY = random(-maxSpeed, maxSpeed);
      let vel = createVector(velX, velY);
      this.particles[i] = (new Shard(this.pos.copy(), vel));
    }
  }
  
  update() {
    if (this.explodeTimer < 0) {
      this.isFinished = true;
    } else {
      this.explodeTimer--;
      for (let i = this.particles.length - 1; i >= 0; i--) {
        let shard = this.particles[i];
        shard.update(this.explodeTimer);
      }
    }
  }
}

class Shard {
  constructor(pos, vel) {
    this.pos = pos;
    this.vel = vel;
  }
  
  // Update the position and draw each shard
  update(fade) {
    let oldPos = this.pos.copy();
    this.pos.add(this.vel);
    stroke(255, 255 - fade);
    strokeWeight(1);
    line(this.pos.x, this.pos.y, oldPos.x, oldPos.y);
    this.slowDown();
  }
  
  // Slowly decrease the velocity of shard
  slowDown() {
    this.vel = this.vel.mult(0.92);
  }
}