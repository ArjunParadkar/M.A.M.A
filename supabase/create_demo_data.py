#!/usr/bin/env python3
"""
Create Demo Data: Users, Jobs, and Workflows
Creates varied users and sample projects with workflows
"""

import os
import random
import json
import time
import uuid
from datetime import datetime, timedelta
from typing import List, Dict
from supabase import create_client, Client

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://aywrgbfuoldtoeecsbvu.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_KEY:
    print("❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set")
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
    '3d_printer_fdm': ['Bambu Lab X1-Carbon', 'Prusa i3 MK4', 'Creality Ender 3 V2', 'Ultimaker S5'],
    '3d_printer_resin': ['Formlabs Form 4', 'Elegoo Saturn 3', 'Anycubic Photon Mono X'],
    'cnc_mill': ['HAAS VF-2', 'Tormach PCNC 440', 'DMG MORI CMX 50'],
    'cnc_router': ['ShopBot Desktop', 'Axiom Precision AR8'],
    'laser_co2': ['Epilog Fusion Pro', 'Trotec Speedy 400'],
}

MATERIALS = ['PLA', 'ABS', 'PETG', '6061-T6 Aluminum', '316 Stainless Steel', 'ABS Plastic', 'Polycarbonate', 'Resin']
STATES = ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']

def create_user_via_admin(email: str, password: str, name: str, role: str):
    """Create user using Admin API"""
    try:
        response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": name,
                "role": role
            }
        })
        return response.user.id
    except Exception as e:
        print(f"  ⚠️  User creation error for {email}: {str(e)[:100]}")
        # Check if user already exists
        if "already registered" in str(e).lower() or "already exists" in str(e).lower():
            # Try to get existing user
            try:
                # We can't easily check, so just return None and skip
                return None
            except:
                return None
        return None

def ensure_profile(user_id: str, data: Dict):
    """Ensure profile exists and is updated"""
    try:
        # Try to insert, if exists, update
        supabase.table('profiles').upsert({
            'id': user_id,
            'role': data['role'],
            'name': data['name'],
            **{k: v for k, v in data.items() if k != 'role' and k != 'name' and v is not None}
        }, on_conflict='id').execute()
    except Exception as e:
        print(f"  ⚠️  Profile error for {user_id}: {str(e)[:100]}")

def create_users():
    """Create 20 manufacturers and 10 clients (smaller set for demo)"""
    
    created_manufacturers = []
    created_clients = []
    
    print("="*60)
    print("CREATING 20 MANUFACTURERS")
    print("="*60)
    
    for i in range(1, 21):
        try:
            email = f"mfg{i:03d}@mama-test.com"
            password = "Password123!"
            name = f"Maker {i}"
            
            user_id = create_user_via_admin(email, password, name, "manufacturer")
            
            if not user_id:
                continue
            
            # Profile data
            capacity_score = round(random.uniform(0.3, 1.0), 2)
            quality_score = round(random.uniform(0.4, 1.0), 2)
            tolerance_tier = random.choice(['low', 'medium', 'high'])
            num_devices = random.randint(2, 4)
            device_types = random.sample(DEVICE_TYPES, min(num_devices, len(DEVICE_TYPES)))
            materials = random.sample(MATERIALS, random.randint(2, 4))
            state = random.choice(STATES)
            business_type = random.choice(['individual', 'small_business', 'corporation'])
            
            # Ensure profile
            ensure_profile(user_id, {
                'role': 'manufacturer',
                'name': name,
                'business_type': business_type,
                'company_name': f"{name} LLC" if business_type != 'individual' else None,
                'state': state,
                'zip_code': f"{random.randint(10000, 99999)}",
                'city': f"City {i}",
                'address': f"{random.randint(100, 9999)} Main St",
            })
            
            # Create manufacturer entry
            try:
                supabase.table('manufacturers').upsert({
                    'id': user_id,
                    'location_state': state,
                    'materials': materials,
                    'tolerance_tier': tolerance_tier,
                    'capacity_score': capacity_score,
                    'quality_score': quality_score,
                }, on_conflict='id').execute()
            except Exception as e:
                print(f"  ⚠️  Manufacturer table error: {str(e)[:100]}")
            
            # Create devices
            for device_type in device_types:
                try:
                    models = DEVICE_MODELS.get(device_type, ['Custom'])
                    model = random.choice(models) if models else 'Custom'
                    supabase.table('manufacturer_devices').insert({
                        'manufacturer_id': user_id,
                        'device_name': model,
                        'device_type': device_type,
                        'status': 'active',
                    }).execute()
                except Exception as e:
                    pass  # Skip device if error
            
            created_manufacturers.append({
                'email': email,
                'password': password,
                'user_id': user_id,
            })
            
            if i % 5 == 0:
                print(f"  ✅ Created {i}/20 manufacturers...")
                time.sleep(0.3)
                
        except Exception as e:
            print(f"  ❌ Error creating manufacturer {i}: {str(e)[:100]}")
    
    print("\n" + "="*60)
    print("CREATING 10 CLIENTS")
    print("="*60)
    
    for i in range(1, 11):
        try:
            email = f"client{i:03d}@mama-test.com"
            password = "Password123!"
            name = f"Client {i}"
            
            user_id = create_user_via_admin(email, password, name, "client")
            
            if not user_id:
                continue
            
            client_type = random.choice(['individual', 'small_business', 'corporation'])
            
            # Ensure profile
            ensure_profile(user_id, {
                'role': 'client',
                'name': name,
                'client_type': client_type,
                'company_name': f"Client Co {i}" if client_type != 'individual' else None,
                'state': random.choice(STATES),
                'zip_code': f"{random.randint(10000, 99999)}",
                'city': f"City {i}",
                'address': f"{random.randint(100, 9999)} Main St",
            })
            
            created_clients.append({
                'email': email,
                'password': password,
                'user_id': user_id,
            })
            
            if i % 5 == 0:
                print(f"  ✅ Created {i}/10 clients...")
                time.sleep(0.3)
                
        except Exception as e:
            print(f"  ❌ Error creating client {i}: {str(e)[:100]}")
    
    return created_manufacturers, created_clients

def create_sample_jobs(manufacturers: List[Dict], clients: List[Dict]):
    """Create sample jobs with varied data"""
    
    print("\n" + "="*60)
    print("CREATING SAMPLE JOBS")
    print("="*60)
    
    created_jobs = []
    
    job_titles = [
        "Precision Bracket Assembly",
        "Housing Component",
        "Prototype Casing",
        "Display Cover Plate",
        "Sensor Mount",
        "Gear Assembly",
        "Custom Enclosure",
        "Bearing Housing",
        "Shield Plate",
        "Support Bracket"
    ]
    
    for i, client in enumerate(clients[:5]):  # Create 5 jobs
        try:
            # Pick random manufacturer for the job
            mfg = random.choice(manufacturers)
            
            # Create job
            quantity = random.choice([1, 5, 10, 50, 100, 500])
            material = random.choice(MATERIALS)
            deadline_days = random.randint(7, 30)
            deadline = (datetime.now() + timedelta(days=deadline_days)).isoformat()
            
            # Calculate pay (simple heuristic)
            base_pay = quantity * random.uniform(10, 50)
            suggested_pay = round(base_pay, 2)
            
            job_data = {
                'client_id': client['user_id'],
                'manufacturer_id': mfg['user_id'],
                'title': job_titles[i % len(job_titles)],
                'description': f"Manufacturing job for {job_titles[i % len(job_titles)]}. High quality required.",
                'quantity': quantity,
                'material': material,
                'tolerance_tier': random.choice(['low', 'medium', 'high']),
                'tolerance_thou': round(random.uniform(0.001, 0.010), 3),
                'manufacturing_types': [random.choice(['cnc', '3d_printer', 'injection_molding', 'laser_cutting'])],
                'order_type': random.choice(['open_request', 'closed_request']),
                'status': random.choice(['assigned', 'in_production']),
                'deadline': deadline,
                'suggested_pay': suggested_pay,
                'estimated_completion_days': deadline_days,
            }
            
            # Insert job
            result = supabase.table('jobs').insert(job_data).execute()
            
            if result.data:
                job_id = result.data[0]['id']
                created_jobs.append({
                    'job_id': job_id,
                    'client_id': client['user_id'],
                    'manufacturer_id': mfg['user_id'],
                })
                
                # Create active_job entry
                try:
                    supabase.table('active_jobs').insert({
                        'job_id': job_id,
                        'manufacturer_id': mfg['user_id'],
                        'status': job_data['status'],
                        'completed_quantity': 0,
                    }).execute()
                except:
                    pass
                
                print(f"  ✅ Created job: {job_titles[i % len(job_titles)]} (Qty: {quantity})")
                time.sleep(0.2)
                
        except Exception as e:
            print(f"  ❌ Error creating job {i+1}: {str(e)[:100]}")
    
    return created_jobs

if __name__ == "__main__":
    print("\n🚀 Starting demo data creation...")
    print(f"Supabase URL: {SUPABASE_URL}\n")
    
    # Create users
    manufacturers, clients = create_users()
    
    # Create jobs
    jobs = create_sample_jobs(manufacturers, clients)
    
    # Save credentials
    output = {
        'manufacturers': manufacturers,
        'clients': clients,
        'jobs': jobs,
        'all_passwords': 'Password123!',
    }
    
    with open('supabase/demo_data_output.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print("\n" + "="*60)
    print("✅ COMPLETE!")
    print("="*60)
    print(f"✅ Manufacturers: {len(manufacturers)}")
    print(f"✅ Clients: {len(clients)}")
    print(f"✅ Jobs: {len(jobs)}")
    print(f"\n📁 Full data saved to: supabase/demo_data_output.json")
    print(f"🔑 All passwords: Password123!")


