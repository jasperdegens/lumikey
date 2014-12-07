'use strict';

/**
 * @namespace
 * @type {Object} Visualization object
 */
var vz = {
  screen    : null,
  canvas    : null,
  context   : null,
  width     : 0,
  height    : 0,
  initialized: false,
  particles : 30000,
  px        : null, // particle x locations
  py        : null, // particle y locations
  pc        : null, // particle hue [0, 1]
  pl        : null, // particle life
  lifetime  : 100, // particle lifetime
  showParticles: true, // toggle to show/hide particles
  startTime : 0, // start time
  now       : 0, // current time
  frames    : 0, // number of frames rendered
  maxHeight : 20,
  jitter    : 2,
  notes     : 0, //number of notes
  noteActive : [], // 1 if note is on, 0 if off
  rho       : 70,
  noteWidth : 20,
  releaseSpeed : 2,
  gausianEq : 0, // equation for curve calc
  options: { }
};

/** 
 * Reset particle position, e.g. after it dies
 * @param i the index of particle to be reset
 */
vz.spawn = function(i) {

  // console.log(offset);

  // draw as circle
  // var r = vz.radius + Math.random();
  // vz.px[i] = vz.field.width * 0.5 + r * Math.cos(t * 2 * Math.PI);
  // vz.py[i] = vz.field.height * 0.5 + r * Math.sin(t * 2 * Math.PI);
  
  // draw as line
  var t = i / vz.particles;

  // offset pixel placement for band overlap
  var binF = (i+1)*vz.notes/vz.particles;
  var offset = binF - Math.floor(binF) - 0.5;
  vz.px[i] = vz.ww * t + offset*vz.noteWidth;
  vz.py[i] = vz.pHeight + Math.random()*10;
  vz.pc[i] = t % vz.particles;
  vz.pl[i] = vz.lifetime;
};

// shift color according to mod wheel
// d will be range 0-127
vz.shiftColor = function(d) {
  for (var i = 0; i < vz.particles; i++){
    var t = i / vz.particles;
    vz.pc[i] = t * 0.5 + d/255;
  }
};

vz.resetColor = function(){
  var t = i / vz.particles;
  for (var i=0; i < vz.particles; i++){
    vz.pc[i] = t;
  }
};

/**
 * Resets the lifetime of particles of a certain color, triggered on strong beats
 * @param min the minimum hue [0, 1]
 * @param max the maximum hue [0, 1]
 */
// vz.pulse = function(min, max) {
//   for (var i = 0; i < vz.particles; i++) {
//     if (Math.random() < 0.2 && min < vz.pc[i] && vz.pc[i] < max) {
//       // subtract random number so particles don't all die at once
//       vz.pl[i] = vz.lifetime - Math.floor(Math.random() * 15);
//     }
//   }
// };

vz.noteOn = function(noteNumber){
  var noteS = noteNumber % vz.notes;
  vz.noteActive[noteS] = 1;
};

vz.noteOff = function(noteNumber){
  var noteS = noteNumber % vz.notes;
  vz.noteActive[noteS] = 0;
};

/**
 * Animate! 
 */
vz.animate = function() {
  
  if (!vz.initialized) return;
  requestAnimationFrame(vz.animate);

  var currNow = new Date();
  vz.time = vz.now - currNow;
  
  // update particle positions and lifetime
  var vx, vy, newY;
  for (var i = 0; i < vz.particles; i++) {

    //update pixel Y
    newY = 0;
    var oldY = vz.py[i];
    var binF = (i+1)*vz.notes/vz.particles;
    var bin = Math.floor(binF);

    // if note is triggered then raise pixels
    if(vz.noteActive[bin%vz.notes]){
      var maxY = (vz.maxHeight - oldY) * Math.pow(vz.gausianEq, -Math.pow((binF - 0.5 - bin), 2)*vz.rho);//rho*binF*slopeEQ;
      newY = maxY * Math.random();

    // if note off, check if out of jitter range then reduce velocity 
    } else if(oldY < vz.pHeight-vz.jitter*4){
      newY = vz.releaseSpeed;
    }
  
    vz.py[i] +=  newY + (Math.random() - 0.5) * vz.jitter;
    vz.pl[i]--;
    if (vz.pl[i] < 1 || vz.py[i] < 1 || vz.py[i] > vz.wh - 1) {
      vz.spawn(i);
    }
  }

  if (vz.showParticles)
    vz.renderParticles(vz.field, vz.px, vz.py, vz.pc, vz.pl);

  // check fps
  // console.log(1000 / vz.time);
  vz.now = currNow;
};


/**
 * Start visualization
 * @param options
 */
vz.start = function (options) {

  vz.screen = options.screen;
  vz.ww = options.width;
  vz.wh = options.height;
  vz.notes = options.notes ? options.notes : 66;
  vz.pHeight = vz.wh*7/8;
  vz.gausianEq = (1/(Math.sqrt(2*Math.PI)))*Math.E;

  vz.canvas = document.createElement('canvas');
  vz.screen.appendChild(vz.canvas);

  vz.canvas.width = options.width - 20;
  vz.canvas.height = options.height - 20;

  vz.context = vz.canvas.getContext('2d');
  vz.context.globalCompositeOperation = 'destination-over';


  vz.px = new Float32Array(vz.particles);
  vz.py = new Float32Array(vz.particles);
  vz.pc = new Float32Array(vz.particles);
  vz.u  = new Float32Array(vz.particles);
  vz.v  = new Float32Array(vz.particles);
  vz.pl = new Int16Array(vz.particles);

  vz.startTime = new Date();
  vz.now = vz.startTime;

  for (var i = 0; i < vz.particles; i++) {
    vz.spawn(i);
    vz.pl[i] = Math.floor(Math.random() * vz.lifetime);
    vz.v[i] = 0;
    vz.u[i] = 5;
  }

  for (var i = 0; i < vz.notes; i++){
    vz.noteActive[i] = 0;
  }

  vz.initialized = true;
  requestAnimationFrame(vz.animate);
};

/**
 * Stop visualization
 */
vz.stop = function () {
  if (!vz.initialized) return;
  vz.screen.removeChild(vz.canvas);
  vz.canvas = null;
  vz.context = null;
  vz.initialized = false;
};

/**
 * Start visualization 
 * @param options 
 */
vz.fadeIn = function (options, step) {
  vz.start(options);
  vz.context.globalAlpha = 1;
};

/** Stop visualization fading out */
vz.fadeOut = function (step) {
  vz.context.globalAlpha = 0;
  vz.stop();
};


// Export API
// exports.name    = vz.name;
// exports.type    = vz.type;
// exports.tags    = vz.tags;
// exports.start   = vz.start;
// exports.stop    = vz.stop;
// exports.fadeIn  = vz.fadeIn;
// exports.fadeOut = vz.fadeOut;
// exports.resize  = vz.resize;
// exports.audio   = vz.audio;


vz.renderParticles = function(field, px, py, pc, pl) {
  this.image = vz.context.createImageData(vz.canvas.width, vz.canvas.height);
  var n = px.length;
  var h, s, v, r, g, b, j, f, p, q, t;
  for (var i = 0; i < n; i++) {
    var cx = Math.floor(px[i]);
    var cy = Math.floor(py[i]);
    var base = 4 * (cy * vz.canvas.width + cx);
    h = pc[i];
    s = 1-Math.min(pl[i] / (vz.lifetime*1.9), 1);
    v = 1;//pl[i] / vz.lifetime;
    { // hsv -> rgb, inlined for performance
      j = Math.floor(h * 6);
      f = h * 6 - j;
      p = v * (1 - s);
      q = v * (1 - f * s);
      t = v * (1 - (1 - f) * s);
      switch (j % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
      }
    }
    // alpha
    this.image.data[base + 3]  = 255;
    // blending modes
    this.image.data[base    ] += Math.floor(r * 255);
    this.image.data[base + 1] += Math.floor(g * 255);
    this.image.data[base + 2] += Math.floor(b * 255);
    this.image.data[base + 4] += Math.floor(r * 255);
    this.image.data[base + 5] += Math.floor(g * 255);
    this.image.data[base + 6] += Math.floor(b * 255);
    this.image.data[base + 7]  = 255;
  }
  vz.context.putImageData(this.image, 0, 0);
}