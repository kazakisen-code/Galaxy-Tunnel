addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // VLESS သို့မဟုတ် Trojan Parameter ရှိမရှိ စစ်မယ်
  const vlessParam = url.searchParams.get("vless");
  const trojanParam = url.searchParams.get("trojan");
  const targetLink = vlessParam || trojanParam;

  // ၁။ အကယ်၍ Link ထည့်မထားရင် HTML UI Page ကို တန်းပြပေးမယ်
  if (!targetLink) {
    return new Response(getHTML(url.origin), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // ၂။ Link ထည့်ထားရင် GitHub ကနေ SNI List ကို လှမ်းဖတ်ပြီး Sub Link ပွားပေးမယ်
  try {
    // ⚠️ အရေးကြီး - ဒီနေရာမှာ YOUR_GITHUB_USERNAME နဲ့ YOUR_REPO_NAME ကို မိမိအကောင့်အတိုင်း ကွက်တိပြောင်းပါ
    const githubRawUrl = "https://raw.githubusercontent.com/kazakisen-code/Galaxy-Tunnel/refs/heads/main/sni.json";
    
    const response = await fetch(githubRawUrl);
    const sniList = await response.json();

    let vUrl = new URL(targetLink);
    let credentials = vUrl.username; // UUID သို့မဟုတ် Trojan Password
    let host = vUrl.searchParams.get("host") || vUrl.hostname;
    let path = vUrl.searchParams.get("path") || "/";
    let type = vUrl.searchParams.get("type") || "ws";
    let protocol = vUrl.protocol; // vless: သို့မဟုတ် trojan:

    let finalConfigs = [];

    // SNI စာရင်းအတိုင်း Config ပွားထုတ်ခြင်း
    for (let s of sniList) {
      let encryption = protocol === "vless:" ? "encryption=none&" : "";
      let newConfig = `${protocol}//${credentials}@${s.address}:443?${encryption}security=tls&sni=${host}&type=${type}&host=${host}&path=${encodeURIComponent(path)}#${encodeURIComponent(s.name)}`;
      finalConfigs.push(newConfig);
    }

    const rawText = finalConfigs.join('\n');
    const base64Sub = btoa(unescape(encodeURIComponent(rawText)));

    return new Response(base64Sub, {
      status: 200,
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response("Error: ဒေတာဆွဲမရပါ သို့မဟုတ် မူရင်း Link ပုံစံ မှားနေပါသည်။", { status: 500 });
  }
}

// ၃။ HTML UI ရုပ်ထွက်အပိုင်း
function getHTML(workerOrigin) {
  return `<!DOCTYPE html>
<html lang="my">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Galaxy Sub Link Generator</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f9; max-width: 500px; margin: auto; }
        h2 { color: #222; text-align: center; margin-bottom: 20px; }
        label { font-weight: bold; display: block; margin-top: 15px; color: #444; }
        input, button, textarea { width: 100%; padding: 12px; margin-top: 8px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
        button { background-color: #28a745; color: white; font-weight: bold; cursor: pointer; border: none; margin-top: 20px; font-size: 16px; }
        button:hover { background-color: #218838; }
        textarea { height: 90px; background: #e9ecef; resize: none; color: #333; font-weight: bold; }
    </style>
</head>
<body>
    <h2>Galaxy Sub Generator 🚀</h2>
    <label>မူရင်း VLESS သို့မဟုတ် Trojan Link ကို ထည့်ပါ:</label>
    <input type="text" id="originLink" placeholder="vless://... သို့မဟုတ် trojan://...">
    <button onclick="makeSubLink()">Sub Link အဖြစ် ပွားမည်</button>

    <label>ထွက်လာသည့် Subscription Link (Copy ယူရန်):</label>
    <textarea id="resultLink" readonly onclick="this.select();"></textarea>
    <script>
        function makeSubLink() {
            let origin = document.getElementById('originLink').value.trim();
            if (!origin) { alert("Link ထည့်ပေးပါဦးဗျာ!"); return; }
            
            let param = "vless";
            if (origin.startsWith("trojan://")) {
                param = "trojan";
            } else if (!origin.startsWith("vless://")) {
                alert("VLESS သို့မဟုတ် Trojan Link စစ်စစ်ပဲ ဖြစ်ရပါမယ်!");
                return;
            }
            
            let finalSub = "${workerOrigin}/?" + param + "=" + encodeURIComponent(origin);
            document.getElementById('resultLink').value = finalSub;
        }
    </script>
</body>
</html>`;
}
