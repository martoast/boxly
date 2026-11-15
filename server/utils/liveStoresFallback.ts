// The live stores (id, name, site) as GET /live-shopping/stores answered on 2026-11-15 — used ONLY when a message arrives without the
// shopper's chat token (its store list needs one): a pasted link on one of these sites is still that store's product (Bersain 2026-11-15
// pasted an eBay link as his first message, the list was not loaded, and the card said "No podemos comprar en eBay"). The live list wins.
export const LIVE_STORES_FALLBACK: { id: string, name: string, url: string }[] = [
 {
  "id": "adidas",
  "name": "Adidas",
  "url": "https://www.adidas.com/us"
 },
 {
  "id": "alo",
  "name": "Alo Yoga",
  "url": "https://www.aloyoga.com/"
 },
 {
  "id": "amazon",
  "name": "Amazon",
  "url": "https://www.amazon.com/"
 },
 {
  "id": "american-eagle",
  "name": "American Eagle",
  "url": "https://www.ae.com/us/en"
 },
 {
  "id": "athleta",
  "name": "Athleta",
  "url": "https://athleta.gap.com/"
 },
 {
  "id": "banana-republic",
  "name": "Banana Republic",
  "url": "https://bananarepublic.gap.com/"
 },
 {
  "id": "bath-body-works",
  "name": "Bath & Body Works",
  "url": "https://www.bathandbodyworks.com/"
 },
 {
  "id": "best-buy",
  "name": "Best Buy",
  "url": "https://www.bestbuy.com/"
 },
 {
  "id": "coach-outlet",
  "name": "Coach Outlet",
  "url": "https://www.coach.com/shop/outlet"
 },
 {
  "id": "dfyne",
  "name": "DFYNE",
  "url": "https://dfyne.com/"
 },
 {
  "id": "dicks",
  "name": "Dick's Sporting Goods",
  "url": "https://www.dickssportinggoods.com/"
 },
 {
  "id": "ebay",
  "name": "eBay",
  "url": "https://www.ebay.com/"
 },
 {
  "id": "gap",
  "name": "Gap",
  "url": "https://www.gap.com/"
 },
 {
  "id": "gymshark",
  "name": "Gymshark",
  "url": "https://www.gymshark.com/"
 },
 {
  "id": "karl-lagerfeld",
  "name": "Karl Lagerfeld Paris",
  "url": "https://www.karllagerfeldparis.com/"
 },
 {
  "id": "kipling",
  "name": "Kipling",
  "url": "https://us.kipling.com/"
 },
 {
  "id": "lululemon",
  "name": "Lululemon",
  "url": "https://shop.lululemon.com/"
 },
 {
  "id": "michael-kors",
  "name": "Michael Kors",
  "url": "https://www.michaelkors.com/"
 },
 {
  "id": "neiman-marcus",
  "name": "Neiman Marcus",
  "url": "https://www.neimanmarcus.com/"
 },
 {
  "id": "new-balance",
  "name": "New Balance",
  "url": "https://www.newbalance.com/"
 },
 {
  "id": "nike",
  "name": "Nike",
  "url": "https://www.nike.com/"
 },
 {
  "id": "nordstrom",
  "name": "Nordstrom",
  "url": "https://www.nordstrom.com/"
 },
 {
  "id": "nordstrom-rack",
  "name": "Nordstrom Rack",
  "url": "https://www.nordstromrack.com/"
 },
 {
  "id": "old-navy",
  "name": "Old Navy",
  "url": "https://oldnavy.gap.com/"
 },
 {
  "id": "on",
  "name": "On",
  "url": "https://www.on.com/en-us/"
 },
 {
  "id": "owala",
  "name": "Owala",
  "url": "https://www.owalalife.com/"
 },
 {
  "id": "rhode",
  "name": "Rhode",
  "url": "https://www.rhodeskin.com/"
 },
 {
  "id": "sephora",
  "name": "Sephora",
  "url": "https://www.sephora.com/"
 },
 {
  "id": "sprouts",
  "name": "Sprouts Farmers Market",
  "url": "https://shop.sprouts.com/"
 },
 {
  "id": "stanley",
  "name": "Stanley 1913",
  "url": "https://www.stanley1913.com/"
 },
 {
  "id": "target",
  "name": "Target",
  "url": "https://www.target.com/"
 },
 {
  "id": "tjmaxx",
  "name": "TJ Maxx",
  "url": "https://tjmaxx.tjx.com/store/index.jsp"
 },
 {
  "id": "ulta",
  "name": "Ulta Beauty",
  "url": "https://www.ulta.com/"
 },
 {
  "id": "victorias-secret",
  "name": "Victoria's Secret",
  "url": "https://www.victoriassecret.com/"
 },
 {
  "id": "walmart",
  "name": "Walmart",
  "url": "https://www.walmart.com/"
 },
 {
  "id": "youngla",
  "name": "YoungLA",
  "url": "https://www.youngla.com/"
 }
]
