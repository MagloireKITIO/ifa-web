import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SourcingFormData, SpiritualStatus } from '@/types/sourcing';

interface Step4SpiritualProps {
  formData: SourcingFormData;
  updateField: (field: keyof SourcingFormData, value: any) => void;
  errors: Record<string, string>;
}

export function Step4Spiritual({
  formData,
  updateField,
  errors,
}: Step4SpiritualProps) {
  const spiritualStatusOptions: {
    value: SpiritualStatus;
    label: string;
    description: string;
  }[] = [
    {
      value: 'Membre',
      label: 'Membre',
      description: 'Je suis membre actif de l\'église',
    },
    {
      value: 'Visiteur',
      label: 'Visiteur',
      description: 'Je visite pour la première fois',
    },
    {
      value: 'Nouveau Converti',
      label: 'Nouveau Converti',
      description: 'J\'ai récemment accepté Christ',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statut spirituel */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          Statut spirituel <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-3">
          {spiritualStatusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField('spiritualStatus', option.value)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                formData.spiritualStatus === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-base mb-1">{option.label}</div>
              <div className="text-sm text-muted-foreground">
                {option.description}
              </div>
            </button>
          ))}
        </div>
        {errors.spiritualStatus && (
          <p className="text-sm text-red-600">{errors.spiritualStatus}</p>
        )}
      </div>

      {/* Toggle - Baptisé ? */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          Êtes-vous baptisé(e) ? <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateField('isBaptized', true)}
            className={`p-4 rounded-xl border-2 font-medium text-base transition-all duration-200 ${
              formData.isBaptized
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white hover:border-gray-300 text-foreground'
            }`}
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => {
              updateField('isBaptized', false);
              updateField('baptismDate', '');
            }}
            className={`p-4 rounded-xl border-2 font-medium text-base transition-all duration-200 ${
              !formData.isBaptized
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white hover:border-gray-300 text-foreground'
            }`}
          >
            Non
          </button>
        </div>
      </div>

      {/* Date de baptême - Affiché seulement si isBaptized = true */}
      {formData.isBaptized && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label htmlFor="baptismDate" className="text-base font-medium">
            Date de baptême <span className="text-red-500">*</span>
          </Label>
          <Input
            id="baptismDate"
            type="date"
            value={formData.baptismDate}
            onChange={(e) => updateField('baptismDate', e.target.value)}
            className={`h-12 text-base ${
              errors.baptismDate ? 'border-red-500 focus:ring-red-500' : ''
            }`}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.baptismDate && (
            <p className="text-sm text-red-600">{errors.baptismDate}</p>
          )}
        </div>
      )}
    </div>
  );
}
