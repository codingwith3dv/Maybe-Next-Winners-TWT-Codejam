function Shader(
  gl,
  vSource,
  fSource
) {
  let id = 0;
  let uniformLocationCache = new Map();
  let getLocation = (shader, name) => {
    if (uniformLocationCache.has(name)) {
      return uniformLocationCache.get(name);
    }
    let u_loc = gl.getUniformLocation(
      shader,
      name
    );
    uniformLocationCache.set(name, u_loc);
    return u_loc;
  };
  
  let CompileShader = function(
    gl,
    type,
    source
  ) {
    let id = gl.createShader(type);
    gl.shaderSource(id, source);
    gl.compileShader(id);
    var success = gl.getShaderParameter(id, gl.COMPILE_STATUS);
    if (!success) {
      // Something went wrong during compilation; get the error
      throw "could not compile shader:" + gl.getShaderInfoLog(id);
    }
    return id;
  };
  let CreateShader = function(
    gl,
    vertexSource,
    fragmentSource
  ) {
    let program = gl.createProgram();
    let vertexShader = CompileShader(
      gl,
      gl.VERTEX_SHADER,
      vertexSource
    );
    let fragmentShader = CompileShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentSource
    );

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      var info = gl.getProgramInfoLog(program);
      throw new Error('Could not compile WebGL program. \n\n' + info);
    }
    return program;
  };
  
  id = CreateShader(
    gl,
    vSource,
    fSource
  );

  this.connectShader = () => {
    gl.useProgram(id);
  };
  this.disconnectShader = () => {
    gl.useProgram(null);
  };
  this.setUniform4f = (
    gl,
    name,
    v0,
    v1,
    v2,
    v3
  ) => {
    gl.uniform4f(
      getLocation(id, name),
      v0,
      v1,
      v2,
      v3
    );
  };
  
  this.setUniformMatrix4fv = (
    gl,
    name,
    matrix
  ) => {
    gl.uniformMatrix4fv(
      getLocation(id, name),
      false,
      matrix
    );
  };
  
  this.setUniform1i = (
    gl,
    name,
    img
  ) => {
    gl.uniform1i(
      getLocation(id, name),
      img
    );
  };
  
  this.setUniformVec3 = (
    /** @type {WebGL2RenderingContext} */
    gl,
    name,
    val
  ) => {
    gl.uniform3f(
      getLocation(id, name),
      val[0],
      val[1],
      val[2]
    );
  };
  
  this.setBool = (
    /** @type {WebGL2RenderingContext} */
    gl,
    name,
    val
  ) => {
    gl.uniform1i(
      getLocation(id, name),
      val ? 1 : 0
    );
  };
}

class Renderer {
  static clear(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    Renderer.resizeToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }
  static draw(gl, va, ib, shader, type) {
    shader.connectShader();
    va.connectVertexArray();
    ib.connectIndexBuffer();

    gl.drawElements(
      type,
      ib.getCount(),
      gl.UNSIGNED_SHORT,
      null
    );
  }
  static drawArrays(gl, vao, type, count) {
    vao.connectVertexArray();
    gl.drawArrays(
      type,
      0,
      count
    );
  }

  static resizeToDisplaySize = (canvas) => {
    const dpr = window.devicePixelRatio;
    const {
      width,
      height
    } = canvas.getBoundingClientRect();
    const dw = Math.floor(width * dpr);
    const dh = Math.floor(height * dpr);

    if (
      canvas.width !== dw ||
      canvas.height !== dh
    ) {
      canvas.width = dw;
      canvas.height = dh;
    }
  };

}

/**
 * Common utilities
 * @module glMatrix
 */

// Configuration Constants
const EPSILON = 0.000001;
let ARRAY_TYPE =
  typeof Float32Array !== "undefined" ? Float32Array : Array;

if (!Math.hypot)
  Math.hypot = function () {
    var y = 0,
      i = arguments.length;
    while (i--) y += arguments[i] * arguments[i];
    return Math.sqrt(y);
  };

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
function create$4() {
  let out = new ARRAY_TYPE(16);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */
function translate(out, a, v) {
  let x = v[0],
    y = v[1],
    z = v[2];
  let a00, a01, a02, a03;
  let a10, a11, a12, a13;
  let a20, a21, a22, a23;

  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;

    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }

  return out;
}

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateX(out, a, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  let a10 = a[4];
  let a11 = a[5];
  let a12 = a[6];
  let a13 = a[7];
  let a20 = a[8];
  let a21 = a[9];
  let a22 = a[10];
  let a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateY(out, a, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  let a00 = a[0];
  let a01 = a[1];
  let a02 = a[2];
  let a03 = a[3];
  let a20 = a[8];
  let a21 = a[9];
  let a22 = a[10];
  let a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateZ(out, a, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  let a00 = a[0];
  let a01 = a[1];
  let a02 = a[2];
  let a03 = a[3];
  let a10 = a[4];
  let a11 = a[5];
  let a12 = a[6];
  let a13 = a[7];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}

/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */
function perspectiveNO(out, fovy, aspect, near, far) {
  const f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    const nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }
  return out;
}

/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */
const perspective = perspectiveNO;

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */
function lookAt(out, eye, center, up) {
  let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  let eyex = eye[0];
  let eyey = eye[1];
  let eyez = eye[2];
  let upx = up[0];
  let upy = up[1];
  let upz = up[2];
  let centerx = center[0];
  let centery = center[1];
  let centerz = center[2];

  if (
    Math.abs(eyex - centerx) < EPSILON &&
    Math.abs(eyey - centery) < EPSILON &&
    Math.abs(eyez - centerz) < EPSILON
  ) {
    return identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;

  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;

  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;

  len = Math.hypot(y0, y1, y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;

  return out;
}

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function create$3() {
  let out = new ARRAY_TYPE(3);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}

/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
  let x = a[0];
  let y = a[1];
  let z = a[2];
  return Math.hypot(x, y, z);
}

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function fromValues$2(x, y, z) {
  let out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function add$2(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize$3(out, a) {
  let x = a[0];
  let y = a[1];
  let z = a[2];
  let len = x * x + y * y + z * z;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }
  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}

/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function cross$1(out, a, b) {
  let ax = a[0],
    ay = a[1],
    az = a[2];
  let bx = b[0],
    by = b[1],
    bz = b[2];

  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

/**
 * Alias for {@link vec3.length}
 * @function
 */
const len$1 = length;

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
((function () {
  let vec = create$3();

  return function (a, stride, offset, count, fn, arg) {
    let i, l;
    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
}))();

function VertexBufferLayout(
  gl,
) {
  let elements = new Array();
  let stride = 0;
  
  this.pushBack = (
    count,
    type,
    normalised
  ) => {
    elements.push({
      type,
      count,
      normalised
    });
    stride += 4 * count;
  };
  this.getElements = () => {
    return elements;
  };
  this.getStride = () => {
    return stride;
  };
}

function VertexArray(gl) {
  let id = gl.createVertexArray();
  
  this.connectVertexArray = () => {
    gl.bindVertexArray(id);
  };
  this.disconnectVertexArray = () => {
    gl.bindVertexArray(null);
  };
  
  this.addBuffer = (
    gl,
    vb,
    vbl
  ) => {
    this.connectVertexArray();
    vb.connectVertexBuffer();
    let elems = vbl.getElements();
    let offset = 0;
    for(let i in elems) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(
        i,
        elems[i].count,
        elems[i].type,
        elems[i].normalised,
        vbl.getStride(),
        offset
      );
      offset = offset + elems[i].count * 4;
    }
  };
}

function VertexBuffer (
  gl,
  data
) {
  let id;
  
  id = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, id);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    data,
    gl.STATIC_DRAW
  );
  
  this.connectVertexBuffer = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, id);
  };
  this.disconnectVertexBuffer = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  };
}

function IndexBuffer(
  gl,
  data,
  count
) {
  let id;
  let _count = count;

  id = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    data,
    gl.STATIC_DRAW
  );

  this.connectIndexBuffer = () => {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id);
  };
  this.disconnectIndexBuffer = () => {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  };
  this.getCount = () => {
    return _count;
  };
}

let cos = Math.cos;
let sin = Math.sin;
let PI = Math.PI;
let radians = (d) => d * PI / 180;
let normalize$2 = (a) => {
  let x = a[0];
  let y = a[1];
  let z = a[2];
  let len = x * x + y * y + z * z;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }
  return [
    a[0] * len,
    a[1] * len,
    a[2] * len
  ]
};
let sub = (a, b) => {
  return [
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2]
  ];
};
let cross = (a, b) => {
  let ax = a[0],
    ay = a[1],
    az = a[2];
  let bx = b[0],
    by = b[1],
    bz = b[2];
  
  return [
    ay * bz - az * by,
    az * bx - ax * bz,
    ax * by - ay * bx
  ];
};

function Texture(
  gl,
  path
) {
  let id = 0;
  let filePath = path;
  
  id = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, id);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255])
  );
  
  let img = new Image();
  img.src = filePath;
  img.addEventListener('load', () => {
    gl.bindTexture(gl.TEXTURE_2D, id);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      img
    );
    gl.generateMipmap(gl.TEXTURE_2D);
  });
  
  this.connectTexture = (gl, slot = 0) => {
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, id);
  };
  
  this.disconnectTexture = (gl) => {
    gl.bindTexture(gl.TEXTURE_2D, null);
  };
}

let source$1 = {
  vertexSource: `#version 300 es
      layout(location = 0) in vec3 a_position;
      layout(location = 1) in vec2 a_texCoords;
      layout(location = 2) in vec3 a_normals;
      
      uniform mat4 u_model;
      uniform mat4 u_view;
      uniform mat4 u_proj;
      
      out vec2 v_texCoords;
      out vec3 v_normalCoords;
      out vec3 v_pos;
      
      void main(void) {
        v_texCoords = a_texCoords;
        
        gl_Position = u_proj * u_view * u_model * vec4(a_position, 1.0);
      }
      `,
  fragmentSource: `#version 300 es
    precision highp float;
      in vec2 v_texCoords;
      in vec3 v_normalCoords;
      in vec3 v_pos;
      
      uniform sampler2D u_image;
      uniform vec3 viewPos;
      uniform bool isSun;
      
      out vec4 color;
      void main(void) {
        if(!isSun) {
          vec3 tex = texture(u_image, vec2(v_texCoords.x, 1.0 - v_texCoords.y)).rgb;
          vec3 ambient = tex * vec3(1.0, 1.0, 1.0);
          vec3 norm = normalize(v_normalCoords);
          
          vec3 lightDirection = normalize(vec3(0.0, 0.0, 0.0) - v_pos);
          float diff = max(dot(norm, lightDirection), 0.0);
          vec3 diffuse = vec3(0.9, 0.9, 0.9) * diff * tex;
          
          vec3 viewDir = normalize(viewPos - v_pos);
          vec3 reflectDir = reflect(-lightDirection, norm);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);
          vec3 specular = vec3(1.0, 1.0, 1.0) * (spec * vec3(0.0, 0.0, 0.0));
          
          float distance = length(vec3(0.0, 0.0, 0.0) - v_pos);
          float attenuation = 1.0 / (1.0 + 0.0007 * distance + 0.000002 * (distance * distance));
          
          vec3 result = (ambient + diffuse + specular) * attenuation;
          color.xyzw = vec4(result, 1.0);
        } else {
          color.xyzw = texture(u_image, vec2(v_texCoords.x, 1.0 - v_texCoords.y));
        }
      }
      `
};

class Sphere {
  vao = null;
  ibo = null;
  radius = 0;
  name = '';
  stackCount = 100;
  sectorCount = this.stackCount;
  texture = null;
  constructor(gl, _radius, _name, path) {
    this.radius = _radius;
    this.name   = _name;
    this.texture = new Texture(gl, path);
    this.init(gl);
  }
  init(gl) {
    let vertices = [];
    let invRadius = 1 / this.radius;
    let xy;
    let z;
    let x;
    let y;
    let stackAngle;
    let sectorAngle;
    let sectorStep = 2 * PI / this.sectorCount;
    let stackStep = PI / this.stackCount;
    
    // vertices
    for (let i = 0; i <= this.stackCount; ++i) {
      stackAngle = PI / 2 - i * stackStep;
      xy = this.radius * cos(stackAngle);
      z = this.radius * sin(stackAngle);
    
      for (let j = 0; j <= this.sectorCount; ++j) {
        sectorAngle = j * sectorStep;
    
        x = xy * cos(sectorAngle);
        y = xy * sin(sectorAngle);
        vertices.push(x);
        vertices.push(y);
        vertices.push(z);
        
        vertices.push(j / this.sectorCount);
        vertices.push(i / this.stackCount);
        
        vertices.push(x * invRadius);
        vertices.push(y * invRadius);
        vertices.push(z * invRadius);
      }
    }
    
    // indices
    let indices = [];
    let k1;
    let k2;
    for (let i = 0; i < this.stackCount; ++i) {
      k1 = i * (this.sectorCount + 1);
      k2 = k1 + this.sectorCount + 1;
    
      for (let j = 0; j < this.sectorCount; ++j, ++k1, ++k2) {
        if (i != 0) {
          indices.push(k1);
          indices.push(k2);
          indices.push(k1 + 1);
        }
    
        if (i != (this.stackCount - 1)) {
          indices.push(k1 + 1);
          indices.push(k2);
          indices.push(k2 + 1);
        }
      }
    }
    
    this.vao = new VertexArray(gl);
    let vb = new VertexBuffer(
      gl,
      new Float32Array(vertices)
    );
    let vbl = new VertexBufferLayout(gl);
    vbl.pushBack(3, gl.FLOAT, false);
    vbl.pushBack(2, gl.FLOAT, false);
    vbl.pushBack(3, gl.FLOAT, false);
    this.vao.addBuffer(gl, vb, vbl);
    
    this.ibo = new IndexBuffer(
      gl,
      new Uint16Array(indices),
      indices.length
    );
    
    this.vao.disconnectVertexArray();
    vb.disconnectVertexBuffer();
    this.ibo.disconnectIndexBuffer();
  }
  render(gl, shader) {
    this.texture.connectTexture(gl, 0);
    Renderer.draw(gl, this.vao, this.ibo, shader, gl.TRIANGLES);
  }
}

let source = {
  vertexSource: `#version 300 es
      layout(location = 0) in vec3 a_position;
      
      uniform mat4 u_model;
      uniform mat4 u_view;
      uniform mat4 u_proj;
      
      void main(void) {
        gl_Position = u_proj * u_view * u_model * vec4(a_position, 1.0);
      }
      `,
  fragmentSource: `#version 300 es
    precision highp float;
      
      out vec4 color;
      void main(void) {
        color = vec4(1.0, 1.0, 1.0, 1.0);
      }
      `
};

class Orbit {
  vao = null;
  radius = null;
  name = '';
  sectorCount = 100;
  vertices = [];
  constructor(gl, _radius, _name) {
    this.radius = _radius;
    this.name = _name;
    this.init(gl);
  }
  
  init(gl) {
    let angle = 0;
    for(let i = 0; i <= this.sectorCount; ++i) {
      angle = 2 * PI * i / this.sectorCount;
      this.vertices.push(this.radius * sin(angle));
      this.vertices.push(0.0);
      this.vertices.push(this.radius * cos(angle));
    }
    
    this.vao = new VertexArray(gl);
    let vb = new VertexBuffer(
      gl,
      new Float32Array(this.vertices)
    );
    let vbl = new VertexBufferLayout(gl);
    vbl.pushBack(3, gl.FLOAT, false);
    this.vao.addBuffer(gl, vb, vbl);
    
    this.vao.disconnectVertexArray();
    vb.disconnectVertexBuffer();
  }
  render(gl, shader) {
    Renderer.drawArrays(gl, this.vao, gl.LINE_LOOP, this.sectorCount);
  }
}

const solarData = {
  "data": [
    {
      "name": "SUN",
      "Diameter": 109 * 12756,
      "Rotation Period": "1.125 (hours)",
      "Orbital Period": "0 (days)",
      "Distance from Sun": 0,
      "Obliquity to Orbit": 7.25
    },
    {
      "name": "MERCURY",
      "Mass": "0.33 (10^24kg)",
      "Diameter": (4879),
      "Density": "5427 (kg/m3)",
      "Gravity": "3.7 (m/s2)",
      "Escape Velocity": 4.3,
      "Rotation Period": "1407.6 (hours)",
      "Length of Day": "4222.6 (hours)",
      "Distance from Sun": 57.9,
      "Perihelion": "46.0 (10^6 km)",
      "Aphelion": "69.8 (10^6 km)",
      "Orbital Period": "88.0 (days)",
      "Orbital Velocity": "47.4 (km/s)",
      "Orbital Inclination": "7.0 (degrees)",
      "Orbital Eccentricity": "0.205",
      "Obliquity to Orbit": 0.034,
      "Mean Temperature": "167 (C)",
      "Surface Pressure": "0 (bars)",
      "Number of Moons": "0",
      "Ring System?": "No",
      "Global Magnetic Field?": "Yes"
    },

    {
      "name": "VENUS",
      "Mass": "4.87 (10^24kg)",
      "Diameter": (12104),
      "Density": "5243 (kg/m3)",
      "Gravity": "8.9 (m/s2)",
      "Escape Velocity": 10.4,
      "Rotation Period": "-5832.5 (hours)",
      "Length of Day": "2802.0 (hours)",
      "Distance from Sun": 108.2,
      "Perihelion": "107.5 (10^6 km)",
      "Aphelion": "108.9 (10^6 km)",
      "Orbital Period": "224.7 (days)",
      "Orbital Velocity": "35.0 (km/s)",
      "Orbital Inclination": "3.4 (degrees)",
      "Orbital Eccentricity": "0.007",
      "Obliquity to Orbit": 177.4,
      "Mean Temperature": "464 (C)",
      "Surface Pressure": "92 (bars)",
      "Number of Moons": "0",
      "Ring System?": "No",
      "Global Magnetic Field?": "No"
    },

    {
      "name": "EARTH",
      "Mass": "5.97 (10^24kg)",
      "Diameter": (12756),
      "Density": "5514 (kg/m3)",
      "Gravity": "9.8 (m/s2)",
      "Escape Velocity": 11.2,
      "Rotation Period": "23.9 (hours)",
      "Length of Day": "24.0 (hours)",
      "Distance from Sun": 149.6,
      "Perihelion": "147.1 (10^6 km)",
      "Aphelion": "152.1 (10^6 km)",
      "Orbital Period": "365.2 (days)",
      "Orbital Velocity": "29.8 (km/s)",
      "Orbital Inclination": "0.0 (degrees)",
      "Orbital Eccentricity": "0.017",
      "Obliquity to Orbit": 23.4,
      "Mean Temperature": "15 (C)",
      "Surface Pressure": "1 (bars)",
      "Number of Moons": "1",
      "Ring System?": "No",
      "Global Magnetic Field?": "Yes"
    },

    {
      "name": "MARS",
      "Mass": "0.642 (10^24kg)",
      "Diameter": (6792),
      "Density": "3933 (kg/m3)",
      "Gravity": "3.7 (m/s2)",
      "Escape Velocity": 5.0,
      "Rotation Period": "24.6 (hours)",
      "Length of Day": "24.7 (hours)",
      "Distance from Sun": 227.9,
      "Perihelion": "206.6 (10^6 km)",
      "Aphelion": "249.2 (10^6 km)",
      "Orbital Period": "687.0 (days)",
      "Orbital Velocity": "24.1 (km/s)",
      "Orbital Inclination": "1.9 (degrees)",
      "Orbital Eccentricity": "0.094",
      "Obliquity to Orbit": 25.2,
      "Mean Temperature": "-65 (C)",
      "Surface Pressure": "0.01 (bars)",
      "Number of Moons": "2",
      "Ring System?": "No",
      "Global Magnetic Field?": "No"
    },

    {
      "name": "JUPITER",
      "Mass": "1898 (10^24kg)",
      "Diameter": (142984),
      "Density": "1326 (kg/m3)",
      "Gravity": "23.1 (m/s2)",
      "Escape Velocity": 59.5,
      "Rotation Period": "9.9 (hours)",
      "Length of Day": "9.9 (hours)",
      "Distance from Sun": 778.6,
      "Perihelion": "740.5 (10^6 km)",
      "Aphelion": "816.6 (10^6 km)",
      "Orbital Period": "4331 (days)",
      "Orbital Velocity": "13.1 (km/s)",
      "Orbital Inclination": "1.3 (degrees)",
      "Orbital Eccentricity": "0.049",
      "Obliquity to Orbit": 3.1,
      "Mean Temperature": "-110 (C)",
      "Surface Pressure": "Unknown (bars)",
      "Number of Moons": "79",
      "Ring System?": "Yes",
      "Global Magnetic Field?": "Yes"
    },

    {
      "name": "SATURN",
      "Mass": "568 (10^24kg)",
      "Diameter": (120536),
      "Density": "687 (kg/m3)",
      "Gravity": "9.0 (m/s2)",
      "Escape Velocity": 35.5,
      "Rotation Period": "10.7 (hours)",
      "Length of Day": "10.7 (hours)",
      "Distance from Sun": 1433.5,
      "Perihelion": "1352.6 (10^6 km)",
      "Aphelion": "1514.5 (10^6 km)",
      "Orbital Period": "10747 (days)",
      "Orbital Velocity": "9.7 (km/s)",
      "Orbital Inclination": "2.5 (degrees)",
      "Orbital Eccentricity": "0.057",
      "Obliquity to Orbit": 26.7,
      "Mean Temperature": "-140 (C)",
      "Surface Pressure": "Unknown (bars)",
      "Number of Moons": "82",
      "Ring System?": "Yes",
      "Global Magnetic Field?": "Yes"
    },

    {
      "name": "URANUS",
      "Mass": "86.8 (10^24kg)",
      "Diameter": (51118),
      "Density": "1271 (kg/m3)",
      "Gravity": "8.7 (m/s2)",
      "Escape Velocity": 21.3,
      "Rotation Period": "-17.2 (hours)",
      "Length of Day": "17.2 (hours)",
      "Distance from Sun": 2872.5,
      "Perihelion": "2741.3 (10^6 km)",
      "Aphelion": "3003.6 (10^6 km)",
      "Orbital Period": "30589 (days)",
      "Orbital Velocity": "6.8 (km/s)",
      "Orbital Inclination": "0.8 (degrees)",
      "Orbital Eccentricity": "0.046",
      "Obliquity to Orbit": 97.8,
      "Mean Temperature": "-195 (C)",
      "Surface Pressure": "Unknown (bars)",
      "Number of Moons": "27",
      "Ring System?": "Yes",
      "Global Magnetic Field?": "Yes"
    },

    {
      "name": "NEPTUNE",
      "Mass": "102 (10^24kg)",
      "Diameter": (49528),
      "Density": "1638 (kg/m3)",
      "Gravity": "11.0 (m/s2)",
      "Escape Velocity": 23.5,
      "Rotation Period": "16.1 (hours)",
      "Length of Day": "16.1 (hours)",
      "Distance from Sun": 4495.1,
      "Perihelion": "4444.5 (10^6 km)",
      "Aphelion": "4545.7 (10^6 km)",
      "Orbital Period": "59800 (days)",
      "Orbital Velocity": "5.4 (km/s)",
      "Orbital Inclination": "1.8 (degrees)",
      "Orbital Eccentricity": "0.011",
      "Obliquity to Orbit": 28.3,
      "Mean Temperature": "-200 (C)",
      "Surface Pressure": "Unknown (bars)",
      "Number of Moons": "14",
      "Ring System?": "Yes",
      "Global Magnetic Field?": "Yes"
    },
  ]
};

const data = new Array();

const texPaths = [
  './res/2k_sun.jpg',
  './res/2k_mercury.jpg',
  './res/2k_venus_surface.jpg',
  './res/2k_earth_daymap.jpg',
  './res/2k_mars.jpg',
  './res/2k_jupiter.jpg',
  './res/2k_saturn.jpg',
  './res/2k_uranus.jpg',
  './res/2k_neptune.jpg'
];

{
  for(let i = 0; i < solarData.data.length; i++) {
    let value = solarData.data[i];
    let isSun = false;
    if(value.name === 'SUN') {
      isSun = true;
    }
    data.push(
      {
        'name': value.name,
        'distance': parseFloat(value['Distance from Sun']),
        'radius': (parseFloat(value.Diameter) / 2) / (12756 / 8),
        'axisTilt': parseFloat(value['Obliquity to Orbit']),
        'orbPeriod': parseFloat(value['Orbital Period'].slice(0, -7)),
        'rotPeriod':(parseFloat(value['Rotation Period'].slice(0, -8)) / 24),
        'isSun': isSun,
        'texturePath': texPaths[i],
        'sphere': null, // Actual reference to the sphere
        'orbit': null, // Actual reference to the orbit
      }
    );
  }
}

/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
function create$2() {
  let out = new ARRAY_TYPE(9);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }
  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}

/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
function create$1() {
  let out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }
  return out;
}

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
function fromValues$1(x, y, z, w) {
  let out = new ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function add$1(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */
function normalize$1(out, a) {
  let x = a[0];
  let y = a[1];
  let z = a[2];
  let w = a[3];
  let len = x * x + y * y + z * z + w * w;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }
  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
((function() {
  let vec = create$1();

  return function(a, stride, offset, count, fn, arg) {
    let i, l;
    if (!stride) {
      stride = 4;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }

    return a;
  };
}))();

/**
 * Quaternion in the format XYZW
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
function create() {
  let out = new ARRAY_TYPE(4);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  out[3] = 1;
  return out;
}

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyVec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  let s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 */
function multiply(out, a, b) {
  let ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  let bx = b[0],
    by = b[1],
    bz = b[2],
    bw = b[3];

  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */
function slerp(out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations
  let ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  let bx = b[0],
    by = b[1],
    bz = b[2],
    bw = b[3];

  let omega, cosom, sinom, scale0, scale1;

  // calc cosine
  cosom = ax * bx + ay * by + az * bz + aw * bw;
  // adjust signs (if necessary)
  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  // calculate coefficients
  if (1.0 - cosom > EPSILON) {
    // standard case (slerp)
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t;
    scale1 = t;
  }
  // calculate final values
  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;

  return out;
}

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate conjugate of
 * @returns {quat} out
 */
function conjugate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  return out;
}

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyMat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
function fromMat3(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  let fTrace = m[0] + m[4] + m[8];
  let fRoot;

  if (fTrace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    fRoot = Math.sqrt(fTrace + 1.0); // 2w
    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot; // 1/(4w)
    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    // |w| <= 1/2
    let i = 0;
    if (m[4] > m[0]) i = 1;
    if (m[8] > m[i * 3 + i]) i = 2;
    let j = (i + 1) % 3;
    let k = (i + 2) % 3;

    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }

  return out;
}

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
const fromValues = fromValues$1;

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 * @function
 */
const add = add$1;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
const normalize = normalize$1;

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {ReadonlyVec3} a the initial vector
 * @param {ReadonlyVec3} b the destination vector
 * @returns {quat} out
 */
((function () {
  let tmpvec3 = create$3();
  let xUnitVec3 = fromValues$2(1, 0, 0);
  let yUnitVec3 = fromValues$2(0, 1, 0);

  return function (out, a, b) {
    let dot$1 = dot(a, b);
    if (dot$1 < -0.999999) {
      cross$1(tmpvec3, xUnitVec3, a);
      if (len$1(tmpvec3) < 0.000001) cross$1(tmpvec3, yUnitVec3, a);
      normalize$3(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot$1 > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      cross$1(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot$1;
      return normalize(out, out);
    }
  };
}))();

/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {ReadonlyQuat} c the third operand
 * @param {ReadonlyQuat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */
((function () {
  let temp1 = create();
  let temp2 = create();

  return function (out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));

    return out;
  };
}))();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {ReadonlyVec3} view  the vector representing the viewing direction
 * @param {ReadonlyVec3} right the vector representing the local "right" direction
 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
((function () {
  let matr = create$2();

  return function (out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];

    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];

    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];

    return normalize(out, fromMat3(out, matr));
  };
}))();

let rotateQuat = function(q, v) {
  let temp = fromValues(v[0],v[1],v[2],0);
  multiply(temp, q, temp);
  multiply(temp, temp, conjugate(create(), q));
  return temp;
};

let getXAndY = (target, ev) => {
  let rect = target.getBoundingClientRect();
  return [
    ev.touches[0].clientX - rect.left,
    ev.touches[0].clientY - rect.top,
    0
  ];
};

function Camera(
  /** @type { HTMLCanvasElement } */
  canvas
) {
  let cameraPosition        = fromValues$2(-200, 0, 0);
  let cameraPositionDelta   = fromValues$2(0, 0, 0);
  let cameraLookAt          = create$3();
  let cameraDirection       = create$3();

  let cameraUp              = fromValues$2(0, 1, 0);
  let mousePosition         = create$3();

  let cameraPitch           = 0;
  let cameraHeading         = 0;

  let isMoving              = false;

  let view                  = create$4();

  this.update = () => {
    cameraDirection = normalize$2(sub(cameraLookAt, cameraPosition));

    let axis = cross(cameraDirection, cameraUp);
    let pitchQuat = setAxisAngle(create(), axis, cameraPitch);
    let headingQuat = setAxisAngle(create(), cameraUp, cameraHeading);

    let temp = add(create(),pitchQuat, headingQuat);
    normalize(temp, temp);

    cameraDirection = rotateQuat(temp, cameraDirection);
    add$2(cameraPosition, cameraPosition, cameraPositionDelta);
    add$2(cameraLookAt, cameraPosition, cameraDirection);

    cameraHeading *= 0.9;
    cameraPitch *= 0.9;

    scale(cameraPositionDelta, cameraPositionDelta, 0.8);

    lookAt(
      view,
      cameraPosition,
      cameraLookAt,
      cameraUp
    );
  };

  let max = 3;
  this.changePitch = (deg) => {
    let degrees = Math.max(-max, Math.min(max, deg));
    cameraPitch += degrees;

    if(cameraPitch >  360) cameraPitch -= 360;
    if(cameraPitch < -360) cameraPitch += 360;
  };

  this.changeHeading = (deg) => {
    let degrees = Math.max(-max, Math.min(max, deg));

    if(
      cameraPitch > 90 &&
      cameraPitch < 270 ||
      (cameraPitch < -90 && cameraPitch > -270)
    ) {
      cameraHeading -= degrees;
    } else {
      cameraHeading += degrees;
    }

    // if (cameraHeading >  360) cameraHeading -= 360;
    // if (cameraHeading < -360) cameraHeading += 360;
  };

  let touchMove = (ev) => {
    let x_y_z = getXAndY(canvas, ev);
    let mouseDelta = sub(mousePosition, x_y_z);

    if(isMoving) {
      this.changeHeading(0.0008 * mouseDelta[0]);
      this.changePitch(0.0008 * mouseDelta[1]);
    }
    mousePosition = x_y_z;
  };
  let mouseMove = (ev) => {
    let x_y_z = [ev.clientX, ev.clientY, 0];
    let mouseDelta = sub(mousePosition, x_y_z);

    if(isMoving) {
      this.changeHeading(0.0008 * mouseDelta[0]);
      this.changePitch(0.0008 * mouseDelta[1]);
    }
    mousePosition = x_y_z;
  };
  let touchEnd = () => {
    if(isMoving) {
      isMoving = false;
      canvas.removeEventListener('touchmove', touchMove);
      canvas.removeEventListener('touchend', touchEnd);
      canvas.removeEventListener('touchcancel', touchEnd);
    }
  };
  let mouseEnd = () => {
    if(isMoving) {
      isMoving = false;
      canvas.removeEventListener('mousemove', touchMove);
      canvas.removeEventListener('mouseend', touchEnd);
    }
  };
  let touchStart = (ev) => {
    mousePosition = getXAndY(canvas, ev);
    isMoving = true;
    canvas.addEventListener('touchmove', touchMove);
    canvas.addEventListener('touchend', touchEnd);
    canvas.addEventListener('touchcancel', touchEnd);
  };
  let mouseDown = (ev) => {
    mousePosition = [ev.clientX, ev.clientY, 0];
    isMoving = true;
    canvas.addEventListener('mousemove', mouseMove);
    canvas.addEventListener('mouseup', mouseEnd);
  };

  canvas.addEventListener('touchstart', touchStart);
  canvas.addEventListener('mousedown', mouseDown);

  this.getVM = () => {
    return view;
  };
  this.getPos = () => {
    return cameraPosition;
  };
}

const canvas = document.getElementById('canvas');
const accordion_list = document.getElementById('accordion-list');

/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext('webgl2') ??
  canvas.getContext('experimental-webgl2');
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

const cam = new Camera(canvas);

function mainLoop() {
  data.forEach((value) => {
    if (!value.isSun) {
      value.distance += 109;
      value.radius *= 1;

      // creating the info of the planets
      let child = document.createElement('div');
      let summary = document.createElement('button');
      summary.innerHTML = value.name;
      summary.classList.add('full-info-button');
      child.appendChild(summary);
      let full_info = `name: ${value.name}
      radius: ${parseInt(value.radius * (12756 / 8))}
      distance from sun: ${parseInt(value.distance - 109)}
      orbital inclination: ${value.axisTilt}
      `;
      let full_info_elem = document.createElement('div');
      full_info_elem.innerText = full_info;
      full_info_elem.classList.add('full-info');
      child.appendChild(full_info_elem);
      accordion_list.appendChild(child);
    } else {
      value.radius = 109;
    }
    value.sphere = new Sphere(
      gl,
      value.radius,
      value.name,
      value.texturePath
    );
    value.orbit = new Orbit(
      gl,
      value.distance,
      value.name
    );
  });

  let angleRot = 0;
  let angleRotSelf = 0;

  let sphereShader = new Shader(
    gl,
    source$1.vertexSource,
    source$1.fragmentSource
  );
  let orbitShader = new Shader(
    gl,
    source.vertexSource,
    source.fragmentSource
  );

  sphereShader.disconnectShader();
  orbitShader.disconnectShader();

  let proj = create$4();

  const render = (now) => {
    Renderer.clear(gl);
    now *= 0.001;

    perspective(
      proj,
      PI / 4,
      gl.canvas.width / gl.canvas.height,
      1, 80000
    );
    cam.update();
    let view = cam.getVM();

    sphereShader.connectShader();
    sphereShader.setUniformMatrix4fv(
      gl,
      'u_proj',
      proj
    );
    sphereShader.setUniformMatrix4fv(
      gl,
      'u_view',
      view
    );

    let modelSphere = create$4();
    let modelOrbit = create$4();

    data.forEach((value) => {
      if (!value.sphere) return;
      identity(modelSphere);
      identity(modelOrbit);

      if (!value.isSun) {
        angleRot = (2 * PI * now / value.orbPeriod);
        angleRotSelf = (2 * PI * now * value.rotPeriod);
      } else {
        angleRot = 0;
        angleRotSelf = (2 * PI * now * value.rotPeriod);
      }
      translate(
        modelSphere,
        modelSphere,
        fromValues$2(
          value.distance *
          cos(radians(value.axisTilt)) *
          sin(angleRot),
          value.distance *
          sin(radians(value.axisTilt)) *
          sin(angleRot),
          value.distance * cos(angleRot),
        )
      );

      rotateX(
        modelSphere,
        modelSphere,
        radians(value.axisTilt)
      );
      rotateY(
        modelSphere,
        modelSphere,
        angleRotSelf
      );
      rotateX(modelSphere, modelSphere, radians(90));

      sphereShader.connectShader();
      sphereShader.setUniformMatrix4fv(
        gl,
        'u_model',
        modelSphere
      );
      sphereShader.setUniform1i(
        gl,
        'u_image',
        0
      );
      sphereShader.setUniformVec3(
        gl,
        'viewPos',
        cam.getPos()
      );
      sphereShader.setBool(
        gl,
        'isSun',
        value.isSun
      );
      value.sphere.render(gl, sphereShader);

      rotateZ(
        modelOrbit,
        modelOrbit,
        radians(value.axisTilt)
      );

      orbitShader.connectShader();
      orbitShader.setUniformMatrix4fv(
        gl,
        'u_proj',
        proj
      );
      orbitShader.setUniformMatrix4fv(
        gl,
        'u_view',
        view
      );
      orbitShader.setUniformMatrix4fv(
        gl,
        'u_model',
        modelOrbit
      );
      if (!value.isSun && value.orbit)
        value.orbit.render(gl, orbitShader);
    });

    window.requestAnimationFrame(render);
  };

  window.requestAnimationFrame(render);
}

mainLoop();

let elems = document.getElementsByClassName('full-info-button');
let len = elems.length;
for (let i = 0; i < len; i++) {
  elems[i].addEventListener('click', (ev) => {
    let next = ev.currentTarget.nextSibling;
    for (let j = 0; j < len; j++) {
      if (elems[j].nextSibling.style.height && elems[j] !== ev.currentTarget) {
        elems[j].nextSibling.style.height = null;
        elems[j].nextSibling.style.margin = null;
        elems[j].nextSibling.style.padding = null;
      }
    }
    if (next.style.height) {
      next.style.height = null;
      next.style.margin = null;
      next.style.padding = null;
    } else {
      next.style.height = next.scrollHeight + 'px';
      next.style.margin = '5px';
      next.style.padding = '10px';
    }
  });
}
