import{s as v,g as A}from"./images-BCR6PCiy.js";/* empty css              */import{W as _,O as b,P as w,a as f,V as B,S as x,M as E,b as S,c as G,d as z,T as F,e as W}from"./three-D_NhEaoq.js";const I=1e3,X=.969,n=new _;n.setSize(window.innerWidth,window.innerHeight);n.setPixelRatio(window.devicePixelRatio||1);n.autoClearColor=!1;document.body.appendChild(n.domElement);window.addEventListener("resize",()=>{n.setSize(window.innerWidth,window.innerHeight),i.left=-window.innerWidth/2,i.right=window.innerWidth/2,i.top=window.innerHeight/2,i.bottom=-window.innerHeight/2,i.updateProjectionMatrix(),d.geometry.dispose(),d.geometry=new w(window.innerWidth,window.innerHeight)});const P=window.innerWidth*(window.devicePixelRatio||1),M=window.innerHeight*(window.devicePixelRatio||1);let a=new f(P,M),c=new f(P,M);const i=new b(-window.innerWidth/2,window.innerWidth/2,window.innerHeight/2,-window.innerHeight/2,.1,10);i.position.set(0,0,1);i.lookAt(new B(0,0,0));const y=new x,h=Math.min(window.innerWidth,window.innerHeight)*.55,j=new w(h,h),r=new E({transparent:!0,alphaTest:.05}),u=new S(j,r);y.add(u);const g=new x;let d;const l=new G({uniforms:{sampler:{value:null},scale:{value:X},mousePos:{value:new z(0,0)}},vertexShader:`
    varying vec2 v_uv;
    void main () {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      v_uv = uv;
    }
  `,fragmentShader:`
    uniform sampler2D sampler;
    uniform float scale;
    uniform vec2 mousePos;
    varying vec2 v_uv;

    vec2 cartesianToPolar(vec2 p) {
      float angle = atan(p.y, p.x);
      float radius = length(p);
      return vec2(angle, radius);
    }

    void main () {
      vec2 polarUV = cartesianToPolar(v_uv - vec2(0.5, 0.5));
      polarUV.y *= scale;
      vec2 scaledUV = vec2(cos(polarUV.x), sin(polarUV.x)) * polarUV.y + vec2(0.5, 0.5);
      vec4 inputColor = texture2D(sampler, scaledUV + mousePos * 0.005);
      gl_FragColor = vec4(inputColor.rgb * 0.98, 1.0);
    }
  `});d=new S(new w(window.innerWidth,window.innerHeight),l);g.add(d);window.addEventListener("mousemove",e=>{const o=(e.pageX/window.innerWidth*2-1)*.25,t=((1-e.pageY/window.innerHeight)*2-1)*.25;l.uniforms.mousePos.value.set(o,t)});const H=A(),T=new F;let m=v(H),p=0;function V(){return p>=m.length&&(p=0,m=v(H)),m[p++]}let s=null;function U(){T.load(V(),e=>{e.colorSpace=W,s=e})}T.load(V(),e=>{e.colorSpace=W,C(e),U(),setInterval(D,I),n.setAnimationLoop(N)});function C(e){r.map&&r.map.dispose(),r.map=e;const o=e.image.width/e.image.height,t=Math.min(window.innerWidth,window.innerHeight)*.55,R=o>=1?t:t*o,L=o>=1?t/o:t;u.geometry.dispose(),u.geometry=new w(R,L),r.needsUpdate=!0}function D(){s&&(C(s),s=null),U()}function N(){n.setRenderTarget(a),l.uniforms.sampler.value=c.texture,n.render(g,i),n.render(y,i),n.setRenderTarget(null),l.uniforms.sampler.value=a.texture,n.render(g,i);const e=a;a=c,c=e}
