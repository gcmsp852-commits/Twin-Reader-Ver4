const crypto = require('crypto');

const SECP160R1 = {
  p: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFFn,
  a: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFFn - 3n,
  b: 0x1C97BEFC54BD7A8B65ACF89F81D4D4ADC565FA45n,
  Gx: 0x4A96B5688EF573284664698968C38BB913CBFC82n,
  Gy: 0x23A628553168947D59DCC912042351377AC5FB32n,
  n: 0x0100000000000000000001F4C8F927AED3CA752257n
};

function bigMod(a, m) { return ((a % m) + m) % m; }
function modInverse(a, m) {
  a = bigMod(a, m);
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];
  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  return bigMod(old_s, m);
}
function ecAdd(P, Q, curve) {
  if (P === null) return Q;
  if (Q === null) return P;
  const { p } = curve;
  const [x1, y1] = P;
  const [x2, y2] = Q;
  if (x1 === x2) {
    if (bigMod(y1 + y2, p) === 0n) return null;
    const lam = bigMod((3n * x1 * x1 + curve.a) * modInverse(2n * y1, p), p);
    const x3 = bigMod(lam * lam - 2n * x1, p);
    const y3 = bigMod(lam * (x1 - x3) - y1, p);
    return [x3, y3];
  }
  const lam = bigMod((y2 - y1) * modInverse(bigMod(x2 - x1, p), p), p);
  const x3 = bigMod(lam * lam - x1 - x2, p);
  const y3 = bigMod(lam * (x1 - x3) - y1, p);
  return [x3, y3];
}
function ecMul(k, P, curve) {
  let result = null;
  let addend = P;
  k = bigMod(k, curve.n);
  while (k > 0n) {
    if (k & 1n) result = ecAdd(result, addend, curve);
    addend = ecAdd(addend, addend, curve);
    k >>= 1n;
  }
  return result;
}

const keys = [];
const senders = [
  "山田 一郎", "鈴木 二郎", "佐藤 三郎", "高橋 四子", "田中 五郎",
  "伊藤 六子", "渡辺 七郎", "小林 八子", "加藤 九郎", "中村 十郎"
];

for(let i=0; i<10; i++) {
  const privBytes = crypto.randomBytes(20);
  let priv = 0n;
  for(let j=0; j<20; j++) priv = (priv << 8n) | BigInt(privBytes[j]);
  priv = (priv % (SECP160R1.n - 1n)) + 1n; // 1 to n-1
  
  const pub = ecMul(priv, [SECP160R1.Gx, SECP160R1.Gy], SECP160R1);
  keys.push({
    id: i + 1,
    name: senders[i],
    priv: "0x" + priv.toString(16) + "n",
    pubX: "0x" + pub[0].toString(16) + "n",
    pubY: "0x" + pub[1].toString(16) + "n"
  });
}

console.log(JSON.stringify(keys, null, 2));
