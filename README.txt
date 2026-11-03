# MAU GAME SHOP — Website files

A mobile-friendly static storefront for Mauritius. It uses HTML, CSS and vanilla JavaScript. No paid software or build tools are required.

## Files
- `index.html` — website structure and content
- `style.css` — black / electric-blue / purple responsive design
- `script.js` — product display, filters, cart and WhatsApp order message
- `products.json` — editable product catalogue
- `store-config.json` — editable WhatsApp and payment details

## 1. Set up your contact and payment details
Open `store-config.json` in a text editor and replace:
- `whatsappNumber`: your WhatsApp number with country code, digits only. Mauritius example format: `2305XXXXXXX` (replace with your real number).
- `contactEmail`: your business email.
- `juiceNumber` and `juiceName`: your verified MCB Juice details.
- `accountName` and `accountNumber`: your verified MCB bank details.
- Facebook and Instagram links: your real business page links.

Do not publish the website until these are correct. Never put a card CVV, PIN, password or private login credentials in this file.

## 2. Edit products and prices
Open `products.json`. Each product has:
- `id`: unique short ID (do not duplicate)
- `name`: product name
- `category`: category name
- `price`: number in MUR, or `null` when you want customers to request a quote
- `priceLabel`: text shown on the product card
- `description`: product details
- `badge`: small label
- `image`: image URL

For products with a fixed price, set both `price` and `priceLabel`. Example:
`"price": 450, "priceLabel": "Rs450"`

For quote-only products, keep `"price": null` and use `"priceLabel": "Request price"`.

The sample game top-up and console product entries are quote-only because supplier cost, region, stock and availability must be checked before you advertise a final price. The listed digital design prices are suggested launch prices and can be changed.

## 3. Test on your computer
Because the site loads JSON files, test it through a local web server rather than opening `index.html` directly:
1. Put all files in one folder.
2. Open a terminal in that folder.
3. Run `python -m http.server 8000`.
4. Visit `http://localhost:8000`.

You can also use VS Code with the Live Server extension.

## 4. Free hosting
### GitHub Pages
1. Create a free account at https://github.com/
2. Create a new public repository, for example `mau-game-shop`.
3. Upload `index.html`, `style.css`, `script.js`, `products.json`, and `store-config.json` to the repository root.
4. Open the repository Settings → Pages.
5. Under Build and deployment, choose Deploy from a branch, select `main` and `/ (root)`, then Save.
6. Wait for GitHub Pages to publish your site. Your address will look like `https://YOUR-USERNAME.github.io/mau-game-shop/`.

### Netlify
1. Create a free account at https://www.netlify.com/
2. Choose Add new site → Deploy manually.
3. Drag the website folder (or a ZIP containing the five site files) into the deploy area.
4. Netlify will provide a public preview URL. You can change the site name in site settings.

Free plan limits and terms can change. A custom domain is optional and usually costs extra.

## 5. Important shop-owner checks before launch
- Replace all contact and payment placeholders.
- Confirm every supplier, price, region and delivery time before taking payment.
- Make a clear refund / cancellation policy and privacy notice.
- For gift cards and subscriptions, check account region compatibility and platform terms.
- Do not request or store customer passwords, card CVVs or account recovery codes.
- Use a legitimate payment gateway for online card checkout. This starter site does not collect card details or process payments online.
- Add your business registration and tax details as required in Mauritius.
- Use images you own or have permission to use. Replace sample remote image URLs with your own product photos where possible.

## 6. How orders work
Customers add products to the cart and press “Send order on WhatsApp”. The website opens WhatsApp with the order list and known-price subtotal. Quote-only items are marked for confirmation. You confirm stock, final price, delivery and payment with the customer manually.
