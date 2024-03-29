class Water{

   setup(gl){
      this.gl = gl;

      const vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, this.vertex_shader_code);
      const fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, this.fragment_shader_code);

      this.shader_program = this.gl.createProgram();
      this.gl.attachShader(this.shader_program, vertexShader);
      this.gl.attachShader(this.shader_program, fragmentShader);
      this.gl.linkProgram(this.shader_program);

      if (!this.gl.getProgramParameter(this.shader_program, this.gl.LINK_STATUS)) {
         alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.shader_program));
         return null;
      }

      this.pos_buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pos_buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);

      this.normal_buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);

      this.idx_buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);

      //texture coordinate buffer
      this.tex_coord_buffer = gl.createBuffer();
      this.gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_coord_buffer);
      this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.text_coord), gl.STATIC_DRAW);

      this.time = 0;
   }

   set_mvp(model, view, proj){
      this.model = model;
      this.view = view;
      this.proj = proj;
   }

   set_vp(view, proj){
      this.view = view;
      this.proj = proj;
   }

   set_light_pos(light_pos){
      this.light_pos = light_pos;
   }

   set_camera_pos(cam_pos){
      this.cam_pos = cam_pos;
   }

   set_model_matrix(model){
      this.model = model;
   }

   get_model_matrix(){
      return this.model;
   }

   set_reflection_texture(tex){
      this.reflection_texture_id = tex;
   }

   set_refraction_texture(tex){
      this.refraction_texture_id = tex;
   }

   set_time(time){
      this.time = time;
   }

   draw(){
      this.gl.useProgram(this.shader_program);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pos_buffer);
      this.gl.vertexAttribPointer(
         this.gl.getAttribLocation(this.shader_program, "vertex_pos"),
         3,
         this.gl.FLOAT,
         true,
         0,
         0);
      this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader_program, "vertex_pos"));

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
         this.gl.vertexAttribPointer(
         this.gl.getAttribLocation(this.shader_program, "normal"),
         3,
         this.gl.FLOAT,
         true,
         0,
         0);
      this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader_program, "normal"));


      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tex_coord_buffer);
         this.gl.vertexAttribPointer(
         this.gl.getAttribLocation(this.shader_program, "uv"),
         2,
         this.gl.FLOAT,
         true,
         0,
      0);
      this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader_program, "uv"));

      gl.activeTexture(gl.TEXTURE0);

      gl.bindTexture(gl.TEXTURE_2D, this.reflection_texture_id);

      gl.uniform1i(gl.getUniformLocation(this.shader_program, "texture_reflection"), 0);

      gl.activeTexture(gl.TEXTURE1);

      gl.bindTexture(gl.TEXTURE_2D, this.refraction_texture_id);

      gl.uniform1i(gl.getUniformLocation(this.shader_program, "texture_refraction"), 1);
      gl.uniform1f(gl.getUniformLocation(this.shader_program, "time"), this.time);

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);

      this.gl.uniform3fv(
         this.gl.getUniformLocation(this.shader_program, "light_pos"),
         this.light_pos);

      this.gl.uniform3fv(
         this.gl.getUniformLocation(this.shader_program, "camera_pos"),
         this.cam_pos);

      this.gl.uniformMatrix4fv(
         this.gl.getUniformLocation(this.shader_program, "proj"),
         false,
      this.proj);

      this.gl.uniformMatrix4fv(
         this.gl.getUniformLocation(this.shader_program, "view"),
         false,
      this.view);

      this.gl.uniformMatrix4fv(
         this.gl.getUniformLocation(this.shader_program, "model"),
         false,
      this.model);

      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
   }

   vertex_shader_code = `
      precision highp float; //high precision needed in mobile for light to display correctly
      attribute vec4 vertex_pos;
      attribute vec3 normal;

      varying vec3 pixel_pos;
      varying vec3 pixel_normal;

      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 proj;

      attribute vec2 uv;

      varying vec2 frag_uv;

      void main() {
         pixel_pos = vec3(model*vertex_pos);
         pixel_normal = normalize(vec3(model*vec4(normal, 0.0)));
         gl_Position = proj*view*model*vertex_pos;
         frag_uv = uv;
      }
   `;

   fragment_shader_code = `
      precision highp float; //high precision needed in mobile for light to display correctly

      varying vec3 pixel_pos;
      varying vec3 pixel_normal;

      uniform vec3 camera_pos;
      uniform vec3 light_pos;

      varying vec2 frag_uv;

      uniform sampler2D texture_reflection;
      uniform sampler2D texture_refraction;

      uniform mat4 view;
      uniform mat4 proj;

      uniform float time;

      float get_wave_1(float x, float y){
         float wave = 0.01*sin( dot(normalize(vec2(1,0)), vec2(x, y)) *128.0+time);
         wave += 0.01*sin( dot(normalize(vec2(15,1)), vec2(x, y)) *128.0+time);
         wave += 0.01*sin( dot(normalize(vec2(10,-1)), vec2(x, y)) *256.0+time*1.5);
         wave += 0.01*sin( dot(normalize(vec2(3,1)), vec2(x, y)) *256.0+time*1.5);
         wave += 0.02*sin( dot(normalize(vec2(6,-1)), vec2(x, y)) *64.0+time*0.8);
         wave += 0.015*sin( dot(normalize(vec2(8,1)), vec2(x, y)) *128.0+time*0.7);
         return wave/24.0;
      }

      void main() {

         float wave = get_wave_1(frag_uv.x, frag_uv.y);

         //interestingly the normal_wave would not be calculated correctly on mobile
         //if the float precision was only medium
         vec3 pos_before_x = vec3(frag_uv.x-0.001, get_wave_1(frag_uv.x-0.001, frag_uv.y), frag_uv.y);
         vec3 pos_after_x = vec3(frag_uv.x+0.001, get_wave_1(frag_uv.x+0.001, frag_uv.y), frag_uv.y);
         vec3 pos_before_y = vec3(frag_uv.x, get_wave_1(frag_uv.x, frag_uv.y-0.001), frag_uv.y-0.001);
         vec3 pos_after_y = vec3(frag_uv.x, get_wave_1(frag_uv.x, frag_uv.y+0.001), frag_uv.y+0.001);

         //get normal of wave, for lighting purpose
         vec3 normal_wave = normalize(cross( pos_after_x-pos_before_x, pos_after_y-pos_before_y));

         vec3 light_dir = normalize(light_pos-pixel_pos);
         float diffuse_light = 0.0;

         diffuse_light = dot(normal_wave, light_dir);
         float light_dist = length(light_pos-pixel_pos);
         diffuse_light /= (1.0+pow(light_dist, -0.5));

         //reflexion of light for specular light calculation, not the image reflexion
         vec3 reflexion = 2.0*normal_wave*dot(normal_wave, light_dir)-light_dir;
         reflexion = normalize(reflexion);
         vec3 view_dir = normalize(camera_pos-pixel_pos);

         float spec_light = pow(max(dot(reflexion, view_dir), 0.0), 256.0);
         spec_light = clamp(spec_light, 0.0, 1.0);

         float lum = 0.5*diffuse_light+spec_light;

         vec4 screen_pos = proj*view*vec4(pixel_pos, 1.0);
         vec2 corr_screen_pos_refraction = screen_pos.xy*0.5/screen_pos.w+vec2(0.5, 0.5);
         vec2 corr_screen_pos_reflection = vec2(corr_screen_pos_refraction.x, 1.0-corr_screen_pos_refraction.y); //must invert y

         corr_screen_pos_refraction += vec2(wave, wave);
         corr_screen_pos_reflection += vec2(wave, wave);

         vec3 colour_refraction = texture2D( texture_refraction, corr_screen_pos_refraction ).rgb;
         vec3 colour_reflection = texture2D( texture_reflection, corr_screen_pos_reflection ).rgb;
         vec4 lighting = vec4(lum, lum, lum, 1.0);
         gl_FragColor = vec4(0.25*colour_refraction, 1.0)+vec4(0.75*colour_reflection, 1.0)+ lighting;
      }
   `;

   positions = [
      -1.0, 0.0, -1.0,
      1.0, 0.0, -1.0,
      1.0, 0.0,  1.0,
      -1.0, 0.0,  1.0,
   ];

   indices = [
      0,  2,  1,  0,  3,  2
   ];

   normals = [
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
   ];

   text_coord = [
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
   ];
}
