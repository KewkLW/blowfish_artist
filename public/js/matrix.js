const sketch = (p) => {
  // Adjustable parameters
  const PARAMS = {
    SYMBOL_SIZE: 18,
    MIN_STREAM_LENGTH: 20,
    MAX_STREAM_LENGTH: 50,
    MIN_SPEED: 2,
    MAX_SPEED: 5,
    BACKGROUND_ALPHA: 150,
    LEADING_COLOR: { R: 180, G: 255, B: 100 },
    TRAILING_COLOR: { R: 0, G: 154, B: 30 },
    SWITCH_INTERVAL: { MIN: 2, MAX: 20 },
    INITIAL_Y: { MIN: -1000, MAX: 0 },
    OPACITY_MIN: 50,
    OPACITY_MAX: 200,
    LEADING_GRADIENT_LENGTH: 2,
    SECOND_CHARACTER_BRIGHTNESS: 1,
    SHOCKWAVE_SPEED: 5,
    SHOCKWAVE_WIDTH: 10,
    SHOCKWAVE_COLOR: { R: 255, G: 255, B: 255 },
    SHOCKWAVE_MAX_RADIUS: 1000,
    SHOCKWAVE_BRIGHTNESS_INCREASE: 200,
    SHOW_SHOCKWAVE_CIRCLE: false,
    MAX_SIZE_INCREASE: 10, // Maximum size increase factor
    WAVE_AMPLITUDE: 200, // Maximum vertical displacement
    WAVE_FREQUENCY: 0.1, // Affects the "waviness" of the effect
    ENABLE_BRIGHTNESS_EFFECT: true, // Toggle brightness effect
    ENABLE_SIZE_INCREASE_WAVE: false, // Toggle size increase wave effect
    ENABLE_PARTICLE_EFFECT: true, // Toggle particle effect
    ENABLE_CHARACTER_FLY_OUT: true, // Toggle character fly out effect
    PARTICLE_COUNT: 2, // Number of particles
    PARTICLE_SPEED: 8, // Speed of particles
    PARTICLE_SIZE: 1, // Size of particles
    PARTICLE_DURATION: 1, // Duration of particles in frames
    FLY_OUT_SPEED: 1, // Speed of flying out characters
    FLY_OUT_DURATION: 40, // Duration of flying out characters in frames
    PARTICLE_COLOR_START: { R: 180, G: 255, B: 100 }, // Start color for particles
    PARTICLE_COLOR_END: { R: 100, G: 100, B: 100 }, // End color for particles
    CHARACTER_COLOR_START: { R: 180, G: 255, B: 100 }, // Start color for flying characters
    CHARACTER_COLOR_END: { R: 0, G: 154, B: 30 }, // End color for flying characters
    MAX_PARTICLES: 20, // Maximum number of particles on the screen
  };

  let streams = [];
  let shockwaves = [];
  let particles = [];
  let flyingChars = [];

  p.setup = () => {
    let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('backgroundCanvasContainer');
    p.background(0);
    const streamCount = p.floor(p.width / PARAMS.SYMBOL_SIZE);
    for (let i = 0; i < streamCount; i++) {
      streams.push(new Stream(i * PARAMS.SYMBOL_SIZE));
    }
    p.textFont("monospace");
  };

  p.draw = () => {
    p.background(0, PARAMS.BACKGROUND_ALPHA);

    // Update shockwaves and apply effects to symbols
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      shockwaves[i].update();
      streams.forEach(stream => {
        stream.symbols.forEach(symbol => {
          shockwaves[i].applyEffect(symbol);
        });
      });
      if (shockwaves[i].isFinished()) {
        shockwaves.splice(i, 1);
      }
    }

    // Update and render particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].render();
      if (particles[i].isFinished()) {
        particles.splice(i, 1);
      }
    }

    // Update and render flying characters
    for (let i = flyingChars.length - 1; i >= 0; i--) {
      flyingChars[i].update();
      flyingChars[i].render();
      if (flyingChars[i].isFinished()) {
        flyingChars.splice(i, 1);
      }
    }

    // Render streams and shockwaves
    streams.forEach(stream => stream.render());
    shockwaves.forEach(shockwave => shockwave.render());
  };

  class Stream {
    constructor(x) {
      this.x = x;
      this.symbols = [];
      this.totalSymbols = p.round(
        p.random(PARAMS.MIN_STREAM_LENGTH, PARAMS.MAX_STREAM_LENGTH)
      );
      this.speed = p.random(PARAMS.MIN_SPEED, PARAMS.MAX_SPEED);
      this.generateSymbols();
    }

    generateSymbols() {
      const firstY = p.random(PARAMS.INITIAL_Y.MIN, PARAMS.INITIAL_Y.MAX);
      for (let i = 0; i < this.totalSymbols; i++) {
        const symbol = new Symbol(
          this.x,
          firstY + i * PARAMS.SYMBOL_SIZE,
          this.speed
        );
        symbol.setToRandomSymbol();
        this.symbols.push(symbol);
      }
    }

    render() {
      this.symbols.forEach((symbol, index) => {
        const opacity = p.map(
          index,
          this.totalSymbols,
          0,
          PARAMS.OPACITY_MAX,
          PARAMS.OPACITY_MIN
        );
        const gradientIndex = Math.max(0, this.totalSymbols - index - 1);
        symbol.render(opacity, gradientIndex);
      });
      this.rain();
    }

    rain() {
      this.symbols.forEach((symbol) => {
        symbol.rain();
        if (symbol.y >= p.height) {
          symbol.y = 0;
          symbol.originalY = 0; // Reset originalY as well
          symbol.setToRandomSymbol();
        }
      });
    }
  }

  class Symbol {
    constructor(x, y, speed) {
      this.x = x;
      this.y = y;
      this.originalY = y;
      this.value = "";
      this.speed = speed;
      this.switchInterval = p.round(
        p.random(PARAMS.SWITCH_INTERVAL.MIN, PARAMS.SWITCH_INTERVAL.MAX)
      );
      this.brightness = 0;
      this.size = PARAMS.SYMBOL_SIZE;
      this.waveOffset = 0;
    }

    setToRandomSymbol() {
      const katakana =
        "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
      const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numbers = "0123456789";
      const allChars = katakana + alphabets + numbers;
      this.value = allChars[Math.floor(Math.random() * allChars.length)];
    }

    rain() {
      this.y += this.speed;
      this.originalY += this.speed; // Update originalY to match y
    }

    render(opacity, gradientIndex) {
      let t;
      if (gradientIndex === 0) {
        t = 0; // Leading character
      } else if (gradientIndex === 1) {
        t = 1 - PARAMS.SECOND_CHARACTER_BRIGHTNESS; // Second character
      } else {
        // Gradual transition for the rest
        t = p.map(gradientIndex, 2, PARAMS.LEADING_GRADIENT_LENGTH,
                  1 - PARAMS.SECOND_CHARACTER_BRIGHTNESS, 1, true);
      }

      // Apply brightness increase
      const r = p.min(255, p.lerp(PARAMS.LEADING_COLOR.R, PARAMS.TRAILING_COLOR.R, t) + (PARAMS.ENABLE_BRIGHTNESS_EFFECT ? this.brightness : 0));
      const g = p.min(255, p.lerp(PARAMS.LEADING_COLOR.G, PARAMS.TRAILING_COLOR.G, t) + (PARAMS.ENABLE_BRIGHTNESS_EFFECT ? this.brightness : 0));
      const b = p.min(255, p.lerp(PARAMS.LEADING_COLOR.B, PARAMS.TRAILING_COLOR.B, t) + (PARAMS.ENABLE_BRIGHTNESS_EFFECT ? this.brightness : 0));

      p.fill(r, g, b, opacity);
      p.textSize(this.size);
      p.text(this.value, this.x, this.y + this.waveOffset);

      if (p.frameCount % this.switchInterval === 0) {
        this.setToRandomSymbol();
      }

      // Reset effects for next frame
      this.brightness = 0;
      this.size = PARAMS.SYMBOL_SIZE;
      this.waveOffset = 0;
    }
  }

  class Shockwave {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 0;
    }

    update() {
      this.radius += PARAMS.SHOCKWAVE_SPEED;
    }

    render() {
      if (PARAMS.SHOW_SHOCKWAVE_CIRCLE) {
        p.noFill();
        p.stroke(PARAMS.SHOCKWAVE_COLOR.R, PARAMS.SHOCKWAVE_COLOR.G, PARAMS.SHOCKWAVE_COLOR.B, 50);
        p.strokeWeight(1);
        p.circle(this.x, this.y, this.radius * 2);
      }
    }

    applyEffect(symbol) {
      const d = p.dist(this.x, this.y, symbol.x, symbol.y);
      const edgeWidth = PARAMS.SHOCKWAVE_WIDTH / 2;

      if (d <= this.radius + edgeWidth && d >= this.radius - edgeWidth) {
        // Calculate the effect strength based on distance from the shockwave's center
        let effectStrength;
        if (d < this.radius) {
          // Inner half of the shockwave
          effectStrength = p.map(d, this.radius - edgeWidth, this.radius, 0, 1);
        } else {
          // Outer half of the shockwave
          effectStrength = p.map(d, this.radius, this.radius + edgeWidth, 1, 0);
        }

        // Apply brightness effect
        if (PARAMS.ENABLE_BRIGHTNESS_EFFECT) {
          symbol.brightness = PARAMS.SHOCKWAVE_BRIGHTNESS_INCREASE * effectStrength;
        }

        // Apply size increase effect
        if (PARAMS.ENABLE_SIZE_INCREASE_WAVE) {
          symbol.size = PARAMS.SYMBOL_SIZE * (1 + (PARAMS.MAX_SIZE_INCREASE - 1) * effectStrength);
        }

        // Apply wave effect
        if (PARAMS.ENABLE_SIZE_INCREASE_WAVE) {
          const angle = (this.radius - d) * PARAMS.WAVE_FREQUENCY;
          symbol.waveOffset = Math.sin(angle) * PARAMS.WAVE_AMPLITUDE * effectStrength;
        }

        // Apply particle effect
        if (PARAMS.ENABLE_PARTICLE_EFFECT && particles.length < PARAMS.MAX_PARTICLES) {
          for (let i = 0; i < PARAMS.PARTICLE_COUNT * effectStrength; i++) {
            particles.push(new Particle(symbol.x, symbol.y, PARAMS.PARTICLE_SPEED, PARAMS.PARTICLE_SIZE, PARAMS.PARTICLE_DURATION));
          }
        }

        // Apply character fly out effect
        if (PARAMS.ENABLE_CHARACTER_FLY_OUT) {
          flyingChars.push(new FlyingChar(symbol.x, symbol.y, symbol.value, PARAMS.FLY_OUT_SPEED, PARAMS.FLY_OUT_DURATION));
        }
      }
    }

    isFinished() {
      return this.radius > PARAMS.SHOCKWAVE_MAX_RADIUS;
    }
  }

  class Particle {
    constructor(x, y, speed, size, duration) {
      this.x = x;
      this.y = y;
      this.vx = p.random(-speed, speed);
      this.vy = p.random(-speed, speed);
      this.size = size;
      this.alpha = 255;
      this.duration = duration;
      this.lifespan = duration;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha = p.map(this.lifespan, 0, this.duration, 0, 255);
      this.lifespan--;
    }

    render() {
      const t = p.map(this.lifespan, 0, this.duration, 1, 0);
      const r = p.lerp(PARAMS.PARTICLE_COLOR_START.R, PARAMS.PARTICLE_COLOR_END.R, t);
      const g = p.lerp(PARAMS.PARTICLE_COLOR_START.G, PARAMS.PARTICLE_COLOR_END.G, t);
      const b = p.lerp(PARAMS.PARTICLE_COLOR_START.B, PARAMS.PARTICLE_COLOR_END.B, t);

      p.noStroke();
      p.fill(r, g, b, this.alpha);
      p.ellipse(this.x, this.y, this.size);
    }

    isFinished() {
      return this.lifespan <= 0;
    }
  }

  class FlyingChar {
    constructor(x, y, value, speed, duration) {
      this.x = x;
      this.y = y;
      this.value = value;
      this.vx = p.random(-speed, speed);
      this.vy = p.random(-speed, speed);
      this.alpha = 255;
      this.duration = duration;
      this.lifespan = duration;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha = p.map(this.lifespan, 0, this.duration, 0, 255);
      this.lifespan--;
    }

    render() {
      const t = p.map(this.lifespan, 0, this.duration, 1, 0);
      const r = p.lerp(PARAMS.CHARACTER_COLOR_START.R, PARAMS.CHARACTER_COLOR_END.R, t);
      const g = p.lerp(PARAMS.CHARACTER_COLOR_START.G, PARAMS.CHARACTER_COLOR_END.G, t);
      const b = p.lerp(PARAMS.CHARACTER_COLOR_START.B, PARAMS.CHARACTER_COLOR_END.B, t);

      p.fill(r, g, b, this.alpha);
      p.textSize(PARAMS.SYMBOL_SIZE);
      p.text(this.value, this.x, this.y);
    }

    isFinished() {
      return this.lifespan <= 0;
    }
  }

  p.mousePressed = () => {
    shockwaves.push(new Shockwave(p.mouseX, p.mouseY));
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

new p5(sketch);
