// =====================================================
// MODAL DE ENVÍO - Email y WhatsApp
// =====================================================

import { useState } from 'react';
import {
  X,
  Mail,
  MessageCircle,
  Send,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Paperclip,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: {
    id: string;
    quoteNumber: string;
    systemSize: number;
    salePrice: number;
    client?: {
      name: string;
      email: string;
      phone?: string;
    };
  };
}

type TabType = 'email';

export default function SendModal({ isOpen, onClose, quotation }: SendModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('email');
  const [isSending, setIsSending] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { token } = useAuthStore();
  
  // Estado del formulario de email
  const [emailForm, setEmailForm] = useState({
    recipientEmail: quotation.client?.email || '',
    customMessage: '',
    attachPDF: true,
  });
  
  // Estado del formulario de WhatsApp
  const [whatsappForm, setWhatsappForm] = useState({
    customMessage: '',
    useWebVersion: true, // Por defecto usar WhatsApp Web
  });
  
  if (!isOpen) return null;
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  // Enviar por email
  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`${API_URL}/quotations/${quotation.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: emailForm.recipientEmail,
          customMessage: emailForm.customMessage || undefined,
          attachPDF: emailForm.attachPDF,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al enviar email');
      }
      
      toast.success('Email enviado exitosamente');
      
      // Mostrar URL de preview si está disponible (Ethereal en dev)
      if (data.data?.previewUrl) {
        toast.success(
          <div>
            <p>Email de prueba enviado</p>
            <a
              href={data.data.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              Ver email →
            </a>
          </div>,
          { duration: 10000 }
        );
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Error al enviar email');
    } finally {
      setIsSending(false);
    }
  };
  
  // Abrir WhatsApp
  const handleOpenWhatsApp = async () => {
    setIsSending(true);
    try {
      const params = new URLSearchParams();
      if (whatsappForm.customMessage) {
        params.append('customMessage', whatsappForm.customMessage);
      }
      if (whatsappForm.useWebVersion) {
        params.append('useWebVersion', 'true');
      }
      
      const response = await fetch(
        `${API_URL}/quotations/${quotation.id}/whatsapp?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al generar enlace');
      }
      
      // Abrir WhatsApp
      window.open(data.data.url, '_blank');
      toast.success('Abriendo WhatsApp...');
      onClose();
    } catch (error: any) {
      console.error('Error opening WhatsApp:', error);
      toast.error(error.message || 'Error al abrir WhatsApp');
    } finally {
      setIsSending(false);
    }
  };
  
  // Copiar texto de WhatsApp
  const handleCopyWhatsAppText = async () => {
    try {
      const response = await fetch(
        `${API_URL}/quotations/${quotation.id}/whatsapp/text`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al obtener texto');
      }
      
      await navigator.clipboard.writeText(data.data.text);
      setIsCopied(true);
      toast.success('Texto copiado al portapapeles');
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error: any) {
      console.error('Error copying text:', error);
      toast.error(error.message || 'Error al copiar texto');
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Enviar Cotización
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {quotation.quoteNumber} • Sistema de {quotation.systemSize} kWp
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('email')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
              )}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {activeTab === 'email' && (
              <div className="space-y-4">
                {/* Destinatario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatario
                  </label>
                  <input
                    type="email"
                    value={emailForm.recipientEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="input"
                  />
                  {quotation.client?.email && emailForm.recipientEmail !== quotation.client.email && (
                    <button
                      onClick={() => setEmailForm({ ...emailForm, recipientEmail: quotation.client!.email })}
                      className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                    >
                      Usar email del cliente: {quotation.client.email}
                    </button>
                  )}
                </div>
                
                {/* Mensaje personalizado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje personalizado (opcional)
                  </label>
                  <textarea
                    value={emailForm.customMessage}
                    onChange={(e) => setEmailForm({ ...emailForm, customMessage: e.target.value })}
                    placeholder="Agrega un mensaje personal para el cliente..."
                    rows={3}
                    className="input resize-none"
                  />
                </div>
                
                {/* Adjuntar PDF */}
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={emailForm.attachPDF}
                    onChange={(e) => setEmailForm({ ...emailForm, attachPDF: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Adjuntar PDF de la cotización</span>
                </label>
                
                {/* Botón enviar */}
                <button
                  onClick={handleSendEmail}
                  disabled={isSending || !emailForm.recipientEmail}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Email
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
