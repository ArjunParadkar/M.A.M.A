"""
F4: Workflow Scheduling API Route
Optimizes manufacturer's task schedule using F4 model
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import sys
import os

# Add models directory to path
models_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
if models_path not in sys.path:
    sys.path.insert(0, models_path)

try:
    from f4_workflow_scheduling import (
        WorkflowSchedulingModel,
        ScheduleInput,
        Task,
        DeviceAvailability,
        ScheduledTask
    )
    F4_MODEL_AVAILABLE = True
except ImportError as e:
    print(f"Warning: F4 model not available: {e}")
    WorkflowSchedulingModel = None
    F4_MODEL_AVAILABLE = False

router = APIRouter()

class TaskData(BaseModel):
    """Task data from frontend"""
    job_id: str
    priority: int
    estimated_hours: float
    deadline: str  # ISO format datetime string
    required_device_types: List[str]
    pay_amount: float
    materials_needed: List[str]
    tolerance_tier: str

class DeviceData(BaseModel):
    """Device data from frontend"""
    device_id: str
    device_type: str
    available_hours_per_day: Dict[str, float]  # {'2026-01-20': 8.0, ...}
    current_tasks: List[str] = []
    efficiency_factor: float = 1.0

class WorkflowRequest(BaseModel):
    """Request for workflow scheduling"""
    tasks: List[TaskData]
    devices: List[DeviceData]
    week_start: str  # ISO format datetime string
    week_end: str  # ISO format datetime string
    manufacturer_capacity_hours_per_day: float = 16.0

@router.post("/")
async def schedule_workflow(request: WorkflowRequest):
    """
    Optimize manufacturer's workflow schedule using F4 model
    """
    try:
        if not F4_MODEL_AVAILABLE or WorkflowSchedulingModel is None:
            # Fallback: Simple scheduling
            return await _fallback_scheduling(request)
        
        # Initialize model
        model = WorkflowSchedulingModel()
        
        # Parse datetimes
        week_start = datetime.fromisoformat(request.week_start.replace('Z', '+00:00'))
        week_end = datetime.fromisoformat(request.week_end.replace('Z', '+00:00'))
        
        # Convert tasks
        tasks = []
        for task_data in request.tasks:
            deadline = datetime.fromisoformat(task_data.deadline.replace('Z', '+00:00'))
            task = Task(
                job_id=task_data.job_id,
                priority=task_data.priority,
                estimated_hours=task_data.estimated_hours,
                deadline=deadline,
                required_device_types=task_data.required_device_types,
                pay_amount=task_data.pay_amount,
                materials_needed=task_data.materials_needed,
                tolerance_tier=task_data.tolerance_tier
            )
            tasks.append(task)
        
        # Convert devices
        devices = []
        for device_data in request.devices:
            # Convert available_hours_per_day to datetime keys
            available_hours = {}
            for date_str, hours in device_data.available_hours_per_day.items():
                available_hours[date_str] = hours
            
            device = DeviceAvailability(
                device_id=device_data.device_id,
                device_type=device_data.device_type,
                available_hours_per_day=available_hours,
                current_tasks=device_data.current_tasks,
                maintenance_scheduled=[],  # TODO: Add maintenance scheduling
                efficiency_factor=device_data.efficiency_factor
            )
            devices.append(device)
        
        # Build schedule input
        schedule_input = ScheduleInput(
            tasks=tasks,
            devices=devices,
            week_start=week_start,
            week_end=week_end,
            manufacturer_capacity_hours_per_day=request.manufacturer_capacity_hours_per_day
        )
        
        # Run scheduling
        result = model.schedule(schedule_input)
        
        # Convert output to JSON-serializable format
        scheduled_tasks = []
        for st in result.scheduled_tasks:
            scheduled_tasks.append({
                'job_id': st.job_id,
                'device_id': st.device_id,
                'start_time': st.start_time.isoformat(),
                'end_time': st.end_time.isoformat(),
                'estimated_completion': st.estimated_completion.isoformat(),
                'priority': st.priority,
                'pay_amount': st.pay_amount,
            })
        
        return {
            'scheduled_tasks': scheduled_tasks,
            'unscheduled_tasks': result.unscheduled_tasks,
            'total_profit': result.total_profit,
            'device_utilization': result.device_utilization,
            'schedule_efficiency': result.schedule_efficiency,
            'conflicts': result.conflicts,
            'model_version': result.model_version,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scheduling workflow: {str(e)}")

async def _fallback_scheduling(request: WorkflowRequest):
    """Fallback scheduling using simple greedy algorithm"""
    # Simple greedy: schedule tasks by priority, first available device
    scheduled = []
    unscheduled = []
    
    # Sort tasks by priority
    tasks_sorted = sorted(request.tasks, key=lambda t: t.priority, reverse=True)
    
    # Track device availability (simplified)
    device_available = {d.device_id: True for d in request.devices}
    
    for task in tasks_sorted:
        # Find compatible device
        compatible_device = None
        for device in request.devices:
            if device.device_id in device_available and device_available[device.device_id]:
                # Check if device type matches
                if any(dt in device.device_type for dt in task.required_device_types):
                    compatible_device = device
                    break
        
        if compatible_device:
            # Simple scheduling: start now, end after estimated hours
            start_time = datetime.now()
            end_time = start_time + timedelta(hours=task.estimated_hours)
            
            scheduled.append({
                'job_id': task.job_id,
                'device_id': compatible_device.device_id,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'estimated_completion': end_time.isoformat(),
                'priority': task.priority,
                'pay_amount': task.pay_amount,
            })
            
            # Mark device as busy (simplified)
            device_available[compatible_device.device_id] = False
        else:
            unscheduled.append(task.job_id)
    
    # Calculate metrics
    total_profit = sum(t.pay_amount for t in tasks_sorted if t.job_id not in unscheduled)
    device_utilization = {d.device_id: 50.0 if d.device_id in [s['device_id'] for s in scheduled] else 0.0 for d in request.devices}
    
    return {
        'scheduled_tasks': scheduled,
        'unscheduled_tasks': unscheduled,
        'total_profit': total_profit,
        'device_utilization': device_utilization,
        'schedule_efficiency': len(scheduled) / len(request.tasks) if request.tasks else 0.0,
        'conflicts': [f"{len(unscheduled)} tasks could not be scheduled"] if unscheduled else [],
        'model_version': 'fallback-v1.0',
    }
