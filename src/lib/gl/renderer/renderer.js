export default class Renderer {
  clear(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  draw(gl, va, ib, shader) {
    shader.connectShader();
    va.connectVertexArray();
    ib.connectIndexBuffer();
    
    gl.drawElements(
      gl.TRIANGLES,
      ib.getCount(),
      gl.UNSIGNED_SHORT,
      null
    );
  }
}