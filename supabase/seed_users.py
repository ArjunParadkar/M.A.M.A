#!/usr/bin/env python3
"""
Seed 100 Manufacturers and 100 Clients
ACTUALLY CREATES USERS in Supabase using Admin API

Prerequisites:
- pip install supabase
- Set SUPABASE_SERVICE_ROLE_KEY environment variable

Usage:
    export SUPABASE_URL="https://aywrgbfuoldtoeecsbvu.supabase.co"
    export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
    python supabase/seed_users.py
"""

import os
import random
import json
import time
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

# Device types and models
DEVICE_TYPES = [
    '3d_printer_fdm', '3d_printer_resin', '3d_printer_sls', '3d_printer_metal',
    'cnc_mill', 'cnc_lathe', 'cnc_router', 'cnc_plasma',
    'waterjet', 'laser_co2', 'laser_fiber', 'laser_diode',
    'injection_molding', 'edm', 'sheet_metal_brake', 'sheet_metal_shear',
    'welding', 'grinder', 'cmm', 'other'
]

DEVICE_MODELS = {
    '3d_printer_fdm': ['Bambu Lab X1-Carbon', 'Prusa i3 MK4', 'Creality Ender 3 V2', 'Ultimaker S5', 'Raise3D RMF500'],
    '3d_printer_resin': ['Formlabs Form 4', 'Elegoo Saturn 3', 'Anycubic Photon Mono X'],
    'cnc_mill': ['HAAS VF-2', 'Tormach PCNC 440', 'DMG MORI CMX 50', 'Datron M8'],
    'cnc_router': ['ShopBot Desktop', 'Axiom Precision AR8', 'Thermwood M40'],
    'laser_co2': ['Epilog Fusion Pro', 'Trotec Speedy 400', 'Glowforge Pro'],
    'injection_molding': ['Arburg Allrounder 370E', 'Engel Victory', 'Boy Machines 15A'],
    'waterjet': ['OMAX 2652', 'Flow Mach 3', 'Bystronic ByJet'],
    'other': ['Custom Machine', 'Manual Tools'],
}

MATERIALS = ['PLA', 'ABS', 'PETG', 'TPU', 'Nylon', 'Metal', 'Wood', 'Acrylic', 'Resin']
TOLERANCE_TIERS = ['low', 'medium', 'high']
STATES = ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'WA', 'AZ', 'CO', 'MA', 'VA', 'TN']

def generate_email(prefix: str, num: int) -> str:
    return f"{prefix}{num:03d}@mama-test.com"

def generate_password() -> str:
    return "Password123!"

def create_manufacturer_user(num: int) -> Dict:
    """Create manufacturer user data"""
    email = generate_email("mfg", num)
    password = generate_password()
    
    capacity_score = round(random.uniform(0.3, 1.0), 2)
    quality_score = round(random.uniform(0.4, 1.0), 2)
    tolerance_tier = random.choice(TOLERANCE_TIERS)
    num_devices = random.randint(2, 5)
    
    device_types = random.sample(DEVICE_TYPES, min(num_devices, len(DEVICE_TYPES)))
    materials = random.sample(MATERIALS, random.randint(2, 5))
    state = random.choice(STATES)
    zip_code = f"{random.randint(10000, 99999)}"
    
    business_type = random.choice(['individual', 'small_business', 'corporation'])
    company_name = f"Maker {num} LLC" if business_type != 'individual' else None
    
    return {
        'email': email,
        'password': password,
        'name': f"Maker {num}",
        'company_name': company_name,
        'business_type': business_type,
        'state': state,
        'zip_code': zip_code,
        'city': f"City {num}",
        'address': f"{random.randint(100, 9999)} Main St",
        'capacity_score': capacity_score,
        'quality_score': quality_score,
        'tolerance_tier': tolerance_tier,
        'materials': materials,
        'device_types': device_types,
    }

def create_client_user(num: int) -> Dict:
    """Create client user data"""
    email = generate_email("client", num)
    password = generate_password()
    
    client_type = random.choice(['individual', 'small_business', 'corporation'])
    company_name = f"Client Co {num}" if client_type != 'individual' else None
    
    return {
        'email': email,
        'password': password,
        'name': f"Client {num}",
        'company_name': company_name,
        'client_type': client_type,
    }

def create_users():
    """Create 100 manufacturers and 100 clients"""
    
    created_manufacturers = []
    created_clients = []
    errors = []
    
    print("="*60)
    print("CREATING 100 MANUFACTURERS")
    print("="*60)
    
    for i in range(1, 101):
        try:
            mfg_data = create_manufacturer_user(i)
            
            # Create auth user
            auth_response = supabase.auth.admin.create_user({
                "email": mfg_data['email'],
                "password": mfg_data['password'],
                "email_confirm": True,  # Auto-confirm email
                "user_metadata": {
                    "full_name": mfg_data['name'],
                    "role": "manufacturer"
                }
            })
            
            user_id = auth_response.user.id
            
            # Update profile (trigger should create it, but ensure it's correct)
            supabase.table('profiles').update({
                'role': 'manufacturer',
                'name': mfg_data['name'],
                'business_type': mfg_data['business_type'],
                'company_name': mfg_data['company_name'],
                'state': mfg_data['state'],
                'zip_code': mfg_data['zip_code'],
                'city': mfg_data['city'],
                'address': mfg_data['address'],
            }).eq('id', user_id).execute()
            
            # Create manufacturer entry
            supabase.table('manufacturers').upsert({
                'id': user_id,
                'location_state': mfg_data['state'],
                'location_zip': mfg_data['zip_code'],
                'materials': mfg_data['materials'],
                'tolerance_tier': mfg_data['tolerance_tier'],
                'capacity_score': mfg_data['capacity_score'],
                'quality_score': mfg_data['quality_score'],
            }).execute()
            
            # Create devices
            num_devices_to_create = len(mfg_data['device_types'])
            for device_type in mfg_data['device_types']:
                models = DEVICE_MODELS.get(device_type, ['Custom'])
                model = random.choice(models)
                
                supabase.table('manufacturer_devices').insert({
                    'manufacturer_id': user_id,
                    'device_name': model,
                    'device_type': device_type,
                    'status': 'active',
                }).execute()
            
            created_manufacturers.append({
                'num': i,
                'email': mfg_data['email'],
                'password': mfg_data['password'],
                'user_id': user_id,
            })
            
            if i % 10 == 0:
                print(f"  ✅ Created {i}/100 manufacturers...")
                time.sleep(0.5)  # Rate limiting
            
        except Exception as e:
            error_msg = f"Error creating manufacturer {i}: {str(e)}"
            errors.append(error_msg)
            print(f"  ❌ {error_msg}")
    
    print("\n" + "="*60)
    print("CREATING 100 CLIENTS")
    print("="*60)
    
    for i in range(1, 101):
        try:
            client_data = create_client_user(i)
            
            # Create auth user
            auth_response = supabase.auth.admin.create_user({
                "email": client_data['email'],
                "password": client_data['password'],
                "email_confirm": True,
                "user_metadata": {
                    "full_name": client_data['name'],
                    "role": "client"
                }
            })
            
            user_id = auth_response.user.id
            
            # Update profile
            supabase.table('profiles').update({
                'role': 'client',
                'name': client_data['name'],
                'client_type': client_data['client_type'],
                'company_name': client_data['company_name'],
            }).eq('id', user_id).execute()
            
            created_clients.append({
                'num': i,
                'email': client_data['email'],
                'password': client_data['password'],
                'user_id': user_id,
            })
            
            if i % 10 == 0:
                print(f"  ✅ Created {i}/100 clients...")
                time.sleep(0.5)
            
        except Exception as e:
            error_msg = f"Error creating client {i}: {str(e)}"
            errors.append(error_msg)
            print(f"  ❌ {error_msg}")
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✅ Manufacturers created: {len(created_manufacturers)}/100")
    print(f"✅ Clients created: {len(created_clients)}/100")
    print(f"❌ Errors: {len(errors)}")
    
    if errors:
        print("\nErrors:")
        for err in errors[:10]:  # Show first 10 errors
            print(f"  - {err}")
    
    print("\n" + "="*60)
    print("SAMPLE CREDENTIALS (First 5 of each)")
    print("="*60)
    print("\nManufacturers:")
    for mfg in created_manufacturers[:5]:
        print(f"  {mfg['email']} / {mfg['password']}")
    print("\nClients:")
    for client in created_clients[:5]:
        print(f"  {client['email']} / {client['password']}")
    
    # Save to file
    with open('supabase/seed_users_output.json', 'w') as f:
        json.dump({
            'manufacturers': created_manufacturers,
            'clients': created_clients,
            'errors': errors
        }, f, indent=2)
    
    print(f"\n✅ Full list saved to: supabase/seed_users_output.json")
    print("="*60)

if __name__ == "__main__":
    print("\n🚀 Starting user creation...")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Using service_role key: {'✅ Set' if SUPABASE_KEY else '❌ Not set'}\n")
    
    create_users()
    
    print("\n✨ Done! You can now sign in with any of the created accounts.")
    print("All passwords are: Password123!")
