'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEMO_MODE, getRevaNotifications, acceptJobForReva, type DemoJob } from '@/lib/demoData';

// Mock recommendations data (same as dashboard)
const mockOpenRequests = [
  { 
    id: '7', 
    clientName: 'Open Project Alpha', 
    deadline: '2026-02-10', 
    quantity: 150,
    suggested_pay: 6750,
    material: '7075 Aluminum',
    tolerance: '±0.005"',
    manufacturing_type: ['CNC Milling'],
    order_type: 'open-request',
  },
  { 
    id: '8', 
    clientName: 'Open Project Beta', 
    deadline: '2026-02-12', 
    quantity: 80,
    suggested_pay: 3200,
    material: 'Delrin (Acetal)',
    tolerance: '±0.003"',
    manufacturing_type: ['CNC Machining'],
    order_type: 'open-request',
  },
  { 
    id: '9', 
    clientName: 'Open Project Gamma', 
    deadline: '2026-02-15', 
    quantity: 200,
    suggested_pay: 8000,
    material: 'Brass',
    tolerance: '±0.002"',
    manufacturing_type: ['CNC Turning'],
    order_type: 'open-request',
  },
];

const mockQuickServices = [
  { id: 'qs1', job: 'Bracket Assembly', estimatedTime: '2 hours', qualityRating: 4.8, payPerProduct: 45, quantity: 1, order_type: 'quick-service', deadline: '2026-02-08', material: '6061-T6 Aluminum' },
  { id: 'qs2', job: 'Casing Component', estimatedTime: '3.5 hours', qualityRating: 4.9, payPerProduct: 68, quantity: 1, order_type: 'quick-service', deadline: '2026-02-09', material: 'ABS Plastic' },
  { id: 'qs3', job: 'Mounting Plate', estimatedTime: '1.5 hours', qualityRating: 4.7, payPerProduct: 32, quantity: 1, order_type: 'quick-service', deadline: '2026-02-07', material: 'Steel' },
  { id: 'qs4', job: 'Support Bracket', estimatedTime: '2.5 hours', qualityRating: 4.6, payPerProduct: 55, quantity: 1, order_type: 'quick-service', deadline: '2026-02-10', material: 'Aluminum' },
];

export default function OpenTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'deadline' | 'pay' | 'quantity'>('deadline');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) {
      // Get all notifications/recommendations that Reva can accept
      const notifications = getRevaNotifications();
      
      // Convert mock recommendations to task format
      const mockTasks = [
        ...mockOpenRequests.map(req => ({
          id: req.id,
          title: req.clientName,
          client_name: req.clientName,
          quantity: req.quantity,
          deadline: req.deadline,
          suggested_pay: req.suggested_pay,
          material: req.material,
          tolerance: req.tolerance,
          manufacturing_type: req.manufacturing_type,
          order_type: req.order_type,
          isMock: true,
        })),
        ...mockQuickServices.map(qs => ({
          id: qs.id,
          title: qs.job,
          client_name: 'Quick Service Client',
          quantity: qs.quantity,
          deadline: qs.deadline,
          suggested_pay: qs.payPerProduct,
          material: qs.material,
          estimatedTime: qs.estimatedTime,
          qualityRating: qs.qualityRating,
          order_type: qs.order_type,
          isMock: true,
        })),
      ];
      
      // Combine notifications and mock recommendations
      const notificationIds = new Set(notifications.map(n => n.id));
      const allTasks = [
        ...notifications,
        ...mockTasks.filter(mt => !notificationIds.has(mt.id)), // Don't duplicate
      ];
      
      // Sort tasks
      const sorted = [...allTasks].sort((a, b) => {
        if (sortBy === 'deadline') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        } else if (sortBy === 'pay') {
          return b.suggested_pay - a.suggested_pay;
        } else {
          return b.quantity - a.quantity;
        }
      });
      
      setTasks(sorted);
      setLoading(false);
      
      // Poll for updates
      const interval = setInterval(() => {
        const updated = getRevaNotifications();
        setTasks([...updated].sort((a, b) => {
          if (sortBy === 'deadline') {
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          } else if (sortBy === 'pay') {
            return b.suggested_pay - a.suggested_pay;
          } else {
            return b.quantity - a.quantity;
          }
        }));
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [sortBy]);

  const handleAccept = (task: any, quantity?: number) => {
    if (DEMO_MODE) {
      // For mock tasks, create recommendation data
      if (task.isMock) {
        const recommendationData = task.order_type === 'quick-service' ? {
          job: task.title,
          clientName: task.client_name,
          type: 'quick-service',
          quantity: task.quantity,
          deadline: task.deadline,
          payPerProduct: task.suggested_pay,
          materials: task.material,
          machine: task.manufacturing_type?.[0] || 'CNC / 3D Printing',
        } : {
          clientName: task.client_name,
          type: 'open-request',
          quantity: task.quantity,
          deadline: task.deadline,
          materials: task.material,
          machine: task.manufacturing_type?.[0] || 'CNC / 3D Printing',
        };
        acceptJobForReva(task.id, quantity, recommendationData);
      } else {
        acceptJobForReva(task.id, quantity);
      }
      setShowDetails(false);
      router.push('/maker/dashboard');
    }
  };

  const handleViewDetails = (task: any) => {
    setSelectedTask(task);
    setShowDetails(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/maker/workflow" className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Workflow
          </Link>
          <h1 className="text-xl font-semibold heading-font">Open Tasks</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Sort Controls */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-[#6b7280] font-medium">Sort by:</span>
          <button
            onClick={() => setSortBy('deadline')}
            className={`px-4 py-2 border transition-colors ${
              sortBy === 'deadline'
                ? 'bg-[#253242] text-white border-[#3a4552]'
                : 'bg-[#1a2332] text-[#9ca3af] border-[#253242] hover:border-[#3a4552]'
            }`}
          >
            Deadline
          </button>
          <button
            onClick={() => setSortBy('pay')}
            className={`px-4 py-2 border transition-colors ${
              sortBy === 'pay'
                ? 'bg-[#253242] text-white border-[#3a4552]'
                : 'bg-[#1a2332] text-[#9ca3af] border-[#253242] hover:border-[#3a4552]'
            }`}
          >
            Pay
          </button>
          <button
            onClick={() => setSortBy('quantity')}
            className={`px-4 py-2 border transition-colors ${
              sortBy === 'quantity'
                ? 'bg-[#253242] text-white border-[#3a4552]'
                : 'bg-[#1a2332] text-[#9ca3af] border-[#253242] hover:border-[#3a4552]'
            }`}
          >
            Quantity
          </button>
        </div>

        {loading ? (
          <div className="bg-[#0a1929] border border-[#1a2332] p-8 text-center text-white">
            Loading open tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-[#0a1929] border border-[#1a2332] p-8 text-center text-white">
            <p className="mb-4">No open tasks available.</p>
            <p className="text-[#9ca3af] text-sm">Check back later or accept recommendations from your dashboard.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-[#0a1929] border border-[#1a2332] p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{task.title || task.client_name}</h3>
                    <p className="text-[#9ca3af] text-sm mb-2">Client: {task.client_name}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-[#9ca3af]">Quantity:</span>
                        <span className="text-white ml-2">{task.quantity}</span>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Deadline:</span>
                        <span className="text-white ml-2">{new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Pay:</span>
                        <span className="text-white ml-2">${task.suggested_pay.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewDetails(task)}
                      className="bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        if (task.order_type === 'open-request') {
                          const quantity = prompt(`How many units can you accept? (Max: ${task.quantity})`);
                          if (quantity && parseInt(quantity) > 0) {
                            handleAccept(task, parseInt(quantity));
                          }
                        } else {
                          handleAccept(task);
                        }
                      }}
                      className="bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors font-medium"
                    >
                      Accept Task
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedTask && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetails(false)}
          >
            <div 
              className="bg-[#0a1929] border border-[#1a2332] max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-white heading-font">Task Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-[#9ca3af] hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">{selectedTask.title || selectedTask.client_name}</h4>
                  <p className="text-[#9ca3af] text-sm">Client: {selectedTask.client_name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#9ca3af]">Order Type:</span>
                    <span className="text-white ml-2 capitalize">{selectedTask.order_type?.replace('-', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Quantity:</span>
                    <span className="text-white ml-2">{selectedTask.quantity}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Material:</span>
                    <span className="text-white ml-2">{selectedTask.material || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Tolerance:</span>
                    <span className="text-white ml-2">{selectedTask.tolerance || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Deadline:</span>
                    <span className="text-white ml-2">{new Date(selectedTask.deadline).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Pay Amount:</span>
                    <span className="text-white ml-2 font-semibold">${selectedTask.suggested_pay.toFixed(2)}</span>
                  </div>
                  {selectedTask.estimatedTime && (
                    <div>
                      <span className="text-[#9ca3af]">Estimated Time:</span>
                      <span className="text-white ml-2">{selectedTask.estimatedTime}</span>
                    </div>
                  )}
                  {selectedTask.qualityRating && (
                    <div>
                      <span className="text-[#9ca3af]">Quality Rating:</span>
                      <span className="text-white ml-2">⭐ {selectedTask.qualityRating}</span>
                    </div>
                  )}
                  {selectedTask.manufacturing_type && (
                    <div className="col-span-2">
                      <span className="text-[#9ca3af]">Manufacturing Type:</span>
                      <span className="text-white ml-2">{selectedTask.manufacturing_type.join(', ')}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-[#253242]">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-3 border border-[#253242] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedTask.order_type === 'open-request') {
                        const quantity = prompt(`How many units can you accept? (Max: ${selectedTask.quantity})`);
                        if (quantity && parseInt(quantity) > 0) {
                          handleAccept(selectedTask, parseInt(quantity));
                        }
                      } else {
                        handleAccept(selectedTask);
                      }
                    }}
                    className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-3 border border-[#3a4552] transition-colors font-medium"
                  >
                    Accept Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


