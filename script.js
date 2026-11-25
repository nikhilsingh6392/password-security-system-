const $ = (id) => document.getElementById(id);
const commonPasswords = new Set(["password","password123","123456","123456789","qwerty","qwerty123","admin","letmein","welcome","iloveyou","abc123","000000","111111","123123"]);
const sequences = ["abcdefghijklmnopqrstuvwxyz","0123456789","qwertyuiop","asdfghjkl","zxcvbnm"];
function analyze(p) {
  const checks = {
    length: p.length >= 12,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /\d/.test(p),
    symbol: /[^A-Za-z0-9]/.test(p),
    common: p.length > 0 && !commonPasswords.has(p.toLowerCase()),
    sequence: p.length > 0 && !sequences.some(s => {
      const low=p.toLowerCase(); return s.includes(low) || s.split("").reverse().join("").includes(low);
    }) && !/(.)\1{3,}/.test(p)
  };
  let pool=0;
  if(/[a-z]/.test(p))pool+=26;if(/[A-Z]/.test(p))pool+=26;if(/\d/.test(p))pool+=10;if(/[^A-Za-z0-9]/.test(p))pool+=33;
  const entropy = p.length && pool ? p.length*Math.log2(pool) : 0;
  let score=0;
  if(p.length) {
    score=Math.min(100, Math.round(entropy*1.35));
    score += Object.values(checks).filter(Boolean).length*3;
    if(!checks.common)score-=30;if(!checks.sequence)score-=20;
    if(p.length<8)score-=25;
    score=Math.max(0,Math.min(100,score));
  }
  let label="Very weak",hint="This password needs major improvement.";
  if(!p){label="Waiting for input";hint="Enter a password above";}
  else if(score>=85){label="Very strong";hint="Good foundation — use it only once."}
  else if(score>=65){label="Strong";hint="A few improvements can make it stronger."}
  else if(score>=40){label="Moderate";hint="Increase length and avoid predictable patterns."}
  else if(score>=20){label="Weak";hint="This password may be easier to guess."}
  const rec=[];
  if(p && !checks.length)rec.push("Use at least 12–16 characters; longer passphrases are often easier to remember.");
  if(p && !checks.upper)rec.push("Add uppercase letters where natural.");
  if(p && !checks.lower)rec.push("Include lowercase letters.");
  if(p && !checks.number)rec.push("Include numbers, but avoid predictable endings such as 123.");
  if(p && !checks.symbol)rec.push("Consider adding special characters.");
  if(p && !checks.common)rec.push("Avoid common or widely used passwords.");
  if(p && !checks.sequence)rec.push("Avoid keyboard patterns, repeated characters and simple sequences.");
  if(p && rec.length===0)rec.push("Nice work. Keep it unique and enable multi-factor authentication.");
  return {checks,pool,entropy,score,label,hint,rec};
}
function render(){
  const p=$("password").value, a=analyze(p);
  $("score").textContent=p?`${a.score}/100`:"—";
  $("strengthLabel").textContent=a.label;$("strengthHint").textContent=a.hint;
  $("meterFill").style.width=p?`${a.score}%`:"0%";
  $("meterFill").style.background=a.score>=85?"#53e0d0":a.score>=65?"#8adf9a":a.score>=40?"#ffc66d":"#ff6b83";
  $("entropy").textContent=p?a.entropy.toFixed(1):"—";$("length").textContent=p.length;$("pool").textContent=a.pool;
  Object.entries(a.checks).forEach(([key,ok])=>{const el=document.querySelector(`[data-check="${key}"]`);el.classList.toggle("pass",ok);el.querySelector(".check-icon").textContent=ok?"✓":"○";});
  $("recommendations").innerHTML=p?a.rec.map(x=>`<p>› ${escapeHtml(x)}</p>`).join(""):'<p>Recommendations will appear as you type.</p>';
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("password").addEventListener("input",render);
$("togglePassword").addEventListener("click",()=>{const p=$("password");p.type=p.type==="password"?"text":"password";$("togglePassword").textContent=p.type==="password"?"SHOW":"HIDE";});
$("lengthRange").addEventListener("input",e=>$("rangeValue").textContent=e.target.value);
function secureRandomInt(max){const a=new Uint32Array(1);const limit=Math.floor(0x100000000/max)*max;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;}
function generate(){
  const sets=[];if($("genUpper").checked)sets.push("ABCDEFGHJKLMNPQRSTUVWXYZ");if($("genLower").checked)sets.push("abcdefghijkmnopqrstuvwxyz");if($("genNumbers").checked)sets.push("23456789");if($("genSymbols").checked)sets.push("!@#$%^&*()-_=+[]{}?");
  if(!sets.length){$("copyStatus").textContent="Select at least one character set.";return;}
  const n=Number($("lengthRange").value), chars=sets.join("");let out=[];
  sets.forEach(s=>out.push(s[secureRandomInt(s.length)]));
  while(out.length<n)out.push(chars[secureRandomInt(chars.length)]);
  for(let i=out.length-1;i>0;i--){const j=secureRandomInt(i+1);[out[i],out[j]]=[out[j],out[i]];}
  $("generated").textContent=out.join("");$("copyStatus").textContent="Generated locally with Web Crypto. Keep it private.";
}
$("generateBtn").addEventListener("click",generate);
$("copyGenerated").addEventListener("click",async()=>{const t=$("generated").textContent;if(!t||t==="Your password appears here")return;try{await navigator.clipboard.writeText(t);$("copyStatus").textContent="Copied. Store it in a trusted password manager.";}catch{$("copyStatus").textContent="Clipboard unavailable. Select and copy the password manually.";}});
render();generate();
