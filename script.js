function writeStoredArray(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function removeStoredValue(key){try{localStorage.removeItem(key);}catch{}}
function readStoredArray(key){
 try{
  const value=JSON.parse(localStorage.getItem(key)||"[]");
  return Array.isArray(value)?value:[];
 }catch(error){return [];}
}
let products = [];
let catalogState = "loading";
let config = {};
let activeCategory = "All";
let activeType = "All";
const PAGE_SIZE = 24;
let visibleCount = PAGE_SIZE;
let browseKey = "";
let recentlyViewed = readStoredArray("mauGameShopRecentlyViewed");
let favoritesOnly = false;
let favorites = new Set(readStoredArray("mauGameShopFavorites"));
function productType(p){return p.productType || "Other";}
function typeLabel(type){return ({"All":"All products","Services":"Services & gear","Subscriptions":"Subscriptions & passes"})[type]||type;}

function updateBrowseContext(count){const el=$("#browseContext");if(el)el.textContent=`${typeLabel(activeType)} · ${count} item${count===1?"":"s"}`;}
function browseSection(type="All",category="All"){
 activeType=type;activeCategory=category;favoritesOnly=false;
 $("#searchInput").value="";$("#priceFilter").value="all";$("#sortProducts").value="default";
 syncCategoryButtons();renderProducts();
}
function setType(type){browseSection(type);}
let cart = readStoredArray("mauGameShopCart");
const $ = (s) => document.querySelector(s);
const money = (n) => "Rs" + Number(n).toLocaleString("en-MU");
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2300)}
function safeText(value){return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function whatsappUrl(message){
  const number=String(config.whatsappNumber||"").replace(/\D/g,"");
  if(!number || number.includes("XXXXXXXX")){toast("Shop owner: add your WhatsApp number in store-config.json first.");return "#"}
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
function productArt(p,large=false){
  const category=safeText(p.category);
  const title=safeText(p.name);
  const type=safeText(typeLabel(productType(p)));
  const isUnverified=/unverified|do not pay/i.test(String(p.badge||"")+" "+String(p.description||""));
  const badge=isUnverified?'<span class="art-caution">VERIFY BEFORE PAYMENT</span>':"";
  return `<div class="${large?"detail-image":"product-image"} game-art" data-category="${category}" role="img" aria-label="${title} product artwork">
    <span class="art-grid" aria-hidden="true"></span>
    <span class="art-top" aria-hidden="true">MAU GAME SHOP <span>✦</span> ${type}</span>
    <span class="art-emblem" aria-hidden="true">${safeText(({ "Free Fire":"⚡","PUBG Mobile":"◎","Mobile Legends":"◆","Roblox":"◇","Fortnite":"✦","PlayStation":"△","Xbox":"✕","Nintendo":"●","Genshin Impact":"✧","Zenless Zone Zero":"Z","Valorant":"Ⅴ","Call of Duty: Mobile":"⌖","Honkai: Star Rail":"✶","eFootball":"◉","Blood Strike":"⚔","Razer Gold":"◆","Google Play":"▶","Steam & Gift Cards":"▣","Gaming Accessories":"🎮","Digital Services":"⌘" })[p.category]||"✦")}</span>
    <span class="art-title" aria-hidden="true">${title}</span>
    <span class="art-footer" aria-hidden="true">DIGITAL GAMING MARKETPLACE</span>
    ${badge}
    ${large?"":`<span class="product-badge">${safeText(p.badge||p.category)}</span>`}
  </div>`;
}
function syncCategoryButtons(){
 document.querySelectorAll(".filter").forEach(b=>{
  b.disabled=b.dataset.category!=="All"&&!products.some(p=>(activeType==="All"||productType(p)===activeType)&&p.category===b.dataset.category);
  b.setAttribute("aria-pressed",String(b.dataset.category===activeCategory));
 });
 document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.category===activeCategory));
 document.querySelectorAll("[data-type]").forEach(b=>{const active=b.dataset.type===activeType;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
}
function renderActiveFilters(query,sort,budget){
 const el=$("#activeFilterChips");if(!el)return;
 const chips=[];
 if(activeType!=="All")chips.push(["type","Type: "+typeLabel(activeType)]);
 if(activeCategory!=="All")chips.push(["category",activeCategory]);
 if(query)chips.push(["search","Search: "+query]);
 if(budget!=="all")chips.push(["budget",budget==="quote"?"Quote only":"Up to Rs"+Number(budget).toLocaleString("en-MU")]);
 if(sort!=="default")chips.push(["sort","Custom sort"]);
 if(favoritesOnly)chips.push(["favorites","Saved only"]);
 el.hidden=!chips.length;
 el.innerHTML=chips.map(([key,label])=>`<button type="button" data-clear-filter="${key}" aria-label="Remove ${safeText(label)} filter">${safeText(label)} <span aria-hidden="true">×</span></button>`).join("");
}
function renderProducts(){
  if(catalogState!=="ready")return;
  syncCategoryButtons();
  $("#favoritesCount").textContent=favorites.size;
  $("#favoritesFilter").setAttribute("aria-pressed",String(favoritesOnly));
  const query=$("#searchInput").value.trim().toLowerCase();
  const budget=$("#priceFilter").value;
  const filtered=products.filter(p=>(budget==="all"||(budget==="quote"?p.price==null:(p.price!=null&&!isStartingPrice(p)&&Number.isFinite(Number(p.price))&&Number(p.price)<=Number(budget))))&&(!favoritesOnly||favorites.has(p.id))&&(activeType==="All"||productType(p)===activeType)&&(activeCategory==="All"||p.category===activeCategory)&&(`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(query)));
  const sort=$("#sortProducts").value;
  renderActiveFilters(query,sort,budget);
  if(sort==="price-asc")filtered.sort((a,b)=>(a.price==null?Infinity:a.price)-(b.price==null?Infinity:b.price));
  if(sort==="price-desc")filtered.sort((a,b)=>(b.price==null?-Infinity:b.price)-(a.price==null?-Infinity:a.price));
  if(sort==="name")filtered.sort((a,b)=>a.name.localeCompare(b.name));
  updateBrowseContext(filtered.length);
  const nextKey=JSON.stringify([activeType,activeCategory,query,sort,favoritesOnly,budget]);
  if(nextKey!==browseKey){visibleCount=PAGE_SIZE;browseKey=nextKey;}
  const visible=filtered.slice(0,visibleCount);
  const moreWrap=$("#loadMoreWrap");
  if(moreWrap){moreWrap.hidden=filtered.length<=visibleCount;$("#catalogProgress").textContent=`Showing ${visible.length} of ${filtered.length} products`;}
  $("#productGrid").innerHTML=filtered.length?visible.map(p=>`
    <article class="product-card">
      <button type="button" class="favorite-button ${favorites.has(p.id)?"is-saved":""}" data-favorite="${safeText(p.id)}" aria-label="${favorites.has(p.id)?"Remove from":"Save to"} saved products: ${safeText(p.name)}" aria-pressed="${favorites.has(p.id)}">${favorites.has(p.id)?"♥":"♡"}</button>
      ${productArt(p)}
      <div class="product-info"><span class="product-category">${safeText(p.category)}</span><h3>${safeText(p.name)}</h3><p>${safeText(p.description)}</p>
      <div class="product-bottom"><span class="price">${safeText(p.priceLabel || (p.price==null?"Request price":money(p.price)))}</span><button class="add-button" data-add="${safeText(p.id)}">+ Add</button></div><button class="detail-button" data-detail="${safeText(p.id)}" aria-label="View details for ${safeText(p.name)}">View details ↗</button></div>
    </article>`).join(""):`<div class="empty-state"><h3>${activeType==="Accounts"&&!products.some(p=>productType(p)==="Accounts")?"No account listings yet":"No matching products"}</h3><p>${activeType==="Accounts"&&!products.some(p=>productType(p)==="Accounts")?"Account listings are not available yet. Explore other products in the meantime.":"Try a different search, category or budget to find more products."}</p><button type="button" class="btn ghost" id="emptyResetFilters">Show all products</button></div>`;
}
function renderRecentlyViewed(){
 const panel=$("#recentlyViewed"),items=$("#recentlyViewedItems");
 if(!panel||!items)return;
 const found=recentlyViewed.map(id=>products.find(p=>p.id===id)).filter(Boolean);
 panel.hidden=!found.length;
 items.innerHTML=found.map(p=>`<button type="button" class="recent-item" data-detail="${safeText(p.id)}"><span class="recent-category">${safeText(p.category)}</span><strong>${safeText(p.name)}</strong><span class="recent-price">${safeText(p.priceLabel||(p.price==null?"Request price":money(p.price)))}</span></button>`).join("");
}
function trackRecentlyViewed(id){
 recentlyViewed=[id,...recentlyViewed.filter(x=>x!==id)].slice(0,6);
 writeStoredArray("mauGameShopRecentlyViewed",recentlyViewed);
 renderRecentlyViewed();
}
function showProduct(id,updateUrl=true){
 const p=products.find(x=>x.id===id);if(!p)return;
 trackRecentlyViewed(id);
 const warning=/unverified|do not pay/i.test(String(p.badge||"")+" "+String(p.description||""));
 $("#productDetail").innerHTML=`<div class="detail-layout">${productArt(p,true)}<div class="detail-copy"><span class="product-category">${safeText(p.category)} · ${safeText(typeLabel(productType(p)))}</span><h2>${safeText(p.name)}</h2><p>${safeText(p.description)}</p><div class="detail-price">${safeText(p.priceLabel||(p.price==null?"Request price":money(p.price)))}</div><p class="detail-disclaimer">Region, stock, delivery method and final price must be confirmed before payment.</p>${warning?'<p class="detail-warning">This listing needs independent verification before payment.</p>':""}<div class="detail-actions"><button class="btn primary" data-add="${safeText(p.id)}">Add to cart</button><button class="btn ghost" type="button" data-favorite="${safeText(p.id)}" aria-pressed="${favorites.has(p.id)}">${favorites.has(p.id)?"♥ Saved":"♡ Save product"}</button><button class="btn ghost" type="button" data-share="${safeText(p.id)}">Share product ↗</button></div></div></div>`;
 if(updateUrl){const url=new URL(window.location.href);if(url.searchParams.get("product")!==p.id){url.searchParams.set("product",p.id);history.pushState({product:p.id},"",url);}}
 if(!$("#productDialog").open)$("#productDialog").showModal();
}
function saveCart(){writeStoredArray("mauGameShopCart",cart);renderCart()}
const MAX_ITEM_QTY=20,MAX_CART_LINES=30,MAX_ORDER_SUBTOTAL=100000;
function cartLimitError(items){
 if(items.length>MAX_CART_LINES)return "Maximum 30 different products per order. Please split your order.";
 if(items.some(x=>!Number.isInteger(x.qty)||x.qty<1||x.qty>MAX_ITEM_QTY))return "Maximum 20 of each product per order. Please reduce the quantity.";
 const subtotal=items.reduce((sum,x)=>{const p=products.find(p=>p.id===x.id);return sum+(p&&p.price!=null?p.price*x.qty:0)},0);
 if(subtotal>MAX_ORDER_SUBTOTAL)return "Priced items cannot exceed Rs100,000 per order. Please split your order.";
 return "";
}
function addToCart(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 const next=cart.map(x=>({...x})),existing=next.find(x=>x.id===id);
 if(existing)existing.qty++;else next.push({id,qty:1});
 const error=cartLimitError(next);if(error){toast(error);return;}
 const status=$("#checkoutStatus");if(status){status.classList.remove("order-success");status.textContent="";}
 cart=next;saveCart();toast(`${p.name} added to your order`);
}
function isStartingPrice(p){return /^from\b/i.test(String(p.priceLabel||""));}
function linePrice(p,qty=1){return p.price==null?"Quote needed":(isStartingPrice(p)?"From ":"")+money(p.price*qty);}
function cartSummary(){
 const entries=cart.map(item=>({item,p:products.find(p=>p.id===item.id)})).filter(x=>x.p);
 const priced=entries.filter(({p})=>p.price!=null);
 const quote=priced.length<entries.length;
 const from=priced.some(({p})=>isStartingPrice(p));
 const total=priced.reduce((sum,{item,p})=>sum+p.price*item.qty,0);
 return {label:quote?"Priced items subtotal — quote items extra":from?"Starting-price subtotal":"Known-price subtotal",value:entries.length&&!priced.length?"Awaiting quote":(from?"From ":"")+money(total)};
}
function renderCheckoutReview(){
 const el=$("#checkoutReview");if(!el)return;
 const valid=cart.map(item=>({item,p:products.find(p=>p.id===item.id)})).filter(x=>x.p);
 if(!valid.length){$("#customerNote").required=false;el.innerHTML='<h3>Review your order</h3><p>Your cart is empty. Add products before checking out.</p>';return;}
 const known=valid.reduce((sum,{item,p})=>sum+(p.price==null?0:p.price*item.qty),0);
 const quote=valid.some(({p})=>p.price==null);
 const requirements=quoteRequirements();
 $("#customerNote").required=requirements.length>0;
 el.innerHTML='<h3>Review your order</h3><ul>'+valid.map(({item,p})=>'<li><span>'+safeText(p.name)+' <b>×'+item.qty+'</b></span><strong>'+safeText(linePrice(p,item.qty))+'</strong></li>').join('')+'</ul><div class="review-total"><span>'+safeText(cartSummary().label)+'</span><strong>'+safeText(cartSummary().value)+'</strong></div>'+(quote?'<p class="review-note">Some items require a quote. Add the following details in the notes: '+requirements.map(safeText).join('; ')+'. The final amount will be confirmed before payment.</p>':'<p class="review-note">Prices and availability are confirmed by the shop before payment.</p>');
}
function renderCart(){
  renderCheckoutReview();
  $("#cartCount").textContent=cart.reduce((n,x)=>n+x.qty,0);
  const knownTotal=cart.reduce((sum,item)=>{const p=products.find(x=>x.id===item.id);return sum+(p&&p.price!=null?p.price*item.qty:0)},0);
  $("#cartTotal").textContent=cartSummary().value;
  const totalLabel=document.querySelector(".cart-total span");if(totalLabel)totalLabel.textContent=cartSummary().label;
  if(!cart.length){$("#cartItems").innerHTML='<p class="muted">Your cart is empty.</p>';return}
  $("#cartItems").innerHTML=cart.map(item=>{const p=products.find(x=>x.id===item.id);if(!p)return "";return `<div class="cart-line"><div><h4>${safeText(p.name)}</h4><small>${p.price==null?"Price to be confirmed":safeText(linePrice(p))+" each"}</small><div class="qty-controls"><button data-qty="${p.id}" data-delta="-1" aria-label="Decrease quantity">−</button><b>${item.qty}</b><button data-qty="${p.id}" data-delta="1" aria-label="Increase quantity">+</button><button class="remove" data-remove="${p.id}">Remove</button></div></div><b>${safeText(linePrice(p,item.qty))}</b></div>`}).join("");
}
function quoteRequirements(){
 return cart.map(item=>products.find(p=>p.id===item.id)).filter(p=>p&&p.price==null).map(p=>{
 const details=p.id==="ps-plus"?"tier, duration and PlayStation account country":productType(p)==="Gift Cards"?"card value, currency and account country":productType(p)==="Subscriptions"?"duration, package and account region":p.category==="Gaming Accessories"?"model, compatibility and quantity":"package amount and account region or server";
 return p.name+": "+details;
 });
}
function orderMessage(){
 const lines=cart.map(item=>{const p=products.find(p=>p.id===item.id);return p?"• "+p.name+" ×"+item.qty+" — "+linePrice(p,item.qty):"";}).filter(Boolean);
 const summary=cartSummary(),requirements=quoteRequirements();
 return ["Hello MAU GAME SHOP! I would like to request an order:","",...lines,"",summary.label+": "+summary.value,...(requirements.length?["","Please specify:",...requirements]:[]),"","Please confirm availability, final price and payment instructions.","Name:"].join("\n");
}
$("#sendWhatsAppOrder")?.addEventListener("click",()=>{
 if(catalogState!=="ready"){toast("Wait for products to load.");return;}
 if(!cart.length){toast("Your cart is empty.");return;}
 const error=cartLimitError(cart);if(error){toast(error);return;}
 const url=whatsappUrl(orderMessage());if(url!=="#")window.open(url,"_blank","noopener");
});
let cartPreviousFocus=null;
function openCart(){
 const drawer=$("#cartDrawer");
 if(drawer.classList.contains("open"))return;
 cartPreviousFocus=document.activeElement;
 drawer.inert=false;
 drawer.classList.add("open");
 drawer.setAttribute("aria-hidden","false");
 $("#cartOverlay").hidden=false;
 $("#cartClose").focus();
}
function closeCart(){
 const drawer=$("#cartDrawer");
 if(!drawer.classList.contains("open"))return;
 drawer.classList.remove("open");
 drawer.setAttribute("aria-hidden","true");
 drawer.inert=true;
 $("#cartOverlay").hidden=true;
 if(cartPreviousFocus&&cartPreviousFocus.isConnected)cartPreviousFocus.focus();
 cartPreviousFocus=null;
}
document.addEventListener("keydown",e=>{
 const drawer=$("#cartDrawer");
 if(!drawer.classList.contains("open"))return;
 if(e.key==="Escape"){e.preventDefault();closeCart();return;}
 if(e.key!=="Tab")return;
 const controls=[...drawer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length);
 if(!controls.length)return;
 const first=controls[0],last=controls[controls.length-1];
 if(e.shiftKey&&(document.activeElement===first||!drawer.contains(document.activeElement))){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&(document.activeElement===last||!drawer.contains(document.activeElement))){e.preventDefault();first.focus();}
});
async function init(){
  if(catalogState==="loading"&&init.pending)return;
  init.pending=true;catalogState="loading";
  $("#productGrid").innerHTML='<div class="loading" role="status">Loading products...</div>';
  $("#loadMoreWrap").hidden=true;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const [p,c]=await Promise.all([fetch("products.json",{signal:controller.signal,cache:"no-cache"}),fetch("store-config.json",{signal:controller.signal,cache:"no-cache"})]);
    if(!p.ok||!c.ok)throw new Error("Could not load store files");
    const [catalog,settings]=await Promise.all([p.json(),c.json()]);
    if(!Array.isArray(catalog)||!settings||!settings.payment)throw new Error("Invalid store files");
    products=catalog;config=settings;catalogState="ready";
  }catch(e){
    catalogState="error";
    $("#productGrid").innerHTML='<div class="empty-state"><h3>Products could not load</h3><p>Please check your connection and try again.</p><button type="button" class="btn ghost" id="retryCatalog">Try again</button></div>';
    return;
  }finally{clearTimeout(timer);init.pending=false;}
  $("#heroProductCount").textContent=`${products.length.toLocaleString("en-MU")} products`;
  const validIds=new Set(products.map(p=>p.id));
  recentlyViewed=recentlyViewed.filter(id=>typeof id==="string"&&validIds.has(id)).slice(0,6);
  favorites=new Set([...favorites].filter(id=>typeof id==="string"&&validIds.has(id)));
  cart=cart.filter(item=>item&&typeof item.id==="string"&&validIds.has(item.id)&&Number.isInteger(item.qty)&&item.qty>0).map(item=>({id:item.id,qty:item.qty}));
  writeStoredArray("mauGameShopCart",cart);
  $("#year").textContent=new Date().getFullYear();
  $("#juiceDetails").textContent=(config.payment.juiceNumber||"").includes("ADD_")?"Juice details to be added by the shop owner.":`${config.payment.juiceName} · ${config.payment.juiceNumber}`;
  $("#bankDetails").textContent=(config.payment.accountNumber||"").includes("ADD_")?"Bank account details to be added by the shop owner.":`${config.payment.bankName} · ${config.payment.accountName} · ${config.payment.accountNumber}`;
  $("#contactWhatsApp").addEventListener("click",e=>{e.preventDefault();const url=whatsappUrl("Hello MAU GAME SHOP! I would like to ask about your products and services.");if(url!=="#")window.open(url,"_blank","noopener")});
  renderProducts();renderCart();renderRecentlyViewed();
  const savedCartError=cartLimitError(cart);if(savedCartError)toast(savedCartError);
  const linkedProduct=new URLSearchParams(window.location.search).get("product");
  if(linkedProduct && products.some(p=>p.id===linkedProduct))showProduct(linkedProduct,false);
}
document.addEventListener("click",e=>{
  if(e.target.closest("#retryCatalog")){init();return;}
  const heroCategory=e.target.closest("[data-hero-category]");if(heroCategory)browseSection("All",heroCategory.dataset.heroCategory);
  const emptyReset=e.target.closest("#emptyResetFilters");if(emptyReset){favoritesOnly=false;$("#priceFilter").value="all";$("#sortProducts").value="default";setType("All");}
  const clearFilter=e.target.closest("[data-clear-filter]");
  if(clearFilter){
    switch(clearFilter.dataset.clearFilter){
      case "type":activeType="All";break;
      case "category":activeCategory="All";break;
      case "search":$("#searchInput").value="";break;
      case "budget":$("#priceFilter").value="all";break;
      case "sort":$("#sortProducts").value="default";break;
      case "favorites":favoritesOnly=false;break;
    }
    syncCategoryButtons();renderProducts();
  }
  const favorite=e.target.closest("[data-favorite]");if(favorite){const id=favorite.dataset.favorite;if(favorites.has(id))favorites.delete(id);else favorites.add(id);writeStoredArray("mauGameShopFavorites",[...favorites]);renderProducts();if($("#productDialog").open&&$("#productDetail [data-favorite]")?.dataset.favorite===id){const detailButton=$("#productDetail [data-favorite]");detailButton.textContent=favorites.has(id)?"♥ Saved":"♡ Save product";detailButton.setAttribute("aria-pressed",String(favorites.has(id)));}toast(favorites.has(id)?"Product saved":"Removed from saved products");}
  const copyOrder=e.target.closest("[data-copy-order]");if(copyOrder){const number=copyOrder.dataset.copyOrder;if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(number).then(()=>toast("Order number copied")).catch(()=>toast("Could not copy order number"));}else{window.prompt("Copy your order number:",number);}}
  const detail=e.target.closest("[data-detail]");if(detail)showProduct(detail.dataset.detail);
  const share=e.target.closest("[data-share]");if(share){const p=products.find(x=>x.id===share.dataset.share);if(p){const url=new URL(window.location.href);url.searchParams.set("product",p.id);url.hash="shop";const link=url.toString();if(navigator.share){navigator.share({title:p.name,text:p.name+" — MAU GAME SHOP",url:link}).catch(()=>{});}else if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(link).then(()=>toast("Product link copied!")).catch(()=>toast("Could not copy link"));}else{window.prompt("Copy this product link:",link);}}}
  const type=e.target.closest("[data-type]");if(type)setType(type.dataset.type);
  const add=e.target.closest("[data-add]");if(add)addToCart(add.dataset.add);
  const filter=e.target.closest("button.filter[data-category]");if(filter&&!filter.disabled){activeCategory=filter.dataset.category;syncCategoryButtons();renderProducts()}
  const qty=e.target.closest("[data-qty]");if(qty){
   const next=cart.map(x=>({...x})),item=next.find(x=>x.id===qty.dataset.qty);
   if(item){item.qty+=Number(qty.dataset.delta);const remaining=next.filter(x=>x.qty>0);
    const error=cartLimitError(remaining);
    if(error&&Number(qty.dataset.delta)>0)toast(error);else{cart=remaining;saveCart();}
   }
  }
  const remove=e.target.closest("[data-remove]");if(remove){cart=cart.filter(x=>x.id!==remove.dataset.remove);saveCart()}
  const service=e.target.closest("[data-service-filter]");if(service)browseSection("Services",service.dataset.serviceFilter);
});
let suppressProductUrlCleanup=false;
function clearProductUrl(){if(suppressProductUrlCleanup){suppressProductUrlCleanup=false;return;}const url=new URL(window.location.href);if(url.searchParams.has("product")){url.searchParams.delete("product");history.replaceState(null,"",url);}}
$("#closeProduct").addEventListener("click",()=>$("#productDialog").close());
$("#productDialog").addEventListener("click",e=>{if(e.target===$("#productDialog"))$("#productDialog").close()});
$("#productDialog").addEventListener("close",clearProductUrl);
window.addEventListener("popstate",()=>{const id=new URLSearchParams(window.location.search).get("product");if(id&&products.some(p=>p.id===id)){showProduct(id,false);}else if($("#productDialog").open){suppressProductUrlCleanup=true;$("#productDialog").close();}});
$("#loadMoreProducts").addEventListener("click",()=>{visibleCount+=PAGE_SIZE;renderProducts();});
$("#clearRecentlyViewed").addEventListener("click",()=>{recentlyViewed=[];removeStoredValue("mauGameShopRecentlyViewed");renderRecentlyViewed();});
$("#favoritesFilter").addEventListener("click",()=>{favoritesOnly=!favoritesOnly;renderProducts();});
$("#searchInput").addEventListener("input",renderProducts);
document.addEventListener("keydown",e=>{
 const target=e.target;
 const editing=target instanceof HTMLElement&&(target.isContentEditable||["INPUT","TEXTAREA","SELECT"].includes(target.tagName));
 const shortcut=(e.key==="/"&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!editing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k");
 if(shortcut&&!$("#productDialog").open){
  e.preventDefault();
  $("#searchInput").focus();
  $("#searchInput").scrollIntoView({behavior:"smooth",block:"center"});
 }
 if(e.key==="Escape"&&document.activeElement===$("#searchInput")&&$("#searchInput").value){
  e.preventDefault();
  $("#searchInput").value="";
  renderProducts();
 }
});

$("#sortProducts").addEventListener("change",renderProducts);
$("#priceFilter").addEventListener("change",renderProducts);
$("#resetBrowse").addEventListener("click",()=>{favoritesOnly=false;$("#priceFilter").value="all";$("#sortProducts").value="default";setType("All");renderProducts();});
$("#cartOpen").addEventListener("click",openCart);$("#cartClose").addEventListener("click",closeCart);$("#cartOverlay").addEventListener("click",closeCart);
$("#clearCart").addEventListener("click",()=>{if(!cart.length){toast("Your cart is already empty.");return;}if(!window.confirm("Remove all products from your cart?"))return;cart=[];saveCart();toast("Cart cleared.");});
$("#whatsappOrder").addEventListener("click",()=>{if(!cart.length){toast("Your cart is empty.");return}closeCart();$("#checkout").scrollIntoView({behavior:"smooth"});});
function setMobileMenu(open){
 const nav=$("#mainNav"),button=$("#menuToggle");
 nav.classList.toggle("open",open);
 button.setAttribute("aria-expanded",String(open));
 button.setAttribute("aria-label",open?"Close menu":"Open menu");
}
$("#menuToggle").addEventListener("click",()=>setMobileMenu(!$("#mainNav").classList.contains("open")));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>setMobileMenu(false)));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#mainNav").classList.contains("open")){setMobileMenu(false);$("#menuToggle").focus();}});
document.addEventListener("click",e=>{if($("#mainNav").classList.contains("open")&&!e.target.closest("#mainNav")&&!e.target.closest("#menuToggle"))setMobileMenu(false);});
window.addEventListener("resize",()=>{if(window.innerWidth>800&&$("#mainNav").classList.contains("open"))setMobileMenu(false);});
init();

document.querySelector("#checkoutForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(catalogState!=="ready"){toast("Wait for products to load before placing your order.");return;}
 if(!cart.length){toast("Add a product to your cart first.");document.querySelector("#shop").scrollIntoView();return}
 const limitError=cartLimitError(cart);if(limitError){toast(limitError);return;}
 const form=e.currentTarget,button=form.querySelector('button[type="submit"]');
 const name=$("#customerName").value.trim(),phone=$("#customerPhone").value.trim(),player=$("#customerPlayer").value.trim(),payment=$("#customerPayment").value,note=$("#customerNote").value.trim();
 if(quoteRequirements().length&&!note){toast("Add package, region and duration details for your quote request.");$("#customerNote").focus();return;}
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
  if(status){status.classList.add("order-success");status.innerHTML=`<strong>✓ Order submitted successfully</strong><p>Order number: <b>${safeText(result.order_number)}</b></p><p>Your order is pending shop confirmation. Keep this number and wait for payment instructions.</p><button type="button" class="copy-order-button" data-copy-order="${safeText(result.order_number)}">Copy order number</button>`;}
  button.disabled=false;button.textContent="Place another order";
  form.reset();
  cart=[];saveCart();
 }catch(err){toast(err.message||"Could not save order. Try again.");button.disabled=false;button.textContent="Place order"}
});
