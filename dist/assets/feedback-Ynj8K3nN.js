import{s as v,g as A}from"./images-BSjhoqbM.js";/* empty css              */import{W as L,O as E,P as l,a as f,V as F,S,M as B,b as x,c as G,T as I,d as M}from"./three-C5PrIP30.js";const U=1e3,V=.994,z=14,n=new L;n.setSize(window.innerWidth,window.innerHeight);n.setPixelRatio(window.devicePixelRatio||1);n.autoClearColor=!1;document.body.appendChild(n.domElement);window.addEventListener("resize",()=>{n.setSize(window.innerWidth,window.innerHeight),i.left=-window.innerWidth/2,i.right=window.innerWidth/2,i.top=window.innerHeight/2,i.bottom=-window.innerHeight/2,i.updateProjectionMatrix(),d.geometry.dispose(),d.geometry=new l(window.innerWidth,window.innerHeight)});const W=window.innerWidth*(window.devicePixelRatio||1),R=window.innerHeight*(window.devicePixelRatio||1);let w=new f(W,R),a=new f(W,R);const i=new E(-window.innerWidth/2,window.innerWidth/2,window.innerHeight/2,-window.innerHeight/2,.1,10);i.position.set(0,0,1);i.lookAt(new F(0,0,0));const m=new S,o=new B({transparent:!0,alphaTest:.05}),p=new x(new l(1,1),o);m.add(p);const h=new S;let d;const g=new G({uniforms:{sampler:{value:null},scale:{value:V}},vertexShader:`
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
      // Return black for any sample outside the buffer bounds
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }
      vec4 inputColor = texture2D(sampler, uv);
      gl_FragColor = vec4(inputColor.rgb * 0.999, 1.0);
    }
  `});d=new x(new l(window.innerWidth,window.innerHeight),g);h.add(d);const y=A(),C=new I;let c=v(y),u=0;function P(){return u>=c.length&&(u=0,c=v(y)),c[u++]}let s=null;function H(){C.load(P(),e=>{e.colorSpace=M,s=e})}C.load(P(),e=>{e.colorSpace=M,T(e),H(),setInterval(X,U),n.setAnimationLoop(j)});function T(e){o.map&&o.map.dispose(),o.map=e;const t=e.image.width/e.image.height,r=Math.min(window.innerWidth,window.innerHeight)*.55,_=t>=1?r:r*t,b=t>=1?r/t:r;p.geometry.dispose(),p.geometry=new l(_,b),o.needsUpdate=!0}function X(){s&&(T(s),s=null),H()}function j(){for(let e=0;e<z;e++){n.setRenderTarget(w),g.uniforms.sampler.value=a.texture,n.render(h,i),e===0&&n.render(m,i);const t=w;w=a,a=t}n.setRenderTarget(null),g.uniforms.sampler.value=a.texture,n.render(h,i),n.render(m,i)}
