import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { shopsService } from '@/services';
import { Button, Input } from '@/components/ui';

const createShopSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CreateShopForm = z.infer<typeof createShopSchema>;

interface CreateShopModalProps {
  onClose: () => void;
}

export function CreateShopModal({ onClose }: CreateShopModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateShopForm>({
    resolver: zodResolver(createShopSchema),
  });

  const createMutation = useMutation({
    mutationFn: shopsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      onClose();
    },
  });

  const onSubmit = (data: CreateShopForm) => {
    createMutation.mutate({
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Create Shop</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input
            label="Shop Name *"
            placeholder="Enter shop name"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="contact@shop.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Phone"
            placeholder="+1 555-123-4567"
            {...register('phone')}
          />

          <Input
            label="Address"
            placeholder="123 Main Street"
            {...register('address')}
          />

          {createMutation.isError && (
            <p className="text-sm text-red-600">Failed to create shop. Please try again.</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Shop
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
