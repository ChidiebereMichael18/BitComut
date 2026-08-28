import { getCurrentTenant } from "@/lib/tenant-server"
import { requireSession } from "@/app/actions/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { RealTimeProvider } from "@/components/real-time-provider"
import { CurrencyProvider } from "@/components/currency-provider"
import { FinanceProfileProvider } from "@/components/finance-profile-provider"
import { TenantProvider } from "@/components/tenant-provider"
import { PaymentAlert } from "@/components/dashboard/payment-alert"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSession()
  const tenant = await getCurrentTenant()
  const university = {
    name: tenant.name,
    shortName: tenant.shortName,
    address: tenant.address,
    email: tenant.email,
    phone: tenant.phone,
    website: tenant.website,
    currency: tenant.currency,
    defaultCurrency: tenant.defaultCurrency,
    settlementCurrency: tenant.settlementCurrency,
  }
  const accent = tenant.logoColor

  return (
    <TenantProvider tenant={tenant}>
    <CurrencyProvider
      defaultCurrency={university.defaultCurrency}
      settlementCurrency={university.settlementCurrency}
    >
      <RealTimeProvider>
      <FinanceProfileProvider>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="fixed inset-y-0 left-0 w-64">
            <Sidebar university={university} accent={accent} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Header university={university} accent={accent} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
      <PaymentAlert />
      </FinanceProfileProvider>
      </RealTimeProvider>
    </CurrencyProvider>
    </TenantProvider>
  )
}
