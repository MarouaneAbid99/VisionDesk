import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, CheckCircle } from 'lucide-react';
import { settingsService } from '@/services';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  LoadingPage,
} from '@/components/ui';
import { useState } from 'react';

const settingsSchema = z.object({
  platformName: z.string().min(1, 'Platform name is required'),
  defaultTimezone: z.string().min(1, 'Timezone is required'),
  defaultCurrency: z.string().min(1, 'Currency is required'),
  maintenanceMode: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.get,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: settings,
  });

  const updateMutation = useMutation({
    mutationFn: settingsService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Settings"
        description="Configure platform-wide settings"
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Platform Settings</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Platform Name"
                placeholder="VisionDesk"
                error={errors.platformName?.message}
                {...register('platformName')}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Default Timezone
                  </label>
                  <select
                    {...register('defaultTimezone')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Default Currency
                  </label>
                  <select
                    {...register('defaultCurrency')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="MAD">MAD (DH)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  {...register('maintenanceMode')}
                  className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="maintenanceMode" className="text-sm text-slate-700">
                  Enable Maintenance Mode
                </label>
              </div>

              {updateMutation.isError && (
                <p className="text-sm text-red-600">Failed to save settings. Please try again.</p>
              )}

              {showSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Settings saved successfully
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button type="submit" isLoading={updateMutation.isPending} disabled={!isDirty}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
