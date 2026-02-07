// economy.js - コインシステム

let coins = 0;
let listeners = [];

export function getCoins() { return coins; }

export function addCoins(amount) {
  coins += amount;
  notifyListeners();
  return coins;
}

export function spendCoins(amount) {
  if (coins >= amount) {
    coins -= amount;
    notifyListeners();
    return true;
  }
  return false;
}

export function resetCoins() {
  coins = 0;
  notifyListeners();
}

export function onCoinsChange(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

function notifyListeners() {
  listeners.forEach(fn => fn(coins));
}
