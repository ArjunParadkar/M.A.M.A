'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import STLViewer from '@/components/STLViewer';

type OrderType = 'open-request' | 'quick-service' | 'closed-request' | 'closed-commission';

const orderTypeLabels: Record<OrderType, string> = {
  'open-request': 'Open Request',
  'quick-service': 'Open Quick Service',
  'closed-request': 'Closed Request',
  'closed-commission': 'Closed Commission',
};

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderType = (searchParams.get('type') as OrderType) || 'open-request';

  const [stlFile, setStlFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [exactMaterial, setExactMaterial] = useState(''); // Exact material specification (dropdown)
  const [toleranceThou, setToleranceThou] = useState(''); // Tolerance in thousandths (0.001")
  const [manufacturingType, setManufacturingType] = useState<string[]>([]); // Multiple allowed
  const [finishDetails, setFinishDetails] = useState('');
  const [coatings, setCoatings] = useState<string[]>([]);
  const [paintColor, setPaintColor] = useState(''); // Color if Paint coating is selected
  const [screwDimensions, setScrewDimensions] = useState(''); // Screw/hardware details
  const [deadline, setDeadline] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.stl') || file.name.endsWith('.STL')) {
        setStlFile(file);
        setError(null);
      } else {
        setError('Please upload a .stl file');
        setStlFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!stlFile) {
      setError('Please select an STL file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const supabase = createClient();
      
      // Simulate upload progress (replace with actual Supabase Storage upload)
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            // After upload, proceed to AI processing
            setTimeout(() => {
              handleAIProcessing();
            }, 500);
          }
        }, 200);
      };

      simulateProgress();

      // TODO: Actually upload to Supabase Storage
      // const fileExt = stlFile.name.split('.').pop();
      // const fileName = `${Math.random()}.${fileExt}`;
      // const filePath = `stl-files/${fileName}`;
      // 
      // const { error: uploadError } = await supabase.storage
      //   .from('stl-files')
      //   .upload(filePath, stlFile);
      //
      // if (uploadError) throw uploadError;

    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAIProcessing = async () => {
    // Save form data to sessionStorage for processing page
    const formDataToSave = {
      productName,
      description,
      quantity,
      exactMaterial,
      toleranceThou,
      manufacturingType,
      finishDetails,
      coatings,
      paintColor,
      screwDimensions,
      deadline,
      estimatedBudget,
      orderType,
    };
    
    sessionStorage.setItem('orderFormData', JSON.stringify(formDataToSave));
    
    // Redirect to processing page
    router.push(`/client/new-order/processing?type=${orderType}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stlFile) {
      setError('Please upload an STL file');
      return;
    }

    // Upload and process
    await handleUpload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/client/dashboard" className="text-white hover:text-[#9ca3af] transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#0a1929] mb-2 heading-font">
            Create New {orderTypeLabels[orderType]}
          </h1>
          <p className="text-[#6b7280]">Upload your design and we'll help you get it manufactured</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STL Upload Section */}
          <div className="bg-[#0a1929] border border-[#1a2332] p-8">
            <h2 className="text-xl font-semibold text-white mb-4 heading-font">
              Upload STL File
            </h2>

            <div className="border-2 border-dashed border-[#253242] p-8 text-center hover:border-[#3a4552] transition-colors">
              {stlFile ? (
                <div>
                  <div className="text-white mb-2">✓ File selected</div>
                  <div className="text-[#9ca3af] text-sm mb-4">{stlFile.name}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setStlFile(null);
                      setUploadProgress(0);
                    }}
                    className="text-[#9ca3af] hover:text-white text-sm underline"
                  >
                    Remove file
                  </button>
                  <STLViewer file={stlFile} width={400} height={400} />
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="text-[#9ca3af] mb-2">Click to upload or drag and drop</div>
                  <div className="text-white text-sm mb-4">STL file only</div>
                  <input
                    type="file"
                    accept=".stl,.STL"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="inline-block bg-[#1a2332] text-white px-6 py-2 border border-[#253242] hover:border-[#3a4552] transition-colors">
                    Choose File
                  </div>
                </label>
              )}
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-[#1a2332] h-2">
                  <div
                    className="bg-[#253242] h-2 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[#9ca3af] text-sm mt-2">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="bg-[#0a1929] border border-[#1a2332] p-8 space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4 heading-font">
              Product Details
            </h2>

            <div>
              <label className="block text-white mb-2 font-medium">Product Name *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                placeholder="e.g., Bracket Assembly"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                placeholder="Describe your product, any special requirements, or notes for manufacturers"
              />
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Quantity *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Tolerance in Thou (0.001") *</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={toleranceThou}
                onChange={(e) => setToleranceThou(e.target.value)}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                placeholder="e.g., 0.005 for ±0.005 inches"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Manufacturing Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  '3D Printed (FDM)', '3D Printed (Resin/SLA)', '3D Printed (SLS)',
                  'CNC Milling', 'CNC Turning', 'Laser Cutting',
                  'Injection Molding', 'Pressed/Stamped', 'Waterjet Cutting',
                  'EDM', 'Sheet Metal Forming', 'Welding/Fabrication'
                ].map((type) => (
                  <label key={type} className="flex items-center p-3 bg-[#1a2332] border border-[#253242] hover:border-[#3a4552] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manufacturingType.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setManufacturingType([...manufacturingType, type]);
                        } else {
                          setManufacturingType(manufacturingType.filter(t => t !== type));
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="text-white text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Material Specification *</label>
              <select
                value={exactMaterial}
                onChange={(e) => setExactMaterial(e.target.value)}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                required
              >
                <option value="">Select material *</option>
                <optgroup label="Metals">
                  <option value="6061-T6 Aluminum">6061-T6 Aluminum</option>
                  <option value="7075 Aluminum">7075 Aluminum</option>
                  <option value="304 Stainless Steel">304 Stainless Steel</option>
                  <option value="316 Stainless Steel">316 Stainless Steel</option>
                  <option value="Mild Steel (A36)">Mild Steel (A36)</option>
                  <option value="Carbon Steel">Carbon Steel</option>
                  <option value="Titanium (Grade 5)">Titanium (Grade 5)</option>
                  <option value="Brass">Brass</option>
                  <option value="Copper">Copper</option>
                  <option value="Bronze">Bronze</option>
                </optgroup>
                <optgroup label="Plastics (3D Printing)">
                  <option value="PLA">PLA</option>
                  <option value="ABS">ABS</option>
                  <option value="ABS Plus">ABS Plus</option>
                  <option value="PETG">PETG</option>
                  <option value="TPU">TPU (Flexible)</option>
                  <option value="Nylon">Nylon</option>
                  <option value="ASA">ASA</option>
                  <option value="Polycarbonate">Polycarbonate</option>
                  <option value="Resin (SLA)">Resin (SLA)</option>
                </optgroup>
                <optgroup label="Other Materials">
                  <option value="Wood">Wood</option>
                  <option value="Acrylic">Acrylic</option>
                  <option value="Carbon Fiber">Carbon Fiber</option>
                  <option value="Fiberglass">Fiberglass</option>
                  <option value="Rubber/Silicone">Rubber/Silicone</option>
                </optgroup>
                <option value="Custom">Custom (specify in description)</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Finish Details</label>
              <select
                value={finishDetails}
                onChange={(e) => setFinishDetails(e.target.value)}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
              >
                <option value="">Select finish (optional)</option>
                <option value="smooth">Smooth</option>
                <option value="rough">Rough/As-machined</option>
                <option value="polished">Polished</option>
                <option value="brushed">Brushed</option>
                <option value="sandblasted">Sandblasted</option>
                <option value="machined">Machined finish</option>
                <option value="3d-print-layers">3D Print layer lines acceptable</option>
                <option value="custom">Custom (specify in description)</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Coatings (if needed)</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Anodized', 'Powder Coat', 'Paint', 'Plating (Nickel/Zinc)',
                  'Cerakote', 'Passivation', 'Black Oxide', 'None'
                ].map((coating) => (
                  <label key={coating} className="flex items-center p-3 bg-[#1a2332] border border-[#253242] hover:border-[#3a4552] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coatings.includes(coating)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCoatings([...coatings, coating]);
                        } else {
                          setCoatings(coatings.filter(c => c !== coating));
                          if (coating === 'Paint') {
                            setPaintColor(''); // Clear color when paint is deselected
                          }
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="text-white text-sm">{coating}</span>
                  </label>
                ))}
              </div>
              {coatings.includes('Paint') && (
                <div className="mt-4">
                  <label className="block text-white mb-2 font-medium text-sm">Paint Color *</label>
                  <div className="flex gap-4">
                    <input
                      type="color"
                      value={paintColor || '#000000'}
                      onChange={(e) => setPaintColor(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={paintColor}
                      onChange={(e) => setPaintColor(e.target.value)}
                      className="flex-1 bg-[#1a2332] border border-[#253242] text-white px-4 py-2 text-sm focus:outline-none focus:border-[#3a4552]"
                      placeholder="e.g., #FF0000 or 'Red' or 'RAL 3000'"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Screw/Hardware Dimensions</label>
              <input
                type="text"
                value={screwDimensions}
                onChange={(e) => setScrewDimensions(e.target.value)}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                placeholder="e.g., M4x0.7, #8-32 UNC, M6x1.0 (if applicable)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2 font-medium">Deadline *</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2 font-medium">Estimated Budget (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-200 p-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Link
              href="/client/dashboard"
              className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 bg-[#0a1929] hover:bg-[#253242] text-white px-6 py-3 border border-[#1a2332] hover:border-[#3a4552] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Processing...' : 'Continue to AI Analysis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

