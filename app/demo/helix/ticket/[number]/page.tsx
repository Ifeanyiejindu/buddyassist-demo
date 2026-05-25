import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchHelixTicket,
  fetchHelixSla,
  fetchHelixCustomerTickets,
} from "@/lib/demoApi";

/**
 * Helix ticket detail page.
 *
 * Reached from the inbox list. Shows the ticket header (subject,
 * priority, status, tags), an SLA banner with real remaining time,
 * the full message thread, and a "Customer history" rail with the
 * customer's other open tickets — all live data.
 */
interface PageProps {
  params: Promise<{ number: string }>;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function HelixTicketPage({ params }: PageProps) {
  const { number } = await params;

  const ticket = await fetchHelixTicket(number);
  if (!ticket) return notFound();

  const [sla, customerHistory] = await Promise.all([
    fetchHelixSla(number),
    fetchHelixCustomerTickets(ticket.customerEmail),
  ]);

  const otherTickets = (customerHistory.tickets || []).filter(
    (t) => t.number !== ticket.number,
  );

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#F6F7F9",
        color: "#0E1116",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      <header className="px-6 sm:px-10 py-4 border-b border-[#E4E7EC] bg-white flex items-center gap-4">
        <Link
          href="/demo/helix"
          className="text-[13px] text-[#5C6470] no-underline hover:text-[#0E1116] inline-flex items-center gap-1.5"
        >
          ← Helix
        </Link>
        <span className="text-[12px] text-[#5C6470]">/</span>
        <span className="text-[13px] text-[#0E1116]">{ticket.number}</span>
      </header>

      {/* SLA banner */}
      {sla && (
        <div
          className="px-6 sm:px-10 py-2.5 text-[12.5px] font-medium border-b"
          style={{
            background: sla.breached ? "#FEE2E2" : "#ECFDF5",
            color: sla.breached ? "#7F1D1D" : "#065F46",
            borderColor: sla.breached ? "#FCA5A5" : "#A7F3D0",
          }}
        >
          {sla.breached
            ? `⚠ SLA breached ${Math.abs(sla.slaRemainingHours).toFixed(1)}h ago — target ${sla.slaHours}h, ticket age ${sla.ageHours.toFixed(1)}h`
            : `✓ ${sla.slaRemainingHours.toFixed(1)}h remaining on SLA (target ${sla.slaHours}h, ${sla.responded ? "first response sent" : "awaiting first response"})`}
        </div>
      )}

      <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pt-8 pb-12 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Main */}
        <div>
          <div className="flex items-center gap-2 text-[11.5px] uppercase tracking-[0.1em] text-[#5C6470] mb-2">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  ticket.priority === "urgent"
                    ? "#E55C5C"
                    : ticket.priority === "high"
                      ? "#F59E0B"
                      : "#5C6470",
              }}
            />
            <span>{ticket.priority}</span>
            <span>·</span>
            <span>{ticket.status}</span>
            {ticket.team && (
              <>
                <span>·</span>
                <span>{ticket.team}</span>
              </>
            )}
            {ticket.channel && (
              <>
                <span>·</span>
                <span>via {ticket.channel}</span>
              </>
            )}
          </div>
          <h1
            className="font-semibold m-0 leading-tight -tracking-[0.02em]"
            style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "clamp(24px,3.2vw,32px)" }}
          >
            {ticket.subject}
          </h1>
          <div className="text-[13px] text-[#5C6470] mt-1.5">
            From <b className="text-[#0E1116]">{ticket.customerEmail}</b> · opened {fmtTime(ticket.createdAt)}
          </div>
          {ticket.tags && ticket.tags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {ticket.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#0044C9] font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="mt-8 flex flex-col gap-4">
            {(ticket.messages || []).map((m, i) => {
              const isAgent = m.role === "agent";
              return (
                <div
                  key={i}
                  className="max-w-[640px] p-4 rounded-[10px] border text-[14px] leading-[1.55]"
                  style={{
                    alignSelf: isAgent ? "flex-end" : "flex-start",
                    background: isAgent ? "#E8F0FE" : "#fff",
                    borderColor: isAgent ? "#CBDDFB" : "#E4E7EC",
                  }}
                >
                  <div className="text-[11.5px] font-semibold text-[#5C6470] mb-1.5">
                    {m.author} · {fmtTime(m.at)}
                  </div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <div className="bg-white border border-[#E4E7EC] rounded-[12px] p-5">
            <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#5C6470]">
              Customer
            </div>
            <div className="font-semibold text-[15px] mt-1">{customerHistory.customer?.name || ticket.customerEmail}</div>
            <div className="text-[12px] text-[#5C6470] mt-0.5">
              {customerHistory.customer?.company || "—"}
              {customerHistory.customer?.plan && ` · ${customerHistory.customer.plan} plan`}
            </div>
          </div>

          {otherTickets.length > 0 && (
            <div className="bg-white border border-[#E4E7EC] rounded-[12px] p-5">
              <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#5C6470] mb-3">
                Other tickets from this customer
              </div>
              <div className="flex flex-col gap-3">
                {otherTickets.map((t) => (
                  <Link
                    key={t.number}
                    href={`/demo/helix/ticket/${t.number}`}
                    className="block no-underline text-inherit hover:text-[#0044C9]"
                  >
                    <div className="text-[12.5px] font-medium truncate">{t.subject}</div>
                    <div className="text-[11px] text-[#5C6470] mt-0.5">
                      {t.number} · {t.priority} · {t.status}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
