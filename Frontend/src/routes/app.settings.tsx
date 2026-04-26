import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — Finance Manager" }, { name: "description", content: "Account and preferences." }] }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile, preferences, and security.</p>
      </div>

      <Section title="Profile">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name" defaultValue="Aanya Sharma" />
          <Field label="Email" type="email" defaultValue="aanya@example.com" />
        </div>
      </Section>

      <Section title="Regional">
        <div className="grid md:grid-cols-2 gap-4">
          <Select label="Country" options={["India","United States","United Kingdom","Germany","Japan"]} />
          <Select label="Currency" options={["INR (₹)","USD ($)","EUR (€)","GBP (£)","JPY (¥)"]} />
        </div>
      </Section>

      <Section title="Preferences">
        <Select label="Default account" options={["HDFC Savings","Cash Wallet","Paytm Wallet"]} />
      </Section>

      <Section title="Security">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Current password" type="password" placeholder="••••••••" />
          <Field label="New password" type="password" placeholder="••••••••" />
        </div>
      </Section>

      <div className="flex justify-end">
        <button className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium glow-ring">Save changes</button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-6 card-elevated">
      <h3 className="text-lg mb-4">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <input {...props} className="mt-1.5 w-full bg-input/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition" />
    </label>
  );
}
function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <select className="mt-1.5 w-full bg-input/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition">
        {options.map((o) => <option key={o} className="bg-card">{o}</option>)}
      </select>
    </label>
  );
}
