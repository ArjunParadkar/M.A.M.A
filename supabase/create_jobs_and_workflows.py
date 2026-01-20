#!/usr/bin/env python3
"""
Create Sample Jobs and Generate Workflows
Fetches existing users and creates jobs with workflows
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

MATERIALS = ['PLA', 'ABS', 'PETG', '6061-T6 Aluminum', '316 Stainless Steel', 'ABS Plastic', 'Polycarbonate', 'Resin']

def fetch_existing_users():
    """Fetch existing manufacturers and clients"""
    
    print("="*60)
    print("FETCHING EXISTING USERS")
    print("="*60)
    
    manufacturers = []
    clients = []
    
    try:
        # Fetch manufacturers
        mfg_result = supabase.table('manufacturers').select('id').limit(20).execute()
        if mfg_result.data:
            for mfg in mfg_result.data:
                # Get profile info
                try:
                    profile = supabase.table('profiles').select('*').eq('id', mfg['id']).single().execute()
                    manufacturers.append({
                        'id': mfg['id'],
                        'name': profile.data.get('name', 'Maker'),
                    })
                except:
                    manufacturers.append({
                        'id': mfg['id'],
                        'name': 'Maker',
                    })
        
        # Fetch clients from profiles
        client_profiles = supabase.table('profiles').select('id, name').eq('role', 'client').limit(10).execute()
        if client_profiles.data:
            for profile in client_profiles.data:
                clients.append({
                    'id': profile['id'],
                    'name': profile.get('name', 'Client'),
                })
        
        print(f"  ✅ Found {len(manufacturers)} manufacturers")
        print(f"  ✅ Found {len(clients)} clients")
        
    except Exception as e:
        print(f"  ⚠️  Error fetching users: {str(e)[:100]}")
        # Fallback: use any user IDs we can get
        try:
            users = supabase.auth.admin.list_users()
            for user in users.users[:20]:
                manufacturers.append({'id': user.id, 'name': user.user_metadata.get('full_name', 'Maker')})
            for user in users.users[20:30]:
                clients.append({'id': user.id, 'name': user.user_metadata.get('full_name', 'Client')})
        except:
            pass
    
    return manufacturers, clients

def create_sample_jobs(manufacturers: List[Dict], clients: List[Dict]):
    """Create sample jobs with varied data"""
    
    print("\n" + "="*60)
    print("CREATING SAMPLE JOBS")
    print("="*60)
    
    if not manufacturers or not clients:
        print("  ⚠️  Need at least 1 manufacturer and 1 client to create jobs")
        return []
    
    created_jobs = []
    
    job_templates = [
        {
            "title": "Precision Bracket Assembly",
            "description": "Precision bracket assembly for mounting system. Must maintain ±0.005\" tolerance throughout. Requires smooth finish with no burrs.",
            "quantity": random.choice([5, 10, 25]),
            "material": "6061-T6 Aluminum",
            "manufacturing_types": ["cnc"],
        },
        {
            "title": "Housing Component",
            "description": "Housing component for electronic device enclosure. Requires precise threading for M6 screws. Surface finish must be smooth.",
            "quantity": random.choice([10, 20, 50]),
            "material": "316 Stainless Steel",
            "manufacturing_types": ["cnc", "injection_molding"],
        },
        {
            "title": "Prototype Casing",
            "description": "Prototype casing for industrial sensor housing. Requires 100% infill for structural integrity. Layer height should be 0.2mm maximum.",
            "quantity": random.choice([1, 5, 10]),
            "material": "ABS Plastic",
            "manufacturing_types": ["3d_printer"],
        },
        {
            "title": "Display Cover Plate",
            "description": "Clear cover plate for display module. Must be optically clear with no bubbles or imperfections. Edge chamfers required for safety.",
            "quantity": random.choice([25, 50, 100]),
            "material": "Polycarbonate",
            "manufacturing_types": ["injection_molding", "cnc"],
        },
        {
            "title": "Sensor Mount",
            "description": "Custom sensor mount bracket. Must fit existing mounting points. Material must be corrosion resistant for outdoor use.",
            "quantity": random.choice([10, 20]),
            "material": "316 Stainless Steel",
            "manufacturing_types": ["cnc", "laser_cutting"],
        },
        {
            "title": "Custom Enclosure",
            "description": "Waterproof enclosure for electronic components. Requires precise tolerances and sealed edges.",
            "quantity": random.choice([5, 15, 30]),
            "material": "ABS Plastic",
            "manufacturing_types": ["3d_printer", "injection_molding"],
        },
    ]
    
    # Create 5-8 jobs
    num_jobs = min(8, len(clients) * 2)
    
    for i in range(num_jobs):
        try:
            # Pick random client and manufacturer
            client = random.choice(clients)
            mfg = random.choice(manufacturers)
            
            # Get job template
            template = random.choice(job_templates)
            
            # Calculate pay and deadline
            quantity = template['quantity']
            base_pay = quantity * random.uniform(15, 45)
            suggested_pay = round(base_pay, 2)
            deadline_days = random.randint(7, 30)
            deadline = (datetime.now() + timedelta(days=deadline_days)).isoformat()
            
            # Create job
            job_data = {
                'client_id': client['id'],
                'manufacturer_id': mfg['id'],
                'title': template['title'],
                'description': template['description'],
                'quantity': quantity,
                'material': template['material'],
                'tolerance_tier': random.choice(['low', 'medium', 'high']),
                'tolerance_thou': round(random.uniform(0.001, 0.010), 3),
                'manufacturing_types': template['manufacturing_types'],
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
                    'title': template['title'],
                    'client_id': client['id'],
                    'manufacturer_id': mfg['id'],
                    'quantity': quantity,
                    'status': job_data['status'],
                })
                
                # Create active_job entry
                try:
                    supabase.table('active_jobs').upsert({
                        'job_id': job_id,
                        'manufacturer_id': mfg['id'],
                        'status': job_data['status'],
                        'completed_quantity': 0,
                    }, on_conflict='job_id').execute()
                except Exception as e:
                    print(f"  ⚠️  Active job error: {str(e)[:50]}")
                
                print(f"  ✅ Created job: {template['title']} (Qty: {quantity}, Pay: ${suggested_pay})")
                time.sleep(0.3)
                
        except Exception as e:
            print(f"  ❌ Error creating job {i+1}: {str(e)[:100]}")
    
    return created_jobs

def create_job_assignments(jobs: List[Dict]):
    """Create job assignments for multi-manufacturer jobs (open requests)"""
    
    print("\n" + "="*60)
    print("CREATING JOB ASSIGNMENTS (for open requests)")
    print("="*60)
    
    created_assignments = []
    
    # Get manufacturers
    try:
        mfg_result = supabase.table('manufacturers').select('id').limit(50).execute()
        manufacturers = [m['id'] for m in mfg_result.data] if mfg_result.data else []
    except:
        manufacturers = []
    
    if not manufacturers:
        print("  ⚠️  No manufacturers found for assignments")
        return []
    
    for job in jobs[:5]:  # Create assignments for first 5 jobs
        try:
            # Check if job is open request and has quantity > 10
            if job.get('quantity', 0) > 10:
                # Assign to 2-4 manufacturers
                num_assignments = min(random.randint(2, 4), len(manufacturers))
                assigned_mfgs = random.sample(manufacturers, num_assignments)
                
                total_quantity = job['quantity']
                quantity_per_mfg = total_quantity // num_assignments
                remainder = total_quantity % num_assignments
                
                for idx, mfg_id in enumerate(assigned_mfgs):
                    assigned_qty = quantity_per_mfg + (1 if idx < remainder else 0)
                    delivery_days = random.randint(5, 25)
                    delivery_date = (datetime.now() + timedelta(days=delivery_days)).isoformat()
                    
                    try:
                        supabase.table('job_assignments').insert({
                            'job_id': job['job_id'],
                            'manufacturer_id': mfg_id,
                            'assigned_quantity': assigned_qty,
                            'completed_quantity': 0,
                            'estimated_delivery_date': delivery_date,
                            'status': random.choice(['accepted', 'in_production']),
                        }).execute()
                        
                        created_assignments.append({
                            'job_id': job['job_id'],
                            'manufacturer_id': mfg_id,
                            'quantity': assigned_qty,
                        })
                    except Exception as e:
                        pass  # Skip if error
                
                print(f"  ✅ Created {num_assignments} assignments for job: {job['title']}")
                
        except Exception as e:
            print(f"  ⚠️  Error creating assignments for job {job['job_id']}: {str(e)[:50]}")
    
    return created_assignments

if __name__ == "__main__":
    print("\n🚀 Starting job and workflow creation...")
    print(f"Supabase URL: {SUPABASE_URL}\n")
    
    # Fetch existing users
    manufacturers, clients = fetch_existing_users()
    
    if not manufacturers or not clients:
        print("\n❌ ERROR: Need existing users to create jobs.")
        print("Please run migrations first or create users via sign-up.")
        exit(1)
    
    # Create jobs
    jobs = create_sample_jobs(manufacturers, clients)
    
    # Create job assignments for multi-manufacturer jobs
    assignments = create_job_assignments(jobs)
    
    # Save data
    output = {
        'manufacturers_count': len(manufacturers),
        'clients_count': len(clients),
        'jobs_created': len(jobs),
        'assignments_created': len(assignments),
        'jobs': jobs,
    }
    
    with open('supabase/jobs_workflows_output.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print("\n" + "="*60)
    print("✅ COMPLETE!")
    print("="*60)
    print(f"✅ Jobs created: {len(jobs)}")
    print(f"✅ Assignments created: {len(assignments)}")
    print(f"\n📁 Full data saved to: supabase/jobs_workflows_output.json")
    print(f"\n💡 Workflows will be generated automatically when:")
    print(f"   - Manufacturers view /maker/workflow (F4 AI Scheduling)")
    print(f"   - Clients view /client/jobs/[jobId]/workflow (job assignments)")


