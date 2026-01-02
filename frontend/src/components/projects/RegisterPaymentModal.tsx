// =====================================================
// MODAL PARA REGISTRAR PAGO
// =====================================================

import { useState } from 'react';
import { X, CreditCard, Check, DollarSign } from 'lucide-react';
import { useRegisterPayment, type Payment } from '@/hooks/useProjects';

interface RegisterPaymentModalProps {
  projectId: string;
  payment: Payment;
  onClose: () => void;
  onSuccess: () => void;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export default function RegisterPaymentModal({
  projectId,
  payment,
  onClose,
  onSuccess,
}: RegisterPaymentModalProps) {
  const pendingAmount = payment.expectedAmount - payment.paidAmount;
  
  const [amount, setAmount] = useState(pendingAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  
  const registerPayment = useRegisterPayment();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }
    
    try {
      await registerPayment.mutateAsync({
        projectId,
        phase: payment.phase,
        amount: parsedAmount,
        paymentMethod,
        reference: reference || undefined,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (error) {
      // Error handled by hook
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Registrar Pago</h2>
              <p className="text-sm text-gray-500">{payment.phaseLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Monto esperado:</span>
            <span className="font-medium">{formatCurrency(payment.expectedAmount)}</span>
          </div>
          {payment.paidAmount > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Ya pagado:</span>
              <span className="font-medium text-green-600">{formatCurrency(payment.paidAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Pendiente:</span>
            <span className="font-bold text-orange-600">{formatCurrency(pendingAmount)}</span>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto a registrar *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={pendingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>
          
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de pago *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="Transferencia">Transferencia bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta de crédito/débito</option>
              <option value="Cheque">Cheque</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          
          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referencia / Folio
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Número de transferencia, folio, etc."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre el pago..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            />
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={registerPayment.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {registerPayment.isPending ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
