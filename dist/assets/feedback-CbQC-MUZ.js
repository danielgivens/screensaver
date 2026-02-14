import{s as C,g as H}from"./images-BSjhoqbM.js";/* empty css              */import{C as A,W as F,O as I,P as i,a as M,V as O,S as b,b as y,c as N,M as x,d as U,T as V,e as z}from"./three-55PzLCib.js";const k=1e3,B=.994,G=6,j=5,X=new A(1,1,1),t=new F;t.setSize(window.innerWidth,window.innerHeight);t.setPixelRatio(window.devicePixelRatio||1);t.autoClearColor=!1;t.setClearColor(16777215);document.body.appendChild(t.domElement);window.addEventListener("resize",()=>{t.setSize(window.innerWidth,window.innerHeight),n.left=-window.innerWidth/2,n.right=window.innerWidth/2,n.top=window.innerHeight/2,n.bottom=-window.innerHeight/2,n.updateProjectionMatrix(),v.geometry.dispose(),v.geometry=new i(window.innerWidth,window.innerHeight)});const R=window.innerWidth*(window.devicePixelRatio||1),W=window.innerHeight*(window.devicePixelRatio||1);let w=new M(R,W),l=new M(R,W);const n=new I(-window.innerWidth/2,window.innerWidth/2,window.innerHeight/2,-window.innerHeight/2,.1,10);n.position.set(0,0,1);n.lookAt(new O(0,0,0));const u=new b,p=new y({transparent:!0,uniforms:{map:{value:null},outlineColor:{value:X},texelSize:{value:new N(1,1)},thickness:{value:j}},vertexShader:`
    varying vec2 v_uv;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      v_uv = uv;
    }
  `,fragmentShader:`
    uniform sampler2D map;
    uniform vec3 outlineColor;
    uniform vec2 texelSize;
    uniform float thickness;
    varying vec2 v_uv;
    void main() {
      // Sample alpha at current pixel and neighbours to detect edge
      float a = texture2D(map, v_uv).a;
      float t = thickness;
      float n  = texture2D(map, v_uv + vec2(0.0,  t) * texelSize).a;
      float s  = texture2D(map, v_uv + vec2(0.0, -t) * texelSize).a;
      float e  = texture2D(map, v_uv + vec2( t, 0.0) * texelSize).a;
      float w  = texture2D(map, v_uv + vec2(-t, 0.0) * texelSize).a;
      float ne = texture2D(map, v_uv + vec2( t,  t)  * texelSize).a;
      float nw = texture2D(map, v_uv + vec2(-t,  t)  * texelSize).a;
      float se = texture2D(map, v_uv + vec2( t, -t)  * texelSize).a;
      float sw = texture2D(map, v_uv + vec2(-t, -t)  * texelSize).a;
      float maxNeighbour = max(max(max(n, s), max(e, w)), max(max(ne, nw), max(se, sw)));
      // Outline = where we have no alpha but a neighbour does
      float outline = (1.0 - step(0.05, a)) * step(0.05, maxNeighbour);
      gl_FragColor = vec4(outlineColor, outline);
    }
  `}),d=new x(new i(1,1),p);d.position.z=-.01;u.add(d);const a=new U({transparent:!0,alphaTest:.05}),h=new x(new i(1,1),a);u.add(h);const f=new b;let v;const g=new y({uniforms:{sampler:{value:null},scale:{value:B}},vertexShader:`
    varying vec2 v_uv;
    void main () {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      v_uv = uv;
    }
  `,fragmentShader:`
    uniform sampler2D sampler;
    uniform float scale;
    varying vec2 v_uv;

    void main () {
      vec2 uv = (v_uv - vec2(0.5)) * scale + vec2(0.5);
      // Return white for any sample outside the buffer bounds
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
      }
      vec4 inputColor = texture2D(sampler, uv);
      // Fade toward white instead of black
      gl_FragColor = vec4(inputColor.rgb + (1.0 - inputColor.rgb) * 0.001, 1.0);
    }
  `});v=new x(new i(window.innerWidth,window.innerHeight),g);f.add(v);const D=H(),P=new V;let m=C(D),c=0;function T(){return c>=m.length&&(c=0,m=C(D)),m[c++]}let s=null;function L(){P.load(T(),e=>{e.colorSpace=z,s=e})}P.load(T(),e=>{e.colorSpace=z,E(e),L(),setInterval(Z,k),t.setAnimationLoop(q)});function E(e){a.map&&a.map.dispose(),a.map=e;const o=e.image.width/e.image.height,r=Math.min(window.innerWidth,window.innerHeight)*.55,S=o>=1?r:r*o,_=o>=1?r/o:r;h.geometry.dispose(),h.geometry=new i(S,_),a.needsUpdate=!0,d.geometry.dispose(),d.geometry=new i(S,_),p.uniforms.map.value=e,p.uniforms.texelSize.value.set(1/e.image.width,1/e.image.height)}function Z(){s&&(E(s),s=null),L()}function q(){for(let e=0;e<G;e++){t.setRenderTarget(w),g.uniforms.sampler.value=l.texture,t.render(f,n),e===0&&t.render(u,n);const o=w;w=l,l=o}t.setRenderTarget(null),g.uniforms.sampler.value=l.texture,t.render(f,n),t.render(u,n)}
