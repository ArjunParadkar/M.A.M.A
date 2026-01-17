'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Device {
  name: string;
  type: string;
  model?: string;
  status: 'active' | 'inactive' | 'maintenance';
}

const deviceTypes = [
  { value: '3d_printer', label: '3D Printer' },
  { value: 'cnc_machine', label: 'CNC Machine' },
  { value: 'laser_cutter', label: 'Laser Cutter' },
  { value: 'injection_molder', label: 'Injection Molder' },
  { value: 'other', label: 'Other' },
];

const commonDevices = {
  '3d_printer': ['Bambu Lab X1 Carbon', 'Prusa i3 MK3S+', 'Creality Ender 3 V2', 'Formlabs Form 3', 'Ultimaker S5', 'Other'],
  'cnc_machine': ['Tormach PCNC 440', 'ShopBot Desktop', 'HAAS Mini Mill', 'Thermwood M40', 'Other'],
  'laser_cutter': ['Epilog Fusion Pro', 'Glowforge Pro', 'Trotec Speedy', 'Other'],
  'injection_molder': ['Arburg Allrounder', 'Boy Machines 15A', 'Other'],
};

export default function ManufacturerProfileForm({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basic Info
  const [name, setName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Step 2: Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Step 3: Devices
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: '',
    model: '',
    status: 'active' as const,
  });

  // Step 4: Materials and Capabilities
  const [materials, setMaterials] = useState<string[]>([]);
  const [toleranceTier, setToleranceTier] = useState<'low' | 'medium' | 'high'>('medium');

  const materialOptions = ['PLA', 'ABS', 'PETG', 'TPU', 'Nylon', 'Metal', 'Wood', 'Acrylic', 'Other'];

  const addDevice = () => {
    if (!newDevice.name || !newDevice.type) {
      setError('Device name and type are required');
      return;
    }

    setDevices([...devices, { ...newDevice }]);
    setNewDevice({ name: '', type: '', model: '', status: 'active' });
    setError(null);
  };

  const removeDevice = (index: number) => {
    setDevices(devices.filter((_, i) => i !== index));
  };

  const toggleMaterial = (material: string) => {
    if (materials.includes(material)) {
      setMaterials(materials.filter(m => m !== material));
    } else {
      setMaterials([...materials, material]);
    }
  };

  const handleSubmit = async () => {
    if (!name || !address || !city || !state || !zipCode) {
      setError('Please fill in all required fields');
      return;
    }

    if (devices.length === 0) {
      setError('Please add at least one device');
      return;
    }

    if (materials.length === 0) {
      setError('Please select at least one material');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'manufacturer',
          name,
          phone: phone || null,
          bio: bio || null,
          address,
          city,
          state,
          zip_code: zipCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create manufacturer record
      const { error: manufacturerError } = await supabase
        .from('manufacturers')
        .upsert({
          id: user.id,
          location_state: state,
          location_zip: zipCode,
          materials,
          tolerance_tier: toleranceTier,
          capacity_score: 0.5,
          updated_at: new Date().toISOString(),
        });

      if (manufacturerError) throw manufacturerError;

      // Add devices
      if (devices.length > 0) {
        const devicesToInsert = devices.map(device => ({
          manufacturer_id: user.id,
          device_name: device.name,
          device_type: device.type,
          device_model: device.model || null,
          status: device.status,
        }));

        const { error: devicesError } = await supabase
          .from('manufacturer_devices')
          .insert(devicesToInsert);

        if (devicesError) throw devicesError;
      }

      router.push('/maker/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#0a1929] p-8 border border-[#1a2332]">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2 heading-font">
              Complete Your Profile
            </h1>
            <p className="text-[#9ca3af]">Step {step} of 4</p>
            <div className="mt-4 h-1 bg-[#1a2332]">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-2 font-medium">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-[#9ca3af] mb-2 font-medium">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-[#9ca3af] mb-2 font-medium">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="Tell us about your manufacturing experience..."
                />
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium"
              >
                Next: Location
              </button>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-2 font-medium">Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2 font-medium">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">State *</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                    placeholder="CA"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">ZIP Code *</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="12345"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium"
                >
                  Next: Devices
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Devices */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 heading-font">Your Devices</h3>
                {devices.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {devices.map((device, index) => (
                      <div key={index} className="bg-[#1a2332] border border-[#253242] p-4 flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium">{device.name}</span>
                          <span className="text-[#9ca3af] ml-3">{deviceTypes.find(d => d.value === device.type)?.label || device.type}</span>
                          {device.model && <span className="text-[#9ca3af] ml-2">({device.model})</span>}
                        </div>
                        <button
                          onClick={() => removeDevice(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4 p-4 bg-[#1a2332] border border-[#253242]">
                  <div>
                    <label className="block text-white mb-2 font-medium">Device Type *</label>
                    <select
                      value={newDevice.type}
                      onChange={(e) => {
                        setNewDevice({ ...newDevice, type: e.target.value, name: '' });
                      }}
                      className="w-full bg-black border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                    >
                      <option value="">Select device type</option>
                      {deviceTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {newDevice.type && (
                    <div>
                      <label className="block text-white mb-2 font-medium">Device Model *</label>
                      <select
                        value={newDevice.name}
                        onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                        className="w-full bg-black border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                      >
                        <option value="">Select model</option>
                        {commonDevices[newDevice.type as keyof typeof commonDevices]?.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={addDevice}
                    className="w-full bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-2 border border-[#3a4552] hover:border-[#4a5562] transition-colors font-medium text-sm"
                  >
                    Add Device
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium"
                >
                  Next: Materials
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Materials and Capabilities */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-4 font-medium">Materials You Work With *</label>
                <div className="grid grid-cols-3 gap-3">
                  {materialOptions.map(material => (
                    <button
                      key={material}
                      type="button"
                      onClick={() => toggleMaterial(material)}
                      className={`p-3 border transition-colors ${
                        materials.includes(material)
                          ? 'bg-[#253242] border-white text-white'
                          : 'bg-[#1a2332] border-[#253242] text-[#9ca3af] hover:border-[#3a4552]'
                      }`}
                    >
                      {material}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white mb-2 font-medium">Tolerance Tier *</label>
                <select
                  value={toleranceTier}
                  onChange={(e) => setToleranceTier(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                >
                  <option value="low">Low (Basic manufacturing)</option>
                  <option value="medium">Medium (Standard precision)</option>
                  <option value="high">High (Precision manufacturing)</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

