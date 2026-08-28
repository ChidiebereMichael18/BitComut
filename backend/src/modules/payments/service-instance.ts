import { settlementProvider } from '../../lib/settlement/provider-instance';
import type { SettlementProvider } from '../../lib/settlement/settlement-provider';
import { PaymentService } from './payments.service';

export function createPaymentService(
  provider: SettlementProvider = settlementProvider,
): PaymentService {
  return new PaymentService(provider);
}

/** App-wide singleton PaymentService (used by routes, webhooks, workers). */
export const paymentService = createPaymentService();
