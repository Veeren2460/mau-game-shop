let products = [];
let config = {};
let activeCategory = "All";
let activeType = "All";
function productType(p){
  const n=String(p.name||"").toLowerCase(), c=String(p.category||"").toLowerCase();
  if(c==="gaming accessories"||c==="digital services")return "Services";
  if(/\baccount\b|\baccounts\b/.test(n))return "Accounts";
  if(/subscription|membership|playstation plus|ps plus|game pass|nintendo switch online|iptv|premium plan/.test(n))return "Subscriptions";
  if(/gift card|wallet|voucher|psn card|steam card|razer gold|google play card|itunes card/.test(n)||c==="steam & gift cards")return "Gift Cards";
  return "Top-Ups";
}
function updateBrowseContext(count){const el=$("#browseContext");if(el)el.textContent=`${activeType==="All"?"All products":activeType==="Services"?"Services & gear":activeType} · ${count} item${count===1?"":"s"}`;}
function setType(type){activeType=type;activeCategory="All";$("#searchInput").value="";document.querySelectorAll("[data-type]").forEach(b=>{const on=b.dataset.type===type;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on))});document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.category==="All"));renderProducts();}
let cart = JSON.parse(localStorage.getItem("mauGameShopCart") || "[]");
const $ = (s) => document.querySelector(s);
const money = (n) => "Rs" + Number(n).toLocaleString("en-MU");
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2300)}
function safeText(value){return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function whatsappUrl(message){
  const number=String(config.whatsappNumber||"").replace(/\D/g,"");
  if(!number || number.includes("XXXXXXXX")){toast("Shop owner: add your WhatsApp number in store-config.json first.");return "#"}
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
function renderProducts(){
  const query=$("#searchInput").value.trim().toLowerCase();
  const filtered=products.filter(p=>(activeType==="All"||productType(p)===activeType)&&(activeCategory==="All"||p.category===activeCategory)&&(`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(query)));
  updateBrowseContext(filtered.length);
  $("#productGrid").innerHTML=filtered.length?filtered.map(p=>`
    <article class="product-card">
      <div class="product-image"><img src="${safeText(p.image)}" alt="${safeText(p.name)}" loading="lazy" onerror="this.style.display='none'"><span class="product-badge">${safeText(p.badge||p.category)}</span></div>
      <div class="product-info"><span class="product-category">${safeText(p.category)}</span><h3>${safeText(p.name)}</h3><p>${safeText(p.description)}</p>
      <div class="product-bottom"><span class="price">${safeText(p.priceLabel || (p.price==null?"Request price":money(p.price)))}</span><button class="add-button" data-add="${safeText(p.id)}">+ Add</button></div></div>
    </article>`).join(""):`<div class="empty-state">${activeType==="Accounts"?"No account listings available yet. Please check back later.":"No products found. Try another search or category."}</div>`;
}
function saveCart(){localStorage.setItem("mauGameShopCart",JSON.stringify(cart));renderCart()}
function addToCart(id){const p=products.find(x=>x.id===id);if(!p)return;const existing=cart.find(x=>x.id===id);if(existing)existing.qty++;else cart.push({id,qty:1});saveCart();toast(`${p.name} added to your order`)}
function renderCart(){
  $("#cartCount").textContent=cart.reduce((n,x)=>n+x.qty,0);
  const knownTotal=cart.reduce((sum,item)=>{const p=products.find(x=>x.id===item.id);return sum+(p&&p.price!=null?p.price*item.qty:0)},0);
  $("#cartTotal").textContent=money(knownTotal);
  if(!cart.length){$("#cartItems").innerHTML='<p class="muted">Your cart is empty.</p>';return}
  $("#cartItems").innerHTML=cart.map(item=>{const p=products.find(x=>x.id===item.id);if(!p)return "";return `<div class="cart-line"><div><h4>${safeText(p.name)}</h4><small>${p.price==null?"Price to be confirmed":money(p.price)+" each"}</small><div class="qty-controls"><button data-qty="${p.id}" data-delta="-1" aria-label="Decrease quantity">−</button><b>${item.qty}</b><button data-qty="${p.id}" data-delta="1" aria-label="Increase quantity">+</button><button class="remove" data-remove="${p.id}">Remove</button></div></div><b>${p.price==null?"Quote":money(p.price*item.qty)}</b></div>`}).join("");
}
function orderMessage(){
  const lines=cart.map(item=>{const p=products.find(x=>x.id===item.id);return p?`• ${p.name} x${item.qty} — ${p.price==null?"Please quote":money(p.price*item.qty)}`:""}).filter(Boolean);
  const total=cart.reduce((sum,item)=>{const p=products.find(x=>x.id===item.id);return sum+(p&&p.price!=null?p.price*item.qty:0)},0);
  return `Hello MAU GAME SHOP! I would like to place an order:\n\n${lines.join("\n")}\n\nKnown-price subtotal: ${money(total)}\nPlease confirm availability, final total and payment instructions.\n\nName:`;
}
function openCart(){$("#cartDrawer").classList.add("open");$("#cartDrawer").setAttribute("aria-hidden","false");$("#cartOverlay").hidden=false}
function closeCart(){$("#cartDrawer").classList.remove("open");$("#cartDrawer").setAttribute("aria-hidden","true");$("#cartOverlay").hidden=true}
async function init(){
  try{const [p,c]=await Promise.all([fetch("products.json"),fetch("store-config.json")]);if(!p.ok||!c.ok)throw new Error("Could not load store files");products=await p.json();config=await c.json();}catch(e){$("#productGrid").innerHTML='<div class="empty-state">Could not load products. Please make sure index.html, products.json and store-config.json are in the same folder and open the site through a web host or local server.</div>';return}
  $("#year").textContent=new Date().getFullYear();
  $("#juiceDetails").textContent=(config.payment.juiceNumber||"").includes("ADD_")?"Juice details to be added by the shop owner.":`${config.payment.juiceName} · ${config.payment.juiceNumber}`;
  $("#bankDetails").textContent=(config.payment.accountNumber||"").includes("ADD_")?"Bank account details to be added by the shop owner.":`${config.payment.bankName} · ${config.payment.accountName} · ${config.payment.accountNumber}`;
  $("#contactWhatsApp").addEventListener("click",e=>{e.preventDefault();const url=whatsappUrl("Hello MAU GAME SHOP! I would like to ask about your products and services.");if(url!=="#")window.open(url,"_blank","noopener")});
  renderProducts();renderCart();
}
document.addEventListener("click",e=>{
  const type=e.target.closest("[data-type]");if(type)setType(type.dataset.type);
  const add=e.target.closest("[data-add]");if(add)addToCart(add.dataset.add);
  const filter=e.target.closest("[data-category]");if(filter){activeCategory=filter.dataset.category;document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b===filter));renderProducts()}
  const qty=e.target.closest("[data-qty]");if(qty){const item=cart.find(x=>x.id===qty.dataset.qty);if(item){item.qty+=Number(qty.dataset.delta);if(item.qty<1)cart=cart.filter(x=>x.id!==item.id);saveCart()}}
  const remove=e.target.closest("[data-remove]");if(remove){cart=cart.filter(x=>x.id!==remove.dataset.remove);saveCart()}
  const service=e.target.closest("[data-service-filter]");if(service){activeType="All";document.querySelectorAll("[data-type]").forEach(b=>{b.classList.toggle("active",b.dataset.type==="All");b.setAttribute("aria-pressed",String(b.dataset.type==="All"))});activeCategory=service.dataset.serviceFilter;document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.category===activeCategory));renderProducts()}
});
$("#searchInput").addEventListener("input",renderProducts);
$("#cartOpen").addEventListener("click",openCart);$("#cartClose").addEventListener("click",closeCart);$("#cartOverlay").addEventListener("click",closeCart);
$("#clearCart").addEventListener("click",()=>{cart=[];saveCart()});
$("#whatsappOrder").addEventListener("click",()=>{if(!cart.length){toast("Your cart is empty.");return}closeCart();$("#checkout").scrollIntoView({behavior:"smooth"});});
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("#mainNav").classList.remove("open")));
init();

document.querySelector("#checkoutForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!cart.length){toast("Add a product to your cart first.");document.querySelector("#shop").scrollIntoView();return}
 const form=e.currentTarget,button=form.querySelector('button[type="submit"]');
 const name=$("#customerName").value.trim(),phone=$("#customerPhone").value.trim(),player=$("#customerPlayer").value.trim(),payment=$("#customerPayment").value,note=$("#customerNote").value.trim();
 const methods={"Juice":"juice","MCB":"mcb","Card inquiry":"card"};
 button.disabled=true;button.textContent="Saving order...";
 try{
  const proof=$("#paymentProof").files[0];
  if(proof && (proof.size>5242880||!["image/jpeg","image/png","image/webp","application/pdf"].includes(proof.type)))throw Error("Receipt must be JPG, PNG, WEBP or PDF under 5 MB");
  const body=new FormData();
  body.append("order",JSON.stringify({name,phone,player_id:player,payment_method:methods[payment],note,items:cart.map(x=>({id:x.id,qty:x.qty}))}));
  if(proof)body.append("proof",proof);
  const response=await fetch("https://czncneyrbtepheyuwett.supabase.co/functions/v1/create-order",{method:"POST",headers:{"apikey":"sb_publishable_57CYWH5ZetDxyEx8fLD8hg_wuJNw9om"},body});
  const result=await response.json();if(!response.ok)throw Error(result.error||"Order could not be saved");
  const status=document.querySelector("#checkoutStatus");
  if(status)status.textContent="Order #"+result.order_number+" placed successfully! Your order is pending confirmation. Please keep this order number.";
  button.disabled=false;button.type="button";button.textContent="Order #"+result.order_number+" placed";
  form.reset();
  cart=[];saveCart();
 }catch(err){toast(err.message||"Could not save order. Try again.");button.disabled=false;button.textContent="Place order"}
});
