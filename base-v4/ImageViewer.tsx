import React,{useState} from 'react';
export default function ImageViewer({src,alt}){
const [open,setOpen]=useState(false);const [zoom,setZoom]=useState(1);
return (<>
<div className='image-view-trigger' onClick={()=>setOpen(true)}>
<img src={src} alt={alt} style={{maxWidth:280,objectFit:'contain'}}/>
<span style={{position:'absolute',top:8,right:8}}>🔍</span>
</div>
{open&&<div className='image-viewer-overlay' onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
<div onClick={e=>e.stopPropagation()}>
<button onClick={()=>setZoom(zoom+0.2)}>+</button>
<button onClick={()=>setZoom(Math.max(.4,zoom-0.2))}>-</button>
<button onClick={()=>setZoom(1)}>100%</button>
<img src={src} alt={alt} style={{transform:`scale(${zoom})`,maxWidth:'80vw',maxHeight:'80vh'}}/>
</div></div>}
</>)}