// Shared Web Push subscription registry
const subscriptions: Map<string, any> = new Map();

export function getSubscriptions() {
  return subscriptions;
}

export function saveSubscription(key: string, subscription: any) {
  subscriptions.set(key, subscription);
}

