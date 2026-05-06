// Central registry of notification rules. To add a new trigger:
//   1. Create `./rules/<name>.rule.js` exporting an object with shape
//      `{ name: string, evaluate(userId): Promise<NotificationItem[]> }`.
//   2. Append it here. No other code changes are required — the service
//      iterates the registry and the frontend renders by `type`.
//
// A NotificationItem looks like:
//   {
//     id: string,         // STABLE id for read-state, e.g. "kind:<entityId>"
//     type: string,       // matches the rule name; UI keys icons/colors off this
//     title: string,
//     body?: string,
//     meta?: Record<string, unknown>,  // forwarded to the client as-is
//     createdAt: Date,
//   }

import { lowBalanceRule } from './rules/low-balance.rule.js';
import { overdueTrialRule } from './rules/overdue-trial.rule.js';

export const notificationRules = [lowBalanceRule, overdueTrialRule];
