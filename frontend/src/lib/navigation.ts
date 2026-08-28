import {
  LayoutDashboard,
  CreditCard,
  Users,
  FileText,
  ArrowLeftRight,
  ReceiptText,
  Settings,
  Landmark,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const mainNav: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { title: "Students", href: "/dashboard/students", icon: Users },
  { title: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { title: "Settlements", href: "/dashboard/settlements", icon: ArrowLeftRight },
  { title: "Withdraw", href: "/dashboard/withdraw", icon: Landmark },
  { title: "Receipts", href: "/dashboard/receipts", icon: ReceiptText },
]

export const secondaryNav: NavItem[] = [
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]
