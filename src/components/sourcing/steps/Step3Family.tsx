import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SourcingFormData, MaritalStatus } from '@/types/sourcing';

interface Step3FamilyProps {
  formData: SourcingFormData;
  updateField: (field: keyof SourcingFormData, value: any) => void;
  errors: Record<string, string>;
}

export function Step3Family({
  formData,
  updateField,
  errors,
}: Step3FamilyProps) {
  const maritalStatusOptions: MaritalStatus[] = [
    'Célibataire',
    'Marié(e)',
    'Fiancé(e)',
    'Veuf(ve)',
    'Divorcé(e)',
  ];

  return (
    <div className="space-y-6">
      {/* Situation familiale */}
      <div className="space-y-2">
        <Label htmlFor="maritalStatus" className="text-base font-medium">
          Situation familiale <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.maritalStatus}
          onValueChange={(value) => updateField('maritalStatus', value)}
        >
          <SelectTrigger
            className={`h-12 text-base ${
              errors.maritalStatus ? 'border-red-500' : ''
            }`}
          >
            <SelectValue placeholder="Sélectionnez votre situation" />
          </SelectTrigger>
          <SelectContent>
            {maritalStatusOptions.map((status) => (
              <SelectItem key={status} value={status} className="text-base">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.maritalStatus && (
          <p className="text-sm text-red-600">{errors.maritalStatus}</p>
        )}
      </div>

      {/* Toggle - Avez-vous des enfants ? */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          Avez-vous des enfants ? <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              updateField('hasChildren', true);
              if (formData.numberOfChildren === 0) {
                updateField('numberOfChildren', 1);
              }
            }}
            className={`p-4 rounded-xl border-2 font-medium text-base transition-all duration-200 ${
              formData.hasChildren
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white hover:border-gray-300 text-foreground'
            }`}
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => {
              updateField('hasChildren', false);
              updateField('numberOfChildren', 0);
            }}
            className={`p-4 rounded-xl border-2 font-medium text-base transition-all duration-200 ${
              !formData.hasChildren
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white hover:border-gray-300 text-foreground'
            }`}
          >
            Non
          </button>
        </div>
      </div>

      {/* Nombre d'enfants - Affiché seulement si hasChildren = true */}
      {formData.hasChildren && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label htmlFor="numberOfChildren" className="text-base font-medium">
            Nombre d'enfants <span className="text-red-500">*</span>
          </Label>
          <Input
            id="numberOfChildren"
            type="number"
            min="1"
            max="20"
            value={formData.numberOfChildren}
            onChange={(e) =>
              updateField('numberOfChildren', parseInt(e.target.value) || 0)
            }
            className={`h-12 text-base ${
              errors.numberOfChildren ? 'border-red-500 focus:ring-red-500' : ''
            }`}
          />
          {errors.numberOfChildren && (
            <p className="text-sm text-red-600">{errors.numberOfChildren}</p>
          )}
        </div>
      )}
    </div>
  );
}
