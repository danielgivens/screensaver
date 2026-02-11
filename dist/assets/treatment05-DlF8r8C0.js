import{s as v,g as L}from"./images-BCR6PCiy.js";/* empty css              */import{W as E,O as b,P as w,a as f,V as B,S,M as F,b as M,c as G,T as I,d as W}from"./three-C5PrIP30.js";const U=1e3,V=.994,z=14,n=new E;n.setSize(window.innerWidth,window.innerHeight);n.setPixelRatio(window.devicePixelRatio||1);n.autoClearColor=!1;document.body.appendChild(n.domElement);window.addEventListener("resize",()=>{n.setSize(window.innerWidth,window.innerHeight),i.left=-window.innerWidth/2,i.right=window.innerWidth/2,i.top=window.innerHeight/2,i.bottom=-window.innerHeight/2,i.updateProjectionMatrix(),d.geometry.dispose(),d.geometry=new w(window.innerWidth,window.innerHeight)});const x=window.innerWidth*(window.devicePixelRatio||1),R=window.innerHeight*(window.devicePixelRatio||1);let l=new f(x,R),a=new f(x,R);const i=new b(-window.innerWidth/2,window.innerWidth/2,window.innerHeight/2,-window.innerHeight/2,.1,10);i.position.set(0,0,1);i.lookAt(new B(0,0,0));const p=new S,o=new F({transparent:!0,alphaTest:.05}),u=new M(new w(1,1),o);p.add(u);const h=new S;let d;const g=new G({uniforms:{sampler:{value:null},scale:{value:V}},vertexShader:`
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
      vec4 inputColor = texture2D(sampler, uv);
      gl_FragColor = vec4(inputColor.rgb * 0.999, 1.0);
    }
  `});d=new M(new w(window.innerWidth,window.innerHeight),g);h.add(d);const P=L(),C=new I;let c=v(P),m=0;function H(){return m>=c.length&&(m=0,c=v(P)),c[m++]}let s=null;function T(){C.load(H(),e=>{e.colorSpace=W,s=e})}C.load(H(),e=>{e.colorSpace=W,A(e),T(),setInterval(X,U),n.setAnimationLoop(j)});function A(e){o.map&&o.map.dispose(),o.map=e;const t=e.image.width/e.image.height,r=Math.min(window.innerWidth,window.innerHeight)*.55,_=t>=1?r:r*t,y=t>=1?r/t:r;u.geometry.dispose(),u.geometry=new w(_,y),o.needsUpdate=!0}function X(){s&&(A(s),s=null),T()}function j(){for(let e=0;e<z;e++){n.setRenderTarget(l),g.uniforms.sampler.value=a.texture,n.render(h,i),e===0&&n.render(p,i);const t=l;l=a,a=t}n.setRenderTarget(null),g.uniforms.sampler.value=a.texture,n.render(h,i),n.render(p,i)}
