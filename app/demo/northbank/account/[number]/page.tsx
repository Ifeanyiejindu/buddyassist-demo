import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchNorthbankAccount,
  fetchNorthbankStatement,
  fetchNorthbankTransactions,
} from "@/lib/demoApi";

/**
 * Northbank account detail page.
 *
 * Reached from the sidebar account list. Shows the account header,
 * the full categorised statement (income / spending / net + per-
 * category breakdown), and the complete transaction list — all from
 * the live Northbank API. No hardcoded numbers anywhere.
 */
interface PageProps {
  params: Promise<{ number: string }>;
}

function money(n: number): string {
  const abs = Math.abs(n);
  const f = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `−$${f}` : `$${f}`;
}

export default async function NorthbankAccountPage({ params }: PageProps) {
  const { number } = await params;

  const account = await fetchNorthbankAccount(number);
  if (!account) return notFound();

  const [transactions, statement] = await Promise.all([
    fetchNorthbankTransactions(number),
    fetchNorthbankStatement(number),
  ]);

  // Sort newest-first for the table.
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Build the per-category rows for the statement summary.
  const categories = statement
    ? Object.entries(statement.byCategory)
        .filter(([k]) => k !== "income")
        .map(([k, v]) => ({ k, v: Math.abs(v) }))
        .sort((a, b) => b.v - a.v)
    : [];
  const maxCat = categories[0]?.v || 1;

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#F4F6FA",
        color: "#0A1628",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      <header className="px-6 sm:px-10 py-4 border-b border-[#DCE2EB] bg-white flex items-center gap-4">
        <Link
          href="/demo/northbank"
          className="text-[13px] text-[#5C6878] no-underline hover:text-[#0A1628] inline-flex items-center gap-1.5"
        >
          ← Northbank
        </Link>
        <span className="text-[12px] text-[#5C6878]">/</span>
        <span className="text-[13px] text-[#0A1628] capitalize">{account.type}</span>
        <span className="text-[12px] text-[#5C6878]">/</span>
        <span className="text-[13px] text-[#0A1628]" style={{ fontFamily: "var(--font-mono), monospace" }}>
          {account.accountNumber}
        </span>
      </header>

      {/* Account hero */}
      <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pt-10 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <div className="text-[11.5px] tracking-[0.14em] uppercase text-[#5C6878]">
            {account.type} account · {account.currency}
          </div>
          <div
            className="font-semibold text-[44px] mt-1.5 -tracking-[0.02em]"
            style={{ fontFamily: "var(--font-geist), sans-serif" }}
          >
            {money(account.balance)}
          </div>
          <div className="text-[13px] text-[#5C6878] mt-1.5">
            Account {account.accountNumber} ·{" "}
            <span className={account.status === "active" ? "text-[#1F8A5B]" : "text-[#C2453D]"}>
              {account.status}
            </span>
            {account.dailyTransferLimit && (
              <>
                {" · "}Daily transfer limit{" "}
                <b className="text-[#0A1628]">{money(account.dailyTransferLimit)}</b>
              </>
            )}
          </div>
        </div>

        {/* Statement summary card */}
        {statement && (
          <aside className="bg-white border border-[#DCE2EB] rounded-[12px] p-5">
            <h3 className="m-0 mb-3 font-semibold text-sm" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
              This {statement.month === "all" ? "period" : statement.month}
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#5C6878]">Income</div>
                <div className="font-semibold text-[15px] text-[#1F8A5B] mt-1" style={{ fontFamily: "var(--font-mono), monospace" }}>
                  {money(statement.totalIncome)}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#5C6878]">Spend</div>
                <div className="font-semibold text-[15px] text-[#C2453D] mt-1" style={{ fontFamily: "var(--font-mono), monospace" }}>
                  {money(statement.totalSpending)}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#5C6878]">Net</div>
                <div
                  className="font-semibold text-[15px] mt-1"
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    color: statement.net >= 0 ? "#1F8A5B" : "#C2453D",
                  }}
                >
                  {money(statement.net)}
                </div>
              </div>
            </div>
            <div className="text-[11.5px] text-[#5C6878] mt-3 text-center">
              {statement.transactionCount} transactions
            </div>
          </aside>
        )}
      </section>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-8">
          <h2 className="m-0 mb-3 font-semibold text-[16px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
            Where it went
          </h2>
          <div className="bg-white border border-[#DCE2EB] rounded-[12px] p-5">
            <div className="flex flex-col gap-3">
              {categories.map((c) => (
                <div key={c.k}>
                  <div className="flex justify-between text-[13px] mb-1.5">
                    <span className="capitalize">{c.k}</span>
                    <span style={{ fontFamily: "var(--font-mono), monospace" }}>−{money(c.v).replace("−", "")}</span>
                  </div>
                  <div className="h-2 rounded overflow-hidden" style={{ background: "#F4F6FA" }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.round((c.v / maxCat) * 100)}%`,
                        background: "#0E2A47",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Full transaction list */}
      <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-16">
        <h2 className="m-0 mb-3 font-semibold text-[16px]" style={{ fontFamily: "var(--font-geist), sans-serif" }}>
          Transactions
        </h2>
        <div className="bg-white border border-[#DCE2EB] rounded-[12px] overflow-hidden">
          {sorted.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[#5C6878]">
              No transactions on this account yet.
            </div>
          ) : (
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-[0.1em] text-[#5C6878] bg-[#F4F6FA]">
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Merchant</th>
                  <th className="py-2.5 px-4 font-medium">Category</th>
                  <th className="py-2.5 px-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t, i) => (
                  <tr key={t.txnId} className={i < sorted.length - 1 ? "border-b border-[#DCE2EB]" : ""}>
                    <td className="py-2.5 px-4 text-[#5C6878]" style={{ fontFamily: "var(--font-mono), monospace" }}>
                      {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium">{t.merchant}</div>
                      <div className="text-[11.5px] text-[#5C6878]">{t.description}</div>
                    </td>
                    <td className="py-2.5 px-4 text-[#5C6878] capitalize">{t.category}</td>
                    <td
                      className={`py-2.5 px-4 text-right font-medium ${t.amount > 0 ? "text-[#1F8A5B]" : ""}`}
                      style={{ fontFamily: "var(--font-mono), monospace" }}
                    >
                      {t.amount > 0 ? "+" : ""}
                      {money(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
