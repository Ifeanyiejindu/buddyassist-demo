import {
  fetchNorthbankCustomerAccounts,
  fetchNorthbankStatement,
  fetchNorthbankTransactions,
} from "@/lib/demoApi";
import NorthbankClient from "./NorthbankClient";

/**
 * Northbank demo storefront — server component.
 *
 * Treats Eleanor Vance (NB-C-01) as the "logged-in" customer — she has
 * the richest seeded data (2 accounts + 12 transactions). The page pulls
 * her customer profile, her accounts, recent transactions and statement
 * from the live Northbank API. The sidebar account list, the total
 * balance, the recent transactions table, and the spending breakdown
 * all reflect the SAME real numbers the bot sees through its tools.
 */
const DEMO_CUSTOMER_ID = "NB-C-01";

export default async function NorthbankDemoPage() {
  // 1. Customer + their accounts.
  const { customer, accounts } = await fetchNorthbankCustomerAccounts(DEMO_CUSTOMER_ID);
  const primary =
    accounts.find((a) => a.type === "checking") || accounts[0] || null;

  // 2. Recent transactions + statement for the primary account (parallel).
  const [transactions, statement] = primary
    ? await Promise.all([
        fetchNorthbankTransactions(primary.accountNumber),
        fetchNorthbankStatement(primary.accountNumber),
      ])
    : [[], null];

  return (
    <NorthbankClient
      customer={customer}
      accounts={accounts}
      transactions={transactions}
      statement={statement}
    />
  );
}
