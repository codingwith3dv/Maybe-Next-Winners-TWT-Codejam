import {
  VertexArray,
  VertexBufferLayout
} from '../gl/vertex-array/vertexArray.js';
import VertexBuffer from '../gl/buffers/VertexBuffer.js';
import IndexBuffer from '../gl/buffers/indexBuffer.js';
import Renderer from '../gl/renderer/renderer.js'

class Cube {
  static source = {
    vertexSource: `#version 300 es
      layout(location = 0) in vec3 a_position;
      layout(location = 1) in float a_op;
      uniform mat4 u_model;
      uniform mat4 u_view;
      uniform mat4 u_proj;
      out vec4 v_color;
      
      void main(void) {
        gl_Position = u_proj * u_view * u_model * vec4(a_position, 1.0);
        v_color = vec4(0.2, 0.6, 0.8, a_op);
      }
      `,
    fragmentSource: `#version 300 es
    precision highp float;
      in vec4 v_color;
      out vec4 color;
      void main(void) {
        color = v_color;
      }
      `
  };
  vao = null;
  ibo = null;
  constructor(gl, l) {
    this.init(gl, l);
  }

  init(gl, l) {
    let op1 = 0.1;
    let op2 = 0.2;
    let op3 = 0.3;
    let op4 = 0.4;
    let op5 = 0.5;
    let op6 = 0.6;
    let vertex = [
      // front
      -l, -l, -l, op1,
       l, -l, -l, op1,
       l,  l, -l, op1,
      -l,  l, -l, op1,

      // back
      -l, -l,  l, op2,
      -l,  l,  l, op2,
       l,  l,  l, op2,
       l, -l,  l, op2,
       
      // left
      -l, -l,  l, op3,
      -l, -l, -l, op3,
      -l,  l, -l, op3,
      -l,  l,  l, op3,
       
      // right
       l, -l, -l, op4,
       l, -l,  l, op4,
       l,  l,  l, op4,
       l,  l, -l, op4,
       
      // top
      -l,  l, -l, op5,
       l,  l, -l, op5,
       l,  l,  l, op5,
      -l,  l,  l, op5,
      
      // bottom
       l, -l,  l, op6,
      -l, -l,  l, op6,
      -l, -l, -l, op6,
       l, -l, -l, op6
    ];
    let indices = [
       0,  1,  2,  2,  3,  0,
       4,  5,  6,  6,  7,  4,
       8,  9, 10, 10, 11,  8,
      12, 13, 14, 14, 15, 12,
      16, 17, 18, 18, 19, 16,
      20, 21, 22, 22, 23, 20
    ];
    
    this.vao = new VertexArray(gl);
    let vb = new VertexBuffer(
      gl,
      new Float32Array(vertex)
    );
    let vbl = new VertexBufferLayout(gl);
    vbl.pushBack(3, gl.FLOAT, false);
    vbl.pushBack(1, gl.FLOAT, false);
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
    Renderer.draw(gl, this.vao, this.ibo, shader);
  }
};

export default Cube