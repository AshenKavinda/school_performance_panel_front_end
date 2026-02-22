/**
 * paymentService.js
 * Covers: Payments (/api/payments) — packages handled in managementService.
 */
import api from './api';

export const getPayments                    = ()                   => api.get('/api/payments').then(r => r.data);
export const getPayment                     = (id)                 => api.get(`/api/payments/${id}`).then(r => r.data);
export const getPaymentsByAppAdmin          = (appAdminId)         => api.get(`/api/payments/application-admin/${appAdminId}`).then(r => r.data);
export const createPayment                  = (dto)                => api.post('/api/payments', dto).then(r => r.data);

// Subscription status
export const getSubscriptionStatus          = (appAdminId)         => api.get(`/api/payments/subscription-status/${appAdminId}`).then(r => r.data);
export const getMySubscription              = ()                   => api.get('/api/payments/my-subscription').then(r => r.data);
export const checkMySubscription            = ()                   => api.get('/api/payments/check-my-subscription').then(r => r.data);
export const hasActiveSubscription          = (appAdminId)         => api.get(`/api/payments/has-active-subscription/${appAdminId}`).then(r => r.data);
