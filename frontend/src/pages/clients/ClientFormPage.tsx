// =====================================================
// FORMULARIO DE CLIENTE (Crear/Editar)
// =====================================================

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Zap,
} from 'lucide-react';
import { useClient, useCreateClient, useUpdateClient, CreateClientInput } from '@/hooks/useClients';
import { cn } from '@/lib/utils';

const clientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  rfc: z.string().optional(),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  cfeServiceNumber: z.string().optional(),
  cfeTariff: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

const CFE_TARIFFS = [
  { value: '', label: 'Seleccionar tarifa...' },
  // Tarifas domésticas
  { value: 'T1', label: 'Tarifa 1 - Templada' },
  { value: 'T1A', label: 'Tarifa 1A - Mínimo 25°C' },
  { value: 'T1B', label: 'Tarifa 1B - Mínimo 28°C' },
  { value: 'T1C', label: 'Tarifa 1C - Mínimo 30°C' },
  { value: 'T1D', label: 'Tarifa 1D - Mínimo 31°C' },
  { value: 'T1E', label: 'Tarifa 1E - Mínimo 32°C' },
  { value: 'T1F', label: 'Tarifa 1F - Mínimo 33°C' },
  { value: 'DAC', label: 'DAC - Alto Consumo (Sin subsidio)' },
  // Tarifas industriales/comerciales
  { value: 'GDMTO', label: 'GDMTO - Media Tensión Ordinaria (<100kW)' },
  { value: 'GDMTH', label: 'GDMTH - Media Tensión Horaria (≥100kW)' },
];

const SOURCES = [
  { value: '', label: 'Seleccionar origen...' },
  { value: 'Referido', label: 'Referido' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Google', label: 'Google' },
  { value: 'Sitio Web', label: 'Sitio Web' },
  { value: 'Llamada', label: 'Llamada' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Otro', label: 'Otro' },
];

export default function ClientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  // Cargar cliente si estamos editando
  const { data: client, isLoading: isLoadingClient } = useClient(id || '');

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      rfc: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      cfeServiceNumber: '',
      cfeTariff: '',
      notes: '',
      source: '',
    },
  });

  // Cargar datos del cliente al editar
  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.email,
        phone: client.phone,
        rfc: client.rfc || '',
        address: client.address,
        city: client.city,
        state: client.state || '',
        postalCode: client.postalCode || '',
        cfeServiceNumber: client.cfeServiceNumber || '',
        cfeTariff: client.cfeTariff || '',
        notes: client.notes || '',
        source: client.source || '',
      });
    }
  }, [client, reset]);

  const onSubmit = async (data: ClientFormData) => {
    const clientData: CreateClientInput = {
      ...data,
      rfc: data.rfc || undefined,
      state: data.state || undefined,
      postalCode: data.postalCode || undefined,
      cfeServiceNumber: data.cfeServiceNumber || undefined,
      cfeTariff: data.cfeTariff || undefined,
      notes: data.notes || undefined,
      source: data.source || undefined,
    };

    try {
      if (isEditing && id) {
        await updateClient.mutateAsync({ id, data: clientData });
        navigate(`/clients/${id}`);
      } else {
        const newClient = await createClient.mutateAsync(clientData);
        navigate(`/clients/${newClient?.id}`);
      }
    } catch {
      // Error ya manejado en el hook
    }
  };

  if (isEditing && isLoadingClient) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Modifica los datos del cliente' : 'Ingresa los datos del nuevo cliente'}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos personales */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Datos Personales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Nombre completo *</label>
              <input
                {...register('name')}
                type="text"
                className={cn('form-input', errors.name && 'border-red-500')}
                placeholder="Juan Pérez García"
              />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div>
              <label className="form-label">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  className={cn('form-input pl-10', errors.email && 'border-red-500')}
                  placeholder="cliente@email.com"
                />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Teléfono *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('phone')}
                  type="tel"
                  className={cn('form-input pl-10', errors.phone && 'border-red-500')}
                  placeholder="+52 33 1234 5678"
                />
              </div>
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="form-label">RFC (opcional)</label>
              <input
                {...register('rfc')}
                type="text"
                className="form-input"
                placeholder="PEGJ850101ABC"
              />
            </div>

            <div>
              <label className="form-label">Origen del cliente</label>
              <select {...register('source')} className="form-input">
                {SOURCES.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-secondary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Dirección</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Dirección *</label>
              <input
                {...register('address')}
                type="text"
                className={cn('form-input', errors.address && 'border-red-500')}
                placeholder="Av. Principal 123, Col. Centro"
              />
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>

            <div>
              <label className="form-label">Ciudad *</label>
              <input
                {...register('city')}
                type="text"
                className={cn('form-input', errors.city && 'border-red-500')}
                placeholder="Guadalajara"
              />
              {errors.city && <p className="form-error">{errors.city.message}</p>}
            </div>

            <div>
              <label className="form-label">Estado</label>
              <input
                {...register('state')}
                type="text"
                className="form-input"
                placeholder="Jalisco"
              />
            </div>

            <div>
              <label className="form-label">Código Postal</label>
              <input
                {...register('postalCode')}
                type="text"
                className="form-input"
                placeholder="44100"
                maxLength={5}
              />
            </div>
          </div>
        </div>

        {/* Datos CFE */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Datos CFE</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Número de Servicio CFE</label>
              <input
                {...register('cfeServiceNumber')}
                type="text"
                className="form-input"
                placeholder="123456789012"
              />
            </div>

            <div>
              <label className="form-label">Tarifa CFE</label>
              <select {...register('cfeTariff')} className="form-input">
                {CFE_TARIFFS.map((tariff) => (
                  <option key={tariff.value} value={tariff.value}>
                    {tariff.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
          </div>

          <div>
            <label className="form-label">Notas adicionales</label>
            <textarea
              {...register('notes')}
              rows={4}
              className="form-input"
              placeholder="Cualquier información adicional sobre el cliente..."
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createClient.isPending || updateClient.isPending}
            className="btn-primary inline-flex items-center gap-2"
          >
            {(isSubmitting || createClient.isPending || updateClient.isPending) ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
