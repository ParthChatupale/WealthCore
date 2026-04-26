export type TxnType = "income" | "expense";
export type Account = { id: string; name: string; type: "Cash" | "Bank" | "Wallet"; balance: number };
export type Transaction = {
  id: string;
  date: string;
  type: TxnType;
  amount: number;
  account: string;
  category: string;
  description?: string;
};
export type CategoryBudget = { category: string; limit: number; spent: number; color: string };

export const accounts: Account[] = [
  { id: "a1", name: "HDFC Savings", type: "Bank", balance: 184320 },
  { id: "a2", name: "Cash Wallet", type: "Cash", balance: 4250 },
  { id: "a3", name: "Paytm Wallet", type: "Wallet", balance: 12480 },
];

export const transactions: Transaction[] = [
  { id: "t1", date: "2025-04-24", type: "expense", amount: 1240, account: "HDFC Savings", category: "Food", description: "Groceries — BigBasket" },
  { id: "t2", date: "2025-04-23", type: "income",  amount: 85000, account: "HDFC Savings", category: "Salary", description: "April salary" },
  { id: "t3", date: "2025-04-22", type: "expense", amount: 3200, account: "HDFC Savings", category: "Travel", description: "Uber + Metro" },
  { id: "t4", date: "2025-04-21", type: "expense", amount: 599,  account: "Paytm Wallet", category: "Entertainment", description: "Netflix" },
  { id: "t5", date: "2025-04-20", type: "expense", amount: 2150, account: "HDFC Savings", category: "Bills", description: "Electricity" },
  { id: "t6", date: "2025-04-19", type: "expense", amount: 4800, account: "HDFC Savings", category: "Shopping", description: "Zara" },
  { id: "t7", date: "2025-04-18", type: "expense", amount: 720,  account: "Cash Wallet", category: "Food", description: "Dinner" },
  { id: "t8", date: "2025-04-17", type: "income",  amount: 6000, account: "Paytm Wallet", category: "Freelance", description: "Logo project" },
  { id: "t9", date: "2025-04-15", type: "expense", amount: 1800, account: "HDFC Savings", category: "Food", description: "Restaurant" },
  { id: "t10", date: "2025-04-12", type: "expense", amount: 950, account: "Cash Wallet", category: "Travel", description: "Cab" },
];

export const budgets: CategoryBudget[] = [
  { category: "Food",          limit: 8000,  spent: 6420, color: "var(--amber)" },
  { category: "Travel",        limit: 6000,  spent: 5870, color: "var(--cyan)" },
  { category: "Bills",         limit: 5000,  spent: 2150, color: "var(--primary)" },
  { category: "Shopping",      limit: 6000,  spent: 7200, color: "var(--rose)" },
  { category: "Entertainment", limit: 2000,  spent: 1199, color: "var(--violet)" },
];

export const monthlyTotalBudget = 32000;

export const cashFlow = [
  { day: "Wk 1", income: 21000, expense: 7200 },
  { day: "Wk 2", income: 6000,  expense: 9500 },
  { day: "Wk 3", income: 0,     expense: 6800 },
  { day: "Wk 4", income: 64000, expense: 4200 },
];

export const trend = [
  { month: "Nov", income: 78000, expense: 41200, savings: 36800 },
  { month: "Dec", income: 82000, expense: 52400, savings: 29600 },
  { month: "Jan", income: 86000, expense: 39800, savings: 46200 },
  { month: "Feb", income: 80000, expense: 44100, savings: 35900 },
  { month: "Mar", income: 88000, expense: 47600, savings: 40400 },
  { month: "Apr", income: 91000, expense: 27700, savings: 63300 },
];

export const insights = [
  { tone: "warn", text: "Food budget is 80% used — 6 days remaining" },
  { tone: "info", text: "Travel spending up 18% vs last month" },
  { tone: "alert", text: "Shopping is over budget by ₹1,200" },
];

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
