#!/usr/bin/env python3
"""
Create 50 Verified Manufacturers with Varied Devices
For Demo: Creates manufacturers with different capabilities, devices, and quality scores
"""

import os
import random
import json
from typing import List, Dict
from supabase import create_client, Client

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://aywrgbfuoldtoeecsbvu.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_KEY:
    print("❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set")
    print("Get it from: Supabase Dashboard → Settings → API → service_role key")
    print("\nRun: export SUPABASE_SERVICE_ROLE_KEY='your-key-here'")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Comprehensive device list
DEVICE_TYPES = [
    '3d_printer_fdm', '3d_printer_resin', '3d_printer_sls', '3d_printer_metal',
    'cnc_mill', 'cnc_lathe', 'cnc_router', 'cnc_plasma',
    'waterjet', 'laser_co2', 'laser_fiber', 'laser_diode',
    'injection_molding', 'edm', 'sheet_metal_brake', 'sheet_metal_shear',
    'welding', 'grinder', 'cmm', 'press_brake', 'lathe', 'mill'
]

DEVICE_NAMES = {
    '3d_printer_fdm': ['Bambu Lab X1-Carbon', 'Prusa i3 MK4', 'Creality Ender 3 V2', 'Ultimaker S5', 'Raise3D RMF500', 'Voron 2.4', 'RatRig V-Core 3'],
    '3d_printer_resin': ['Formlabs Form 4', 'Elegoo Saturn 3', 'Anycubic Photon Mono X', 'Phrozen Sonic Mini 8K'],
    '3d_printer_sls': ['Formlabs Fuse 1', 'Sintratec S2', 'Sharebot snowWhite'],
    '3d_printer_metal': ['Desktop Metal Studio System', 'Markforged Metal X'],
    'cnc_mill': ['HAAS VF-2', 'Tormach PCNC 440', 'DMG MORI CMX 50', 'Datron M8', 'Fadal VMC 4020', 'Okuma MB-46VA'],
    'cnc_lathe': ['HAAS ST-20', 'Okuma LB3000', 'Mazak Quick Turn', 'DMG MORI NLX 2500'],
    'cnc_router': ['ShopBot Desktop', 'Axiom Precision AR8', 'Thermwood M40', 'MultiCam 3000'],
    'cnc_plasma': ['Hypertherm Powermax', 'Thermal Dynamics Cutmaster', 'Lincoln Electric Tomahawk'],
    'waterjet': ['OMAX 2652', 'Flow Mach 3', 'Bystronic ByJet', 'KMT Streamline'],
    'laser_co2': ['Epilog Fusion Pro', 'Trotec Speedy 400', 'Glowforge Pro', 'Universal Laser Systems'],
    'laser_fiber': ['Trumpf TruLaser', 'Mazak Optiplex', 'Amada Ensis'],
    'laser_diode': ['xTool D1 Pro', 'LaserPecker LP4', 'ORtur Laser Master 2'],
    'injection_molding': ['Arburg Allrounder 370E', 'Engel Victory', 'Boy Machines 15A', 'JSW ELIII'],
    'edm': ['AgieCharmilles CUT 20', 'Mitsubishi MV1200', 'Sodick AG600L'],
    'sheet_metal_brake': ['Accurpress 175 Ton', 'Durma AD-C', 'Amada RG'],
    'sheet_metal_shear': ['Accurpress 12ga', 'Durma CDS', 'Amada FBD'],
    'welding': ['Miller Multimatic 220', 'Lincoln Power Mig 350', 'ESAB Rebel EMP'],
    'grinder': ['Okamoto ACC-1224', 'Mitsui MSG-250H', 'Chevalier FSG-1224AD'],
    'cmm': ['Zeiss Contura', 'Mitutoyo CRYSTA-Apex S', 'Hexagon Global'],
    'press_brake': ['Accurpress 150 Ton', 'Amada HFB', 'Salvagnini'],
    'lathe': ['HAAS ST-20', 'Mazak Quick Turn', 'Okuma LB3000'],
    'mill': ['HAAS VF-2', 'Tormach PCNC 440', 'DMG MORI'],
}

MATERIALS = [
    'PLA', 'ABS', 'PETG', 'TPU', 'Nylon', 'Carbon Fiber', 'Metal', 'Wood', 
    'Acrylic', 'Resin', 'Aluminum', 'Steel', 'Stainless Steel', 'Brass', 
    'Copper', 'Titanium', '6061-T6 Aluminum', '316 Stainless Steel', 
    'ABS Plastic', 'Polycarbonate', 'Delrin', 'PEEK'
]

TOLERANCE_TIERS = ['low', 'medium', 'high']
STATES = ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'WA', 'AZ', 'CO', 'MA', 'VA', 'TN', 'IN', 'MO', 'MD', 'WI']

def generate_email(prefix: str, num: int) -> str:
    return f"{prefix}{num:03d}@mama-demo.com"

def generate_password() -> str:
    return "Password123!"

def create_manufacturer(num: int) -> Dict:
    """Create manufacturer data with varied capabilities"""
    
    # Vary capabilities
    capacity_score = round(random.uniform(0.4, 1.0), 2)
    quality_score = round(random.uniform(0.5, 1.0), 2)
    tolerance_tier = random.choice(TOLERANCE_TIERS)
    
    # 2-6 devices per manufacturer
    num_devices = random.randint(2, 6)
    available_device_types = [dt for dt in DEVICE_TYPES if dt in DEVICE_NAMES]
    device_types = random.sample(available_device_types, min(num_devices, len(available_device_types)))
    
    # 3-8 materials
    materials = random.sample(MATERIALS, random.randint(3, 8))
    
    # Location
    state = random.choice(STATES)
    zip_code = f"{random.randint(10000, 99999)}"
    
    # Business type
    business_type = random.choice(['individual', 'small_business', 'corporation'])
    company_name = None
    if business_type != 'individual':
        company_name = f"MakerWorks {num}" if business_type == 'small_business' else f"Advanced Manufacturing Corp {num}"
    
    # Generate devices list
    devices = []
    for device_type in device_types:
        device_name = random.choice(DEVICE_NAMES.get(device_type, ['Custom Machine']))
        device_model = device_name.split()[-1] if ' ' in device_name else None
        
        devices.append({
            'device_name': device_name,
            'device_type': device_type,
            'device_model': device_model,
            'status': 'active'
        })
    
    return {
        'email': generate_email("mfg", num),
        'password': generate_password(),
        'name': f"Maker {num}",
        'company_name': company_name,
        'business_type': business_type,
        'state': state,
        'zip_code': zip_code,
        'city': random.choice(['San Francisco', 'Austin', 'New York', 'Miami', 'Chicago', 'Seattle', 'Denver', 'Atlanta']),
        'address': f"{random.randint(100, 9999)} Main St",
        'capacity_score': capacity_score,
        'quality_score': quality_score,
        'tolerance_tier': tolerance_tier,
        'materials': materials,
        'devices': devices,
    }

def main():
    """Create 50 verified manufacturers"""
    
    print("="*60)
    print("CREATING 50 VERIFIED MANUFACTURERS")
    print("="*60)
    
    created = []
    errors = []
    
    for i in range(1, 51):
        try:
            mfg_data = create_manufacturer(i)
            
            print(f"\n[{i}/50] Creating {mfg_data['name']} ({mfg_data['email']})...")
            
            # Create auth user (auto-confirmed)
            auth_response = supabase.auth.admin.create_user({
                "email": mfg_data['email'],
                "password": mfg_data['password'],
                "email_confirm": True,  # Auto-confirm
                "user_metadata": {
                    "full_name": mfg_data['name'],
                    "role": "manufacturer"
                }
            })
            
            user_id = auth_response.user.id
            
            # Update profile
            supabase.table('profiles').upsert({
                'id': user_id,
                'role': 'manufacturer',
                'name': mfg_data['name'],
                'email': mfg_data['email'],
                'business_type': mfg_data['business_type'],
                'company_name': mfg_data['company_name'],
                'state': mfg_data['state'],
                'city': mfg_data['city'],
                'zip_code': mfg_data['zip_code'],
                'address': mfg_data['address'],
            }, on_conflict='id').execute()
            
            # Create manufacturer record
            supabase.table('manufacturers').upsert({
                'id': user_id,
                'location_state': mfg_data['state'],
                'location_zip': mfg_data['zip_code'],
                'equipment': {},  # Legacy field
                'materials': mfg_data['materials'],
                'tolerance_tier': mfg_data['tolerance_tier'],
                'capacity_score': mfg_data['capacity_score'],
                'quality_score': mfg_data['quality_score'],
                'average_rating': round(random.uniform(3.5, 5.0), 1),
                'total_jobs_completed': random.randint(0, 50),
                'total_ratings_received': random.randint(0, 20),
            }, on_conflict='id').execute()
            
            # Add devices
            for device in mfg_data['devices']:
                supabase.table('manufacturer_devices').insert({
                    'manufacturer_id': user_id,
                    'device_name': device['device_name'],
                    'device_type': device['device_type'],
                    'device_model': device.get('device_model'),
                    'status': device['status'],
                }).execute()
            
            created.append({
                'id': user_id,
                'email': mfg_data['email'],
                'password': mfg_data['password'],
                'name': mfg_data['name'],
                'devices': len(mfg_data['devices']),
                'materials': len(mfg_data['materials']),
                'capacity_score': mfg_data['capacity_score'],
                'quality_score': mfg_data['quality_score'],
            })
            
            print(f"  ✅ Created {mfg_data['name']} with {len(mfg_data['devices'])} devices")
            
        except Exception as e:
            error_msg = str(e)[:200]
            print(f"  ❌ Error: {error_msg}")
            errors.append({'num': i, 'error': error_msg})
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✅ Successfully created: {len(created)} manufacturers")
    print(f"❌ Errors: {len(errors)}")
    
    if created:
        print("\n📋 Sample Manufacturers Created:")
        for i, mfg in enumerate(created[:5], 1):
            print(f"  {i}. {mfg['name']} ({mfg['email']}) - {mfg['devices']} devices, Quality: {mfg['quality_score']:.2f}")
        
        # Save to file
        with open('supabase/demo_manufacturers.json', 'w') as f:
            json.dump(created, f, indent=2)
        print(f"\n💾 Full list saved to: supabase/demo_manufacturers.json")
    
    if errors:
        print("\n⚠️  Errors encountered:")
        for err in errors[:5]:
            print(f"  - Manufacturer {err['num']}: {err['error']}")
    
    print("\n✅ DONE! You now have 50 verified manufacturers ready for the demo.")
    print("\n📝 Quick Test Credentials (first 5):")
    for mfg in created[:5]:
        print(f"   Email: {mfg['email']} | Password: Password123!")

if __name__ == "__main__":
    main()


