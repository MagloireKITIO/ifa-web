import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SourcingFormData, Gender } from '@/types/sourcing';

interface Step1PersonalInfoProps {
  formData: SourcingFormData;
  updateField: (field: keyof SourcingFormData, value: any) => void;
  errors: Record<string, string>;
}

export function Step1PersonalInfo({
  formData,
  updateField,
  errors,
}: Step1PersonalInfoProps) {
  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'Homme', label: 'Homme' },
    { value: 'Femme', label: 'Femme' },
  ];

  return (
    <div className="space-y-6">
      {/* Nom complet */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-base font-medium">
          Nom complet <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Ex: Jean Dupont"
          value={formData.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
          className={`h-12 text-base ${
            errors.fullName ? 'border-red-500 focus:ring-red-500' : ''
          }`}
        />
        {errors.fullName && (
          <p className="text-sm text-red-600">{errors.fullName}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Tel qu'il apparaît sur votre pièce d'identité
        </p>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base font-medium">
          Adresse email <span className="text-muted-foreground">(optionnel)</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="exemple@email.com"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={`h-12 text-base ${
            errors.email ? 'border-red-500 focus:ring-red-500' : ''
          }`}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Téléphone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-base font-medium">
          Numéro de téléphone <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+237 6XX XXX XXX"
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          className={`h-12 text-base ${
            errors.phone ? 'border-red-500 focus:ring-red-500' : ''
          }`}
        />
        {errors.phone && (
          <p className="text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Date de naissance */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth" className="text-base font-medium">
          Date de naissance <span className="text-red-500">*</span>
        </Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => updateField('dateOfBirth', e.target.value)}
          className={`h-12 text-base ${
            errors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          max={new Date().toISOString().split('T')[0]}
        />
        {errors.dateOfBirth && (
          <p className="text-sm text-red-600">{errors.dateOfBirth}</p>
        )}
      </div>

      {/* Genre */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          Genre <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-4">
          {genderOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField('gender', option.value)}
              className={`p-4 rounded-xl border-2 font-medium text-base transition-all duration-200 ${
                formData.gender === option.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white hover:border-gray-300 text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.gender && (
          <p className="text-sm text-red-600">{errors.gender}</p>
        )}
      </div>
    </div>
  );
}
