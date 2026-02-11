import{s as f,g as L}from"./images-BCR6PCiy.js";/* empty css              */import{W as E,O as I,P as c,a as S,V as b,S as x,M as F,b as T,c as B,T as G,d as M}from"./three-C5PrIP30.js";const X=3500,z=.992,h=8e-4,D=8,j=4e-6,n=new E;n.setSize(window.innerWidth,window.innerHeight);n.setPixelRatio(window.devicePixelRatio||1);n.autoClearColor=!1;document.body.appendChild(n.domElement);window.addEventListener("resize",()=>{n.setSize(window.innerWidth,window.innerHeight),t.left=-window.innerWidth/2,t.right=window.innerWidth/2,t.top=window.innerHeight/2,t.bottom=-window.innerHeight/2,t.updateProjectionMatrix(),w.geometry.dispose(),w.geometry=new c(window.innerWidth,window.innerHeight)});const W=window.innerWidth*(window.devicePixelRatio||1),P=window.innerHeight*(window.devicePixelRatio||1);let p=new S(W,P),s=new S(W,P);const t=new I(-window.innerWidth/2,window.innerWidth/2,window.innerHeight/2,-window.innerHeight/2,.1,10);t.position.set(0,0,1);t.lookAt(new b(0,0,0));const R=new x,r=new F({transparent:!0,alphaTest:.05}),g=new T(new c(1,1),r);R.add(g);let d=Math.random()<.5?1:-1;function N(){d=Math.random()<.5?1:-1}const v=new x;let w;const a=new B({uniforms:{sampler:{value:null},scale:{value:z},twist:{value:h*d}},vertexShader:`
    varying vec2 v_uv;
    void main () {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      v_uv = uv;
    }
  `,fragmentShader:`
    uniform sampler2D sampler;
    uniform float scale;
    uniform float twist;
    varying vec2 v_uv;

    vec2 cartesianToPolar(vec2 p) {
      float angle = atan(p.y, p.x);
      float radius = length(p);
      return vec2(angle, radius);
    }

    void main () {
      vec2 polarUV = cartesianToPolar(v_uv - vec2(0.5, 0.5));
      polarUV.y *= scale;
      polarUV.x += twist;
      vec2 scaledUV = vec2(cos(polarUV.x), sin(polarUV.x)) * polarUV.y + vec2(0.5, 0.5);
      vec4 inputColor = texture2D(sampler, scaledUV);
      gl_FragColor = vec4(inputColor.rgb * 0.999, 1.0);
    }
  `});w=new T(new c(window.innerWidth,window.innerHeight),a);v.add(w);const U=L(),V=new G;let m=f(U),u=0;function y(){return u>=m.length&&(u=0,m=f(U)),m[u++]}let l=null;function _(){V.load(y(),e=>{e.colorSpace=M,l=e})}V.load(y(),e=>{e.colorSpace=M,A(e),_(),setInterval(O,X),n.setAnimationLoop(k)});function A(e){r.map&&r.map.dispose(),r.map=e;const i=e.image.width/e.image.height,o=Math.min(window.innerWidth,window.innerHeight)*.55,C=i>=1?o:o*i,H=i>=1?o/i:o;g.geometry.dispose(),g.geometry=new c(C,H),r.needsUpdate=!0,N()}function O(){l&&(A(l),l=null),_()}function k(){const e=a.uniforms.twist.value+j*d;(e>h||e<-h)&&(d*=-1),a.uniforms.twist.value=e;for(let i=0;i<D;i++){n.setRenderTarget(p),a.uniforms.sampler.value=s.texture,n.render(v,t),n.render(R,t);const o=p;p=s,s=o}n.setRenderTarget(null),a.uniforms.sampler.value=s.texture,n.render(v,t)}
