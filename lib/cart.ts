/**
 * cart.ts — localStorage-backed cart for the Acme demo.
 * Dispatches "acme-cart-update" on every mutation so any
 * component can subscribe and stay in sync.
 */

export interface CartItem {
  sku: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const CART_KEY = "acme_cart";
const EVENT = "acme-cart-update";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToCart(
  item: Omit<CartItem, "quantity">,
  qty = 1,
): CartItem[] {
  const cart = getCart();
  const existing = cart.find((c) => c.sku === item.sku);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ ...item, quantity: qty });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(EVENT));
  return cart;
}

export function removeFromCart(sku: string): CartItem[] {
  const cart = getCart().filter((c) => c.sku !== sku);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(EVENT));
  return cart;
}

export function updateQty(sku: string, qty: number): CartItem[] {
  const cart =
    qty <= 0
      ? getCart().filter((c) => c.sku !== sku)
      : getCart().map((c) => (c.sku === sku ? { ...c, quantity: qty } : c));
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(EVENT));
  return cart;
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.quantity, 0);
}

/** Concise summary string to inject into the AI's system prompt. */
export function cartSummaryForAI(cart: CartItem[]): string {
  if (!cart.length) return "The user's cart is currently empty.";
  const lines = cart
    .map(
      (c) =>
        `${c.name} × ${c.quantity} @ $${c.price} each = $${(c.price * c.quantity).toFixed(2)}`,
    )
    .join("; ");
  return `The user's cart has ${cartCount(cart)} item(s): ${lines}. Cart total: $${cartTotal(cart).toFixed(2)}.`;
}
