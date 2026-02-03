import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SourcingFormData } from '@/types/sourcing';

interface Step2AddressProps {
  formData: SourcingFormData;
  updateField: (field: keyof SourcingFormData, value: any) => void;
  errors: Record<string, string>;
}

export function Step2Address({
  formData,
  updateField,
  errors,
}: Step2AddressProps) {
  return (
    <div className="space-y-6">
      {/* Adresse */}
      <div className="space-y-2">
        <Label htmlFor="address" className="text-base font-medium">
          Adresse complète <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="address"
          placeholder="Ex: Rue 123, Quartier Bonapriso, Douala"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          className={`min-h-32 text-base resize-none ${
            errors.address ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          rows={5}
        />
        {errors.address && (
          <p className="text-sm text-red-600">{errors.address}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Incluez votre rue, quartier et ville
        </p>
      </div>
    </div>
  );
}
