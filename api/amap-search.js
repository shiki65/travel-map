// 放在 GitHub 仓库的 api/amap-search.js；Vercel 自动部署为 /api/amap-search
// 仅服务端读取 AMAP_WEB_SERVICE_KEY，浏览器不会拿到 Key。
const buckets=new Map();
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({error:'仅支持 GET 请求'});
  const origin=req.headers.origin;
  const host=req.headers.host;
  if(origin){try{if(new URL(origin).host!==host)return res.status(403).json({error:'不允许跨站调用'});}catch{return res.status(403).json({error:'来源不合法'});}}
  const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||'unknown';
  const now=Date.now();
  const b=buckets.get(ip)||{start:now,count:0};
  if(now-b.start>60000){b.start=now;b.count=0;}
  b.count++;buckets.set(ip,b);
  if(b.count>20)return res.status(429).json({error:'搜索太频繁，请稍后再试'});
  const keywords=String(req.query.keywords||'').trim().slice(0,100);
  const city=String(req.query.city||'').trim().slice(0,50);
  if(!keywords)return res.status(400).json({error:'请填写搜索关键词'});
  const key=process.env.AMAP_WEB_SERVICE_KEY;
  if(!key)return res.status(503).json({error:'尚未配置高德服务密钥'});
  const params=new URLSearchParams({key,keywords,offset:'10',page:'1',extensions:'base',output:'JSON'});
  if(city)params.set('city',city);
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),7000);
    let response;
    try{response=await fetch('https://restapi.amap.com/v3/place/text?'+params.toString(),{signal:controller.signal});}
    finally{clearTimeout(timer);}
    if(!response.ok)throw Error('高德接口暂时不可用');
    const data=await response.json();
    if(data.status!=='1')return res.status(502).json({error:'高德搜索失败：'+String(data.info||'请检查 Key 权限').slice(0,100)});
    const pois=Array.isArray(data.pois)?data.pois.slice(0,10).map(p=>({
      name:typeof p.name==='string'?p.name:'',
      location:typeof p.location==='string'?p.location:'',
      address:typeof p.address==='string'?p.address:'',
      district:typeof p.adname==='string'?p.adname:'',
      city:typeof p.cityname==='string'?p.cityname:''
    })):[];
    return res.status(200).json({pois});
  }catch(e){return res.status(502).json({error:e.name==='AbortError'?'搜索超时，请重试':'高德搜索暂时不可用'});}
};
