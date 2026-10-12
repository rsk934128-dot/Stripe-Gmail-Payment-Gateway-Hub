export interface VirtualCardDetails {
  id: string;
  cardholderName: string;
  cardNumber: string; // e.g. "4532 8921 7384 9201"
  rawCardNumber: string; // "4532892173849201"
  expiryDate: string; // "09/29"
  cvv: string; // "842"
  network: 'visa' | 'mastercard';
  balanceUsd: number; // e.g. 250.00
  exchangeRateBdt: number; // e.g. 122.50 BDT per USD
  isFrozen: boolean;
  spendingLimitMonthly: number;
  spentThisMonth: number;
  billingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
}

export interface CardTransaction {
  id: string;
  merchant: string;
  platformCategory: 'bkash' | 'nagad' | 'international_gateway' | 'meta_google' | 'ecommerce' | 'other';
  referenceNo: string;
  amountUsd: number;
  amountBdt: number;
  type: 'debit' | 'topup';
  status: 'approved' | 'declined';
  declineReason?: string;
  authCode: string;
  timestamp: string;
  remainingBalanceUsd: number;
}

const STORAGE_KEY_CARD = 'stripe_hub_virtual_card_data_v1';
const STORAGE_KEY_TX = 'stripe_hub_virtual_card_txs_v1';

export const DEFAULT_EXCHANGE_RATE = 122.50; // 1 USD = 122.50 BDT

export const INITIAL_CARD: VirtualCardDetails = {
  id: 'card_iss_928194',
  cardholderName: 'RUBEL BANK USER',
  cardNumber: '4532 8921 7384 9201',
  rawCardNumber: '4532892173849201',
  expiryDate: '09/29',
  cvv: '842',
  network: 'visa',
  balanceUsd: 250.00,
  exchangeRateBdt: DEFAULT_EXCHANGE_RATE,
  isFrozen: false,
  spendingLimitMonthly: 2000.00,
  spentThisMonth: 38.50,
  billingAddress: {
    street: 'Gulshan-2, Road 71, House 12',
    city: 'Dhaka',
    postalCode: '1212',
    country: 'Bangladesh',
  },
  createdAt: new Date().toISOString(),
};

export const INITIAL_TRANSACTIONS: CardTransaction[] = [
  {
    id: 'tx_bkash_83910',
    merchant: 'bKash Card-to-Wallet Add Money',
    platformCategory: 'bkash',
    referenceNo: 'BKASH-ADD-01829',
    amountUsd: 10.00,
    amountBdt: 1225.00,
    type: 'debit',
    status: 'approved',
    authCode: 'AUTH-948123',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    remainingBalanceUsd: 250.00,
  },
  {
    id: 'tx_meta_83909',
    merchant: 'Meta Ads Manager (Facebook)',
    platformCategory: 'meta_google',
    referenceNo: 'FB-ADS-INV-99',
    amountUsd: 28.50,
    amountBdt: 3491.25,
    type: 'debit',
    status: 'approved',
    authCode: 'AUTH-192841',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    remainingBalanceUsd: 260.00,
  },
  {
    id: 'tx_topup_83908',
    merchant: 'Stripe Gateway Wallet Top-up',
    platformCategory: 'international_gateway',
    referenceNo: 'STRIPE-TOPUP-100',
    amountUsd: 100.00,
    amountBdt: 12250.00,
    type: 'topup',
    status: 'approved',
    authCode: 'TOPUP-OK',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    remainingBalanceUsd: 288.50,
  },
];

export function getVirtualCard(): VirtualCardDetails {
  if (typeof window === 'undefined') return INITIAL_CARD;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CARD);
    if (!raw) {
      saveVirtualCard(INITIAL_CARD);
      return INITIAL_CARD;
    }
    return JSON.parse(raw);
  } catch (_e) {
    return INITIAL_CARD;
  }
}

export function saveVirtualCard(card: VirtualCardDetails): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CARD, JSON.stringify(card));
  } catch (err) {
    console.warn('Failed to save virtual card:', err);
  }
}

export function getCardTransactions(): CardTransaction[] {
  if (typeof window === 'undefined') return INITIAL_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TX);
    if (!raw) {
      saveCardTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (_e) {
    return INITIAL_TRANSACTIONS;
  }
}

export function saveCardTransactions(txs: CardTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(txs));
  } catch (err) {
    console.warn('Failed to save card transactions:', err);
  }
}

export function topupCardBalance(amountUsd: number, description: string = 'Stripe Top-up'): { card: VirtualCardDetails; tx: CardTransaction } {
  const card = getVirtualCard();
  const txs = getCardTransactions();

  const newBalance = Math.round((card.balanceUsd + amountUsd) * 100) / 100;
  const updatedCard: VirtualCardDetails = {
    ...card,
    balanceUsd: newBalance,
  };

  const newTx: CardTransaction = {
    id: 'tx_topup_' + Math.random().toString(36).substring(2, 9),
    merchant: description,
    platformCategory: 'international_gateway',
    referenceNo: 'REF-TOPUP-' + Date.now().toString().slice(-6),
    amountUsd,
    amountBdt: Math.round(amountUsd * card.exchangeRateBdt),
    type: 'topup',
    status: 'approved',
    authCode: 'TOPUP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    timestamp: new Date().toISOString(),
    remainingBalanceUsd: newBalance,
  };

  saveVirtualCard(updatedCard);
  saveCardTransactions([newTx, ...txs]);

  return { card: updatedCard, tx: newTx };
}

export function toggleCardFreeze(): VirtualCardDetails {
  const card = getVirtualCard();
  const updated: VirtualCardDetails = {
    ...card,
    isFrozen: !card.isFrozen,
  };
  saveVirtualCard(updated);
  return updated;
}

export function generateNewVirtualCard(network: 'visa' | 'mastercard' = 'visa', cardholderName?: string): VirtualCardDetails {
  const prefix = network === 'visa' ? '4532' : '5412';
  const mid1 = Math.floor(1000 + Math.random() * 9000).toString();
  const mid2 = Math.floor(1000 + Math.random() * 9000).toString();
  const end = Math.floor(1000 + Math.random() * 9000).toString();

  const rawCardNumber = `${prefix}${mid1}${mid2}${end}`;
  const cardNumber = `${prefix} ${mid1} ${mid2} ${end}`;
  const cvv = Math.floor(100 + Math.random() * 900).toString();

  const expYear = (new Date().getFullYear() % 100) + 4;
  const expMonth = ('0' + (Math.floor(Math.random() * 12) + 1)).slice(-2);
  const expiryDate = `${expMonth}/${expYear}`;

  const current = getVirtualCard();

  const newCard: VirtualCardDetails = {
    id: 'card_iss_' + Math.random().toString(36).substring(2, 9),
    cardholderName: (cardholderName || current.cardholderName || 'RUBEL BANK USER').toUpperCase(),
    cardNumber,
    rawCardNumber,
    expiryDate,
    cvv,
    network,
    balanceUsd: current.balanceUsd,
    exchangeRateBdt: current.exchangeRateBdt,
    isFrozen: false,
    spendingLimitMonthly: current.spendingLimitMonthly,
    spentThisMonth: 0,
    billingAddress: current.billingAddress,
    createdAt: new Date().toISOString(),
  };

  saveVirtualCard(newCard);
  return newCard;
}

/**
 * Process authorization deduction against virtual card
 * Validates balance, active state, and card numbers
 */
export function authorizeCardPayment(params: {
  amountUsd?: number;
  amountBdt?: number;
  merchant: string;
  platformCategory: CardTransaction['platformCategory'];
  referenceNo?: string;
  providedCardNumber?: string;
  providedCvv?: string;
}): {
  success: boolean;
  message: string;
  transaction: CardTransaction;
  updatedCard: VirtualCardDetails;
} {
  const card = getVirtualCard();
  const txs = getCardTransactions();

  // Compute amount in USD
  let amountUsd = params.amountUsd || 0;
  let amountBdt = params.amountBdt || 0;

  if (!amountUsd && amountBdt) {
    amountUsd = Math.round((amountBdt / card.exchangeRateBdt) * 100) / 100;
  } else if (amountUsd && !amountBdt) {
    amountBdt = Math.round(amountUsd * card.exchangeRateBdt);
  }

  const txId = 'tx_' + Math.random().toString(36).substring(2, 10);
  const ref = params.referenceNo || `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Check 1: Is card frozen?
  if (card.isFrozen) {
    const failedTx: CardTransaction = {
      id: txId,
      merchant: params.merchant,
      platformCategory: params.platformCategory,
      referenceNo: ref,
      amountUsd,
      amountBdt,
      type: 'debit',
      status: 'declined',
      declineReason: 'Card is frozen / locked by user. (card_frozen)',
      authCode: 'DECLINED_FROZEN',
      timestamp: new Date().toISOString(),
      remainingBalanceUsd: card.balanceUsd,
    };
    saveCardTransactions([failedTx, ...txs]);
    return {
      success: false,
      message: 'কার্ডটি লক (Frozen) করা রয়েছে। পেমেন্ট অনুমোদন করা যায়নি।',
      transaction: failedTx,
      updatedCard: card,
    };
  }

  // Check 2: Balance check
  if (card.balanceUsd < amountUsd) {
    const failedTx: CardTransaction = {
      id: txId,
      merchant: params.merchant,
      platformCategory: params.platformCategory,
      referenceNo: ref,
      amountUsd,
      amountBdt,
      type: 'debit',
      status: 'declined',
      declineReason: `Insufficient card balance. Available: $${card.balanceUsd.toFixed(2)}, Required: $${amountUsd.toFixed(2)}`,
      authCode: 'DECLINED_INSUFFICIENT_FUNDS',
      timestamp: new Date().toISOString(),
      remainingBalanceUsd: card.balanceUsd,
    };
    saveCardTransactions([failedTx, ...txs]);
    return {
      success: false,
      message: `কার্ডে পর্যাপ্ত ব্যালেন্স নেই। প্রয়োজন: $${amountUsd.toFixed(2)} (৳${amountBdt.toLocaleString()}), বর্তমান ব্যালেন্স: $${card.balanceUsd.toFixed(2)}।`,
      transaction: failedTx,
      updatedCard: card,
    };
  }

  // Check 3: Spending limit check
  if (card.spentThisMonth + amountUsd > card.spendingLimitMonthly) {
    const failedTx: CardTransaction = {
      id: txId,
      merchant: params.merchant,
      platformCategory: params.platformCategory,
      referenceNo: ref,
      amountUsd,
      amountBdt,
      type: 'debit',
      status: 'declined',
      declineReason: 'Monthly spending limit exceeded.',
      authCode: 'DECLINED_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      remainingBalanceUsd: card.balanceUsd,
    };
    saveCardTransactions([failedTx, ...txs]);
    return {
      success: false,
      message: 'মাসিক ব্যয়ের লিমিট অতিক্রম করেছে।',
      transaction: failedTx,
      updatedCard: card,
    };
  }

  // SUCCESS: Deduct money from card
  const newBalance = Math.round((card.balanceUsd - amountUsd) * 100) / 100;
  const newSpent = Math.round((card.spentThisMonth + amountUsd) * 100) / 100;

  const updatedCard: VirtualCardDetails = {
    ...card,
    balanceUsd: newBalance,
    spentThisMonth: newSpent,
  };

  const authCode = 'AUTH-' + Math.floor(100000 + Math.random() * 900000);
  const successTx: CardTransaction = {
    id: txId,
    merchant: params.merchant,
    platformCategory: params.platformCategory,
    referenceNo: ref,
    amountUsd,
    amountBdt,
    type: 'debit',
    status: 'approved',
    authCode,
    timestamp: new Date().toISOString(),
    remainingBalanceUsd: newBalance,
  };

  saveVirtualCard(updatedCard);
  saveCardTransactions([successTx, ...txs]);

  return {
    success: true,
    message: `পেমেন্ট সফল! আপনার কার্ড থেকে $${amountUsd.toFixed(2)} (৳${amountBdt.toLocaleString()}) কেটে নেওয়া হয়েছে।`,
    transaction: successTx,
    updatedCard,
  };
}
