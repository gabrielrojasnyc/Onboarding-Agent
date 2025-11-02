// App.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
// Fix: Removed non-exported type 'LiveSession'.
import { GoogleGenAI, Chat, LiveServerMessage, Modality, Blob } from '@google/genai';
import type { AgentConfig, Message, Task, MapLocation, GroundingChunk, DirectDepositData } from './types';
import { DEFAULT_AGENT_CONFIG, INITIAL_TASKS, AGENT_AVATARS, AGENT_TONES, SendIcon, ThinkingIcon, MenuIcon, MAP_LOCATIONS, SAFETY_DOCUMENT, FacilityFloorPlan, MicrophoneIcon, PriorityIcon, UserLocationIcon, EMPLOYEE_DATA } from './constants';

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Helper & UI Components ---

const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove "data:mime/type;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

const TaskItem: React.FC<{ task: Task; onToggle?: (id: string) => void, isClickable?: boolean }> = ({ task, onToggle, isClickable }) => {
  const isHighPriority = task.priority === 'high';
  const baseClasses = "flex items-start gap-4 p-4 rounded-xl border";
  const stateClasses = task.completed
    ? "opacity-75"
    : isClickable
    ? "hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-colors"
    : "";
  const priorityClasses = isHighPriority && !task.completed
    ? "bg-amber-50/70 border-amber-300"
    : "bg-white border-slate-200/80";

  const content = (
    <>
      <div className={`p-2 rounded-full ${task.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
        <task.icon className="w-6 h-6" />
      </div>
      <div className="flex-grow">
        <h3 className={`font-semibold flex items-center gap-1.5 ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
          {isHighPriority && !task.completed && <PriorityIcon className="w-4 h-4 text-amber-500" />}
          <span>{task.title}</span>
        </h3>
        <p className="text-sm text-slate-500">{task.description}</p>
      </div>
      <div 
        aria-pressed={task.completed}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white'}`}
      >
        {task.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
      </div>
    </>
  );

  if (onToggle) {
    return (
       <button onClick={() => onToggle(task.id)} disabled={!isClickable} className={`${baseClasses} ${stateClasses} ${priorityClasses} w-full text-left disabled:cursor-not-allowed`}>
         {content}
       </button>
    )
  }

  return <div className={`${baseClasses} ${stateClasses} ${priorityClasses}`}>{content}</div>
};

const InteractiveMap: React.FC<{ locations: MapLocation[], onComplete: (taskId: string) => void }> = ({ locations, onComplete }) => {
  const tourStops = useMemo(() => [
    { ...locations.find(l => l.id === 'ppe')!, instruction: 'First, find the PPE Station. Click the pulsing icon.'},
    { ...locations.find(l => l.id === 'workstation')!, instruction: 'Great. Now find your Workstation on the assembly floor.'},
    { ...locations.find(l => l.id === 'first-aid')!, instruction: 'Next, locate the First-Aid Station in the warehouse.'},
    { ...locations.find(l => l.id === 'exit')!, instruction: 'Finally, find the main Emergency Exit.'},
  ], [locations]);

  const [currentStep, setCurrentStep] = useState(0);
  const [stepCompleted, setStepCompleted] = useState(false);
  const activeStop = tourStops[currentStep];

  const handlePointClick = (locationId: string) => {
    if (locationId === activeStop.id) {
      setStepCompleted(true);
    }
  };

  const handleNext = () => {
    if (currentStep < tourStops.length - 1) {
      setCurrentStep(currentStep + 1);
      setStepCompleted(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setStepCompleted(true); // Assume previous step was completed
    }
  };

  return (
    <div className="mt-2 space-y-3">
      <div className="bg-slate-200/50 rounded-lg p-2 border border-slate-200 aspect-video relative">
        <FacilityFloorPlan />
        <svg viewBox="0 0 400 300" className="w-full h-full absolute inset-0 overflow-visible">
            {locations.map(loc => {
            const isPulsing = loc.id === activeStop.id;
            const isSelected = stepCompleted && loc.id === activeStop.id;
            return (
                <g 
                key={loc.id} 
                transform={`translate(${loc.coords.x}, ${loc.coords.y})`}
                onClick={() => handlePointClick(loc.id)}
                className="cursor-pointer group"
                aria-label={loc.label}
                role="button"
                tabIndex={0}
                >
                <circle r="8" fill={isSelected ? '#3b82f6' : '#fff'} stroke="#3b82f6" strokeWidth="1.5" className="transition-all group-hover:fill-blue-200" />
                {isPulsing && !stepCompleted && <circle r="8" fill="#3b82f6" stroke="#3b82f6" strokeWidth="1.5" className="animate-ping" />}
                <loc.icon x="-5" y="-5" className={`w-10 h-10 p-1.5 transition-colors ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                </g>
            )
            })}
        </svg>
      </div>
      
      <div className="h-20 bg-white rounded-lg p-2 border border-slate-200/80 flex flex-col justify-center">
        {!stepCompleted ? (
            <p className="font-semibold text-sm text-center text-slate-700">{activeStop.instruction}</p>
        ) : (
          <>
            <p className="font-semibold text-sm text-slate-800">{activeStop.label}</p>
            <p className="text-xs text-slate-500">{activeStop.description}</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleBack} disabled={currentStep === 0} className="w-full text-center p-2 rounded-lg border-2 transition-all bg-slate-100 border-slate-200 text-slate-700 font-semibold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
          Back
        </button>
        {currentStep < tourStops.length - 1 ? (
          <button onClick={handleNext} disabled={!stepCompleted} className="w-full text-center p-2 rounded-lg border-2 transition-all bg-blue-500 border-blue-600 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        ) : (
          <button onClick={() => onComplete('task-2')} disabled={!stepCompleted} className="w-full text-center p-2 rounded-lg border-2 transition-all bg-green-500 border-green-600 text-white font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Finish Tour
          </button>
        )}
      </div>
    </div>
  )
};

const FacilityMap: React.FC<{ onExpand: () => void }> = ({ onExpand }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const selectedLocation = MAP_LOCATIONS.find(loc => loc.id === selectedLocationId);

  return (
    <div className="flex-grow flex flex-col space-y-2 pt-4 mt-4 border-t border-slate-200 min-h-0">
        <h3 className="font-semibold text-slate-700 text-sm px-1">Facility Map</h3>
        <button onClick={onExpand} className="bg-slate-100 rounded-lg p-2 border border-slate-200/80 flex-grow relative hover:ring-2 hover:ring-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 group">
          <FacilityFloorPlan />
          <svg viewBox="0 0 400 300" className="w-full h-full absolute inset-0 overflow-visible">
            {MAP_LOCATIONS.map(loc => {
                const isSelected = loc.id === selectedLocationId;
                return (
                <g 
                    key={loc.id} 
                    transform={`translate(${loc.coords.x}, ${loc.coords.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLocationId(loc.id)
                    }}
                    className="cursor-pointer"
                >
                    <circle r="8" fill={isSelected ? '#3b82f6' : '#fff'} stroke="#3b82f6" strokeWidth="1.5" />
                    <loc.icon x="-5" y="-5" className={`w-10 h-10 p-1.5 transition-colors ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                </g>
                )
            })}
          </svg>
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white font-bold text-lg">Expand Map</p>
          </div>
        </button>
        <div className="h-16 bg-white rounded-lg p-2 border border-slate-200/80 flex items-center flex-shrink-0">
          {selectedLocation ? (
            <div>
              <p className="font-semibold text-sm text-slate-800">{selectedLocation.label}</p>
              <p className="text-xs text-slate-500">{selectedLocation.description}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic mx-auto">Click a point on the map.</p>
          )}
        </div>
    </div>
  )
};

const ExpandedMapView: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const MAP_VIEWBOX = { width: 400, height: 300 };
  const ZOOM_SCALE = 1.8;

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [currentUserLocationId, setCurrentUserLocationId] = useState('entrance');
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [pathKey, setPathKey] = useState(0);
  
  const selectedLocation = MAP_LOCATIONS.find(loc => loc.id === selectedLocationId);
  const currentUserLocation = MAP_LOCATIONS.find(loc => loc.id === currentUserLocationId)!;

  const resetView = () => {
    setSelectedLocationId(null);
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  useEffect(() => {
    if (isOpen) {
      resetView();
    }
  }, [isOpen]);

  useEffect(() => {
    // Force re-render of path to re-trigger animation
    setPathKey(prev => prev + 1);
  }, [selectedLocationId, currentUserLocationId]);

  const handleLocationSelect = (location: MapLocation) => {
    if (location.id === selectedLocationId) {
      resetView();
      return;
    }
    
    setSelectedLocationId(location.id);

    const targetX = location.coords.x;
    const targetY = location.coords.y;
    const viewCenterX = MAP_VIEWBOX.width / 2;
    const viewCenterY = MAP_VIEWBOX.height / 2;

    setTransform({
      x: viewCenterX - targetX * ZOOM_SCALE,
      y: viewCenterY - targetY * ZOOM_SCALE,
      scale: ZOOM_SCALE,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl h-[90vh] p-4 flex flex-col relative animate-in fade-in zoom-in-95">
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
           {transform.scale > 1 && (
            <button
              onClick={resetView}
              className="py-1.5 px-3 rounded-full bg-slate-800/60 text-white hover:bg-slate-700 transition-colors flex items-center justify-center text-xs font-semibold backdrop-blur-sm"
              aria-label="Reset view"
            >
              Reset View
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/60 text-white hover:bg-slate-700 transition-colors flex items-center justify-center"
            aria-label="Close map"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <div className="flex-grow bg-slate-100 rounded-lg border border-slate-200/80 relative overflow-hidden">
          <svg viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`} className="w-full h-full absolute inset-0">
            <g className="map-transform-group" transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
              <FacilityFloorPlan />
            
              {/* Wayfinding Path */}
              {selectedLocation && (
                <path
                  key={pathKey}
                  d={`M ${currentUserLocation.coords.x} ${currentUserLocation.coords.y} L ${selectedLocation.coords.x} ${selectedLocation.coords.y}`}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  className="wayfinding-path"
                />
              )}
              
              {/* Location Icons */}
              {MAP_LOCATIONS.map(loc => {
                  const isSelected = loc.id === selectedLocationId;
                  return (
                  <g 
                      key={loc.id} 
                      transform={`translate(${loc.coords.x}, ${loc.coords.y})`}
                      onClick={() => handleLocationSelect(loc)}
                      className="cursor-pointer"
                  >
                      <g className="location-icon-group">
                        <circle r="8" fill={isSelected ? '#3b82f6' : '#fff'} stroke="#3b82f6" strokeWidth="1.5" className="transition-all drop-shadow-sm" />
                        <loc.icon x="-5" y="-5" className={`w-10 h-10 p-1.5 transition-colors ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                      </g>
                  </g>
                  )
              })}

              {/* User Location */}
              <g transform={`translate(${currentUserLocation.coords.x}, ${currentUserLocation.coords.y})`}>
                <UserLocationIcon className="w-8 h-8 -translate-x-4 -translate-y-4" />
              </g>
            </g>
          </svg>
        </div>

        <div className="h-24 bg-white flex-shrink-0 pt-3 flex items-center">
            {selectedLocation ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 w-full flex items-center gap-4">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <selectedLocation.icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{selectedLocation.label}</h3>
                  <p className="text-sm text-slate-600">{selectedLocation.description}</p>
                </div>
              </div>
            ) : (
                <p className="text-lg text-slate-500 italic mx-auto">Click a destination to see the route.</p>
            )}
        </div>
      </div>
    </div>
  );
};


const DirectDepositForm: React.FC<{
  data: DirectDepositData;
  onFieldChange: (field: keyof DirectDepositData, value: string) => void;
  onSubmit: () => void;
}> = ({ data, onFieldChange, onSubmit }) => {

  const isFormValid = data.bankName.trim() && data.routingNumber.trim() && data.accountNumber.trim();

  return (
    <div className="mt-2 space-y-3 p-3 bg-white rounded-lg border border-slate-200/80">
      <h4 className="font-semibold text-sm text-slate-800 mb-2">Direct Deposit Details</h4>
      <div className="space-y-3">
        <div>
          <label htmlFor="bankName" className="text-xs font-medium text-slate-600">Bank Name</label>
          <input
            id="bankName"
            type="text"
            value={data.bankName}
            onChange={(e) => onFieldChange('bankName', e.target.value)}
            className="mt-1 w-full bg-slate-50 border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-slate-800"
            placeholder="First National Bank"
          />
        </div>
        <div>
          <label htmlFor="routingNumber" className="text-xs font-medium text-slate-600">Routing Number</label>
          <input
            id="routingNumber"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={data.routingNumber}
            onChange={(e) => onFieldChange('routingNumber', e.target.value.replace(/\D/g, ''))}
            className="mt-1 w-full bg-slate-50 border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-slate-800"
            placeholder="e.g., 123456789"
          />
        </div>
        <div>
          <label htmlFor="accountNumber" className="text-xs font-medium text-slate-600">Account Number</label>
          <input
            id="accountNumber"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={data.accountNumber}
            onChange={(e) => onFieldChange('accountNumber', e.target.value.replace(/\D/g, ''))}
            className="mt-1 w-full bg-slate-50 border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-slate-800"
            placeholder="e.g., 987654321"
          />
        </div>
      </div>
       <button onClick={onSubmit} disabled={!isFormValid} className="w-full flex items-center justify-center gap-2 text-center p-3 mt-4 rounded-lg border-2 transition-all bg-green-500 border-green-600 text-white font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Submit Securely
       </button>
    </div>
  );
};

const DocumentUploader: React.FC<{ label: string; onUpload: (file: File) => void; }> = ({ label, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 text-center p-3 mt-3 rounded-lg border-2 transition-all bg-blue-500 border-blue-600 text-white font-semibold hover:bg-blue-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {label}
      </button>
    </>
  );
};

const UploadProgress: React.FC<{ state: Message['uploadState'] }> = ({ state }) => {
  if (!state) return null;

  const { status, fileName, progress = 0, message } = state;

  const statusConfig = {
    uploading: { text: `Uploading...`, color: 'blue', icon: <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> },
    processing: { text: 'Processing...', color: 'blue', icon: <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> },
    success: { text: message || 'Verified!', color: 'green', icon: <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> },
    error: { text: message || 'Upload Failed', color: 'red', icon: <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> },
  };

  const config = statusConfig[status];
  const barColor = `bg-${config.color}-500`;

  return (
    <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200/80 space-y-2">
      <p className="text-xs font-medium text-slate-500 truncate">{fileName}</p>
      <div className="bg-slate-200 rounded-full h-2 w-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${status === 'uploading' ? progress : 100}%` }}></div>
      </div>
      <div className={`flex items-center gap-2 text-xs font-semibold text-${config.color}-600`}>
        {config.icon}
        <span>{config.text}</span>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message, agentConfig: AgentConfig }> = ({ message, agentConfig }) => {
  const isAgent = message.sender === 'agent';
  const AgentAvatar = useMemo(() => AGENT_AVATARS.find(a => a.id === agentConfig.avatarId)!.component, [agentConfig.avatarId]);
  const options = message.options;
  
  return (
    <div className={`flex items-start gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
      {isAgent && <div className="w-8 h-8 flex-shrink-0 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center p-1 border border-slate-200"><AgentAvatar className="w-full h-full" /></div>}
      <div className={`w-full max-w-xs md:max-w-md p-3 rounded-2xl ${isAgent ? 'bg-slate-100 text-slate-800 rounded-tl-none' : 'bg-blue-500 text-white rounded-br-none'}`}>
        {message.text ? (
           <p className="text-sm">{message.text}</p>
        ) : (
          <p className="text-sm italic text-slate-400">Listening...</p>
        )}
        {message.uploadState && <UploadProgress state={message.uploadState} />}
        {message.document && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200/80 max-h-48 overflow-y-auto">
                <h4 className="font-semibold text-sm text-slate-800 mb-2 sticky top-0 bg-white pb-1">{message.document.title}</h4>
                <p className="text-xs text-slate-600 whitespace-pre-wrap">{message.document.content}</p>
            </div>
        )}
        {options?.type === 'avatar' && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {options.items.map(avatar => {
              const isSelected = agentConfig.avatarId === avatar.id;
              return (
                <button key={avatar.id} onClick={() => options.onSelect(avatar.id)} className={`p-2 rounded-full transition-all ${isSelected ? 'bg-blue-500 text-white ring-2 ring-offset-1 ring-blue-500' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}>
                  <avatar.component className="w-full h-full" />
                </button>
              )
            })}
          </div>
        )}
        {options?.type === 'tone' && (
           <div className="space-y-2 mt-3">
            {options.items.map(tone => {
              const isSelected = agentConfig.toneId === tone.id;
              return (
                 <button key={tone.id} onClick={() => options.onSelect(tone.id)} className={`w-full text-left p-3 rounded-lg border-2 transition-all ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <p className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>{tone.label}</p>
                  <p className="text-xs text-slate-500">{tone.description}</p>
                </button>
              )
            })}
          </div>
        )}
        {options?.type === 'task' && (
          <div className="space-y-2 mt-3">
            {options.items.map(task => (
              <TaskItem key={task.id} task={task} onToggle={options.onSelect} isClickable />
            ))}
          </div>
        )}
        {options?.type === 'task_completion' && (
           <button onClick={() => options.onSelect(options.taskId)} className="w-full text-center p-3 mt-3 rounded-lg border-2 transition-all bg-green-500 border-green-600 text-white font-semibold hover:bg-green-600">
             {options.label}
           </button>
        )}
         {options?.type === 'document_actions' && (
            <div className="flex flex-col space-y-2 mt-3">
                {options.actions.map(action => (
                    <button key={action.id} onClick={() => options.onSelect(action.id)} className="w-full text-left p-3 rounded-lg border-2 transition-all bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/50">
                        <p className="font-semibold text-sm text-center text-blue-700">{action.label}</p>
                    </button>
                ))}
            </div>
        )}
        {options?.type === 'priority_selection' && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => options.onSelect('high')} className="w-full text-center p-2 rounded-lg border-2 transition-all bg-amber-100 border-amber-300 text-amber-800 font-semibold hover:bg-amber-200">
                Yes, high priority
            </button>
            <button onClick={() => options.onSelect('normal')} className="w-full text-center p-2 rounded-lg border-2 transition-all bg-white border-slate-200 text-slate-700 font-semibold hover:bg-slate-100">
                No, normal priority
            </button>
          </div>
        )}
        {options?.type === 'interactive_map' && (
          <InteractiveMap locations={options.locations} onComplete={options.onComplete} />
        )}
        {options?.type === 'direct_deposit' && (
          <DirectDepositForm data={options.data} onFieldChange={options.onFieldChange} onSubmit={options.onSubmit} />
        )}
        {options?.type === 'document_upload' && (
          <DocumentUploader label={options.label} onUpload={options.onUpload} />
        )}
         {options?.type === 'request_location' && (
           <button onClick={options.onAllow} className="w-full text-center p-3 mt-3 rounded-lg border-2 transition-all bg-blue-500 border-blue-600 text-white font-semibold hover:bg-blue-600">
             {options.label}
           </button>
        )}
        {message.groundingChunks && message.groundingChunks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2">
            <p className="text-xs font-semibold text-slate-500">Sources:</p>
            <ul className="space-y-1.5">
              {message.groundingChunks.map((chunk, index) => {
                const source = chunk.maps || chunk.web;
                if (!source || !source.uri) return null;
                return (
                  <li key={index}>
                    <a
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                    >
                      <svg className="w-3 h-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>
                      <span className="truncate">{source.title || source.uri}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const ConfirmationDialog: React.FC<{
  isOpen: boolean;
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, taskTitle, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center animate-in fade-in zoom-in-95">
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Confirm Completion</h3>
        <p className="text-sm text-slate-500 mt-2">
          Have you finished the "<strong>{taskTitle}</strong>" task?
        </p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={onCancel}
            className="p-3 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="p-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
          >
            Yes, I'm done
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Task Walkthrough Content ---
const TASK_WALKTHROUGHS: Record<string, { steps?: string[], completionLabel: string }> = {
  'task-1': {
    steps: [
      "Great choice, safety first! You'll need to go to the PPE station, which is located right next to the main warehouse entrance.",
      "Please pick up a hard hat, safety glasses, and a high-visibility vest. Let me know once you have all your gear."
    ],
    completionLabel: "All done, I have my gear"
  },
  'task-2': {
    completionLabel: "Okay, I've finished the tour"
  },
  'task-3': {
    steps: [
      "This is important for getting paid correctly! The time clock is near the employee entrance.",
      "To clock in or out, just scan your employee badge. Make sure you hear the confirmation beep. You'll do this at the start and end of every shift."
    ],
    completionLabel: "Got it, I know how to clock in"
  },
  'task-4': {
    steps: [
      "Let's get you introduced. Your supervisor is the go-to person for any questions about your work.",
      "Find them on the facility floor—they'll be wearing a different colored vest. Just introduce yourself and let them know it's your first day."
    ],
    completionLabel: "I've met my supervisor"
  },
  'task-5': {
    completionLabel: "Great, I've found a spot!"
  },
  'task-6': {
    completionLabel: "Okay, I've reviewed the document"
  },
  'task-7': {
    completionLabel: "My direct deposit is set up"
  },
  'task-8': {
    completionLabel: "My I-9 form is uploaded"
  },
};


// --- Main App Component ---

type TaskFilterType = 'all' | 'high' | 'completed' | 'incomplete';

const TaskFilter: React.FC<{
  currentFilter: TaskFilterType;
  onFilterChange: (filter: TaskFilterType) => void;
}> = ({ currentFilter, onFilterChange }) => {
  const filters: { id: TaskFilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'high', label: 'High Priority' },
    { id: 'incomplete', label: 'To Do' },
    { id: 'completed', label: 'Done' },
  ];

  return (
    <div className="flex items-center gap-2 pt-3 pb-2 flex-wrap">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
            currentFilter === filter.id
              ? 'bg-blue-500 text-white'
              : 'bg-slate-200/80 text-slate-600 hover:bg-slate-300'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};


export default function App() {
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(true);
  const [geminiChat, setGeminiChat] = useState<Chat | null>(null);
  const [taskToConfirm, setTaskToConfirm] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTaskContext, setCurrentTaskContext] = useState<{ taskId: string; content: string } | null>(null);
  const [directDepositData, setDirectDepositData] = useState<DirectDepositData>({ bankName: '', routingNumber: '', accountNumber: '' });
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>('all');
  
  const [onboardingStage, setOnboardingStage] = useState<'greeting' | 'avatar_selection' | 'tone_selection' | 'task_review' | 'chatting'>('greeting');

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  // Live API state
  const [isListening, setIsListening] = useState(false);
  // Fix: The 'LiveSession' type is not exported, so we use 'any'.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioResourcesRef = useRef<{
    inputAudioContext: AudioContext,
    scriptProcessor: ScriptProcessorNode,
    stream: MediaStream,
    outputAudioContext: AudioContext,
    outputNode: GainNode,
    sources: Set<AudioBufferSourceNode>
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const AgentAvatar = useMemo(() => AGENT_AVATARS.find(a => a.id === agentConfig.avatarId)!.component, [agentConfig.avatarId]);
  
  const { width } = useWindowSize();
  const isDesktop = width >= 768;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  const addAgentMessage = (message: Omit<Message, 'sender' | 'id'>) => {
    setIsAgentTyping(false);
    setMessages(prev => [...prev, { ...message, id: Date.now().toString(), sender: 'agent' }]);
  };

  const updateAgentMessage = (id: string, update: Partial<Message>) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, ...update } : msg));
  }

  const startAgentTyping = (delay = 1000) => {
    return new Promise(resolve => {
      setIsAgentTyping(true);
      setTimeout(resolve, delay);
    });
  }

  const requestTaskCompletion = (taskId: string) => {
    setTaskToConfirm(taskId);
  };
  
  const handleLocationRequest = async () => {
    setMessages(prev => prev.filter(m => m.options?.type !== 'request_location'));
    await startAgentTyping();

    if (!navigator.geolocation) {
      addAgentMessage({ text: "Sorry, your browser doesn't support geolocation. I can't find places nearby without it." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        addAgentMessage({ text: "Thanks! Looking for lunch spots near you..." });
        await startAgentTyping();

        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "What good, quick lunch spots are nearby?",
            config: {
              tools: [{googleMaps: {}}],
              toolConfig: {
                retrievalConfig: {
                  latLng: { latitude, longitude }
                }
              }
            },
          });
          
          const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

          addAgentMessage({
            text: response.text,
            groundingChunks,
          });

          await startAgentTyping();
          addAgentMessage({
            options: {
              type: 'task_completion',
              taskId: 'task-5',
              label: TASK_WALKTHROUGHS['task-5'].completionLabel,
              onSelect: requestTaskCompletion,
            }
          });

        } catch (error) {
          console.error("Gemini API error with Maps Grounding:", error);
          addAgentMessage({ text: "Sorry, I ran into an issue looking up places. Please try again later." });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        addAgentMessage({ text: "I couldn't get your location. Please make sure you've granted permission and try the task again." });
      }
    );
  };

  const handleDocumentAction = async (actionId: string) => {
    setMessages(prev => prev.filter(m => m.options?.type !== 'document_actions'));

    if (actionId === 'summarize') {
        await startAgentTyping();
        addAgentMessage({ text: "Sure, here are the key points from the safety document:"});
        setIsAgentTyping(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: `Please summarize the key points of the following safety document in a few bullet points:\n\n${SAFETY_DOCUMENT.content}`
            });
            addAgentMessage({ text: response.text });
            await startAgentTyping();
            addAgentMessage({
                options: {
                    type: 'task_completion',
                    taskId: 'task-6',
                    label: TASK_WALKTHROUGHS['task-6'].completionLabel,
                    onSelect: requestTaskCompletion,
                }
            });
        } catch (error) {
            console.error("Gemini summarization error:", error);
            addAgentMessage({ text: "Sorry, I had trouble summarizing that. You can still ask me questions about it or mark it as complete." });
        }
    } else if (actionId === 'confirm') {
        requestTaskCompletion('task-6');
    }
  };

  const handleDirectDepositChange = (field: keyof DirectDepositData, value: string) => {
    const newDirectDepositData = { ...directDepositData, [field]: value };
    setDirectDepositData(newDirectDepositData);
    // Update the form in the message history in real-time
    setMessages(prev => prev.map(msg => 
        msg.options?.type === 'direct_deposit' 
        ? { ...msg, options: { ...msg.options, data: newDirectDepositData } } 
        : msg
    ));
  };
  
  const handleDirectDepositSubmit = async () => {
    setMessages(prev => prev.filter(m => m.options?.type !== 'direct_deposit'));
    await startAgentTyping();
    addAgentMessage({ text: "Submitting your details securely..." });
    await startAgentTyping(1500); // Simulate network request
    addAgentMessage({ text: "Your direct deposit information has been saved! You're all set for payday." });
    // Reset form state for potential future use
    setDirectDepositData({ bankName: '', routingNumber: '', accountNumber: '' });
    handleCompleteTask('task-7');
  };

  const handleFileUpload = async (file: File) => {
    // Remove the upload button message
    setMessages(prev => prev.filter(m => m.options?.type !== 'document_upload'));

    // Add a new message to show upload progress
    const uploadMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: uploadMsgId,
      sender: 'agent',
      uploadState: { status: 'uploading', fileName: file.name, progress: 0 }
    }]);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === uploadMsgId && msg.uploadState && msg.uploadState.progress! < 90) {
                return { ...msg, uploadState: { ...msg.uploadState, progress: msg.uploadState.progress! + 10 }};
            }
            return msg;
        }));
    }, 100);

    await new Promise(resolve => setTimeout(resolve, 1000));
    clearInterval(progressInterval);

    // Set progress to 100% and change state to processing
    updateAgentMessage(uploadMsgId, { uploadState: { status: 'processing', fileName: file.name, progress: 100 } });
    
    try {
      const base64Data = await fileToBase64(file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const imagePart = { inlineData: { mimeType: file.type, data: base64Data } };
      const textPart = { text: "Is this image a completed I-9 form? Look for headings like 'Employment Eligibility Verification' and signatures. Answer with a simple 'Yes' or 'No'." };
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [imagePart, textPart] }
      });
      
      if (response.text.toLowerCase().startsWith('yes')) {
        updateAgentMessage(uploadMsgId, { uploadState: { status: 'success', fileName: file.name, message: 'Verified!' } });
        await startAgentTyping();
        addAgentMessage({ text: "Thanks, I've verified your I-9 form. Everything looks good!" });
        handleCompleteTask('task-8');
      } else {
        updateAgentMessage(uploadMsgId, { uploadState: { status: 'error', fileName: file.name, message: 'Incorrect document' } });
        await startAgentTyping();
        addAgentMessage({ text: "It looks like that might be the wrong document. Please make sure you upload the completed I-9 form. Let's try that again." });
        await startAgentTyping();
        addAgentMessage({
          options: {
            type: 'document_upload',
            label: 'Upload I-9 Form',
            onUpload: handleFileUpload
          }
        });
      }

    } catch (error) {
      console.error("Gemini document verification error:", error);
      updateAgentMessage(uploadMsgId, { uploadState: { status: 'error', fileName: file.name, message: 'Processing failed' } });
      addAgentMessage({ text: "Sorry, I ran into an issue verifying your document. Please try again." });
    }
  };

  const executeTaskWalkthrough = async (taskId: string) => {
    const task = TASK_WALKTHROUGHS[taskId];
    if (!task) return;

    if (taskId === 'task-8') {
      await startAgentTyping();
      addAgentMessage({ text: "Next, you'll need to upload your completed I-9 form. This is used to verify your identity and employment authorization." });
      await startAgentTyping();
      addAgentMessage({
        options: {
          type: 'document_upload',
          label: 'Upload I-9 Form',
          onUpload: handleFileUpload
        }
      });
      return;
    }

    if (taskId === 'task-5') {
      await startAgentTyping();
      addAgentMessage({
        text: "Sure thing. To find places nearby, I'll need to access your device's location. Is that okay?",
        options: {
          type: 'request_location',
          label: 'Yes, share my location',
          onAllow: handleLocationRequest,
        }
      });
      return;
    }
    
    if (taskId === 'task-6') {
      await startAgentTyping();
      setCurrentTaskContext({ taskId, content: SAFETY_DOCUMENT.content });
      addAgentMessage({
          text: "Okay, it's crucial to understand our safety protocols. Please take a moment to read through this document.",
          document: {
              title: SAFETY_DOCUMENT.title,
              content: SAFETY_DOCUMENT.content
          }
      });
      await startAgentTyping();
      addAgentMessage({
          options: {
              type: 'document_actions',
              actions: [
                  { id: 'summarize', label: 'Summarize the key points' },
                  { id: 'confirm', label: "I've read it, I'm done" }
              ],
              onSelect: handleDocumentAction
          }
      });
      return;
    }

    if (taskId === 'task-7') {
      await startAgentTyping();
      addAgentMessage({ text: "Let's set up your direct deposit. Please fill out the secure form below. This information is encrypted and sent directly to payroll." });
      await startAgentTyping();
      addAgentMessage({
        options: {
          type: 'direct_deposit',
          data: directDepositData,
          onFieldChange: handleDirectDepositChange,
          onSubmit: handleDirectDepositSubmit
        }
      });
      return;
    }

    if (taskId === 'task-2') {
      await startAgentTyping();
      addAgentMessage({
        text: "Alright, let's get you familiar with the facility. Follow the steps in the interactive tour below to learn about key locations.",
        options: {
          type: 'interactive_map',
          locations: MAP_LOCATIONS,
          onComplete: requestTaskCompletion,
        }
      });
      return;
    }

    if (task.steps) {
      for (const step of task.steps) {
        await startAgentTyping();
        addAgentMessage({ text: step });
      }
    }
    
    await startAgentTyping();
    addAgentMessage({
      options: {
        type: 'task_completion',
        taskId,
        label: task.completionLabel,
        onSelect: requestTaskCompletion,
      }
    });
  }

  const handlePrioritySelection = (taskId: string, priority: 'high' | 'normal') => {
    setMessages(prev => prev.filter(m => m.options?.type !== 'priority_selection'));
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, priority } : t
    ));
    executeTaskWalkthrough(taskId);
  };

  const handleStartTaskWalkthrough = async (taskId: string) => {
    setMessages(prev => prev.filter(m => m.options?.type !== 'task'));
    await startAgentTyping();
    addAgentMessage({
      text: "Got it. Is this a high-priority task for you right now?",
      options: {
        type: 'priority_selection',
        taskId,
// Fix: The `onSelect` handler for priority selection expects a function that takes only `priority` as an argument. Wrap `handlePrioritySelection` in an arrow function to capture the `taskId` from the current scope and pass it along with the priority.
        onSelect: (priority) => handlePrioritySelection(taskId, priority),
      }
    });
  };
  
  const handleCompleteTask = async (taskId: string) => {
    setTaskToConfirm(null);
    setCurrentTaskContext(null);

    const updatedTasks = tasks.map(t => (t.id === taskId ? { ...t, completed: true } : t));
    setTasks(updatedTasks);
    
    setMessages(prev => prev.filter(m => 
      m.options?.type !== 'task_completion' && 
      m.options?.type !== 'interactive_map' &&
      m.options?.type !== 'document_actions' &&
      m.options?.type !== 'direct_deposit'
    ));

    await startAgentTyping();
    addAgentMessage({ text: "Excellent! One task down." });

    const remainingTasks = updatedTasks.filter(t => !t.completed);
    
    if (remainingTasks.length > 0) {
      await startAgentTyping();
      promptNextTask(remainingTasks);
    } else {
      await startAgentTyping();
      addAgentMessage({ text: "Congratulations, you've completed all of your first day tasks! You're all set. Feel free to ask me anything else you need." });
    }
  };

  const promptNextTask = (tasksToShow: Task[]) => {
      addAgentMessage({
        text: "What would you like to tackle next?",
        options: {
          type: 'task',
          items: tasksToShow,
          onSelect: handleStartTaskWalkthrough
        }
      });
  };

  useEffect(() => {
    const runOnboarding = async () => {
      await startAgentTyping(1500);
      
      switch(onboardingStage) {
        case 'greeting':
          addAgentMessage({ text: `Welcome, ${EMPLOYEE_DATA.name}! I'm ${agentConfig.name}, your personal onboarding agent, here to help you get started as our new ${EMPLOYEE_DATA.role}. To get started, let's personalize your experience.` });
          setOnboardingStage('avatar_selection');
          break;
        case 'avatar_selection':
          addAgentMessage({ 
            text: 'First, choose an avatar you like.',
            options: {
              type: 'avatar',
              items: AGENT_AVATARS,
              onSelect: (avatarId) => {
                setAgentConfig(c => ({...c, avatarId}));
                setOnboardingStage('tone_selection');
              }
            }
          });
          break;
        case 'tone_selection':
          addAgentMessage({ 
            text: "Great choice! Now, how should I talk to you? Pick a tone that you prefer.",
            options: {
              type: 'tone',
              items: AGENT_TONES,
              onSelect: (toneId) => {
                setAgentConfig(c => ({...c, toneId}));
                setOnboardingStage('task_review');
              }
            }
          });
          break;
        case 'task_review':
          addAgentMessage({ text: "Perfect! We're all set up. Here are your first day tasks. Which one would you like to start with?" });
          await startAgentTyping();
          promptNextTask(tasks.filter(t => !t.completed));
          setOnboardingStage('chatting');
          break;
        case 'chatting': {
          if (geminiChat) {
            setIsAgentTyping(false);
            return;
          };
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
          const selectedTone = AGENT_TONES.find(t => t.id === agentConfig.toneId)!.promptValue;
          const systemInstruction = `You are ${agentConfig.name}, a helpful onboarding agent for new hires at a manufacturing company. Your tone should be ${selectedTone}. Your primary goal is to help new hires find information about their first day, including safety procedures, facility layout, clocking in/out, and meeting their supervisor. You will also guide them through their tasks. Keep responses concise, clear, and prioritize safety. Do not answer questions outside of the manufacturing and onboarding context.`;
          const chat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
          setGeminiChat(chat);
          setIsAgentTyping(false);
          break;
        }
      }
    };
    runOnboarding();
  }, [onboardingStage, agentConfig.avatarId, agentConfig.toneId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAgentTyping) return;

    const userMessage: Message = { id: Date.now().toString(), text: userInput, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = userInput;
    setUserInput('');
    setIsAgentTyping(true);

    try {
      let responseText = '';
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      if (currentTaskContext?.taskId === 'task-6' && currentTaskContext.content) {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-pro',
              contents: `CONTEXT: You are an onboarding agent. A new hire is asking a question about a safety document. Based *only* on the document provided below, answer their question. If the answer is not in the document, say "I can't find that information in the safety document, but I can check with a supervisor for you."\n\nDOCUMENT:\n"""\n${currentTaskContext.content}\n"""\n\nQUESTION: ${currentInput}`
          });
          responseText = response.text;
      } else if (geminiChat) {
          const response = await geminiChat.sendMessage({ message: currentInput });
          responseText = response.text;
      } else {
          throw new Error("Chat not initialized and no task context available.");
      }
      addAgentMessage({ text: responseText });
    } catch (error) {
        console.error("Gemini API error:", error);
        addAgentMessage({ text: "Sorry, I'm having trouble connecting. Please try again later." });
    } finally {
        setIsAgentTyping(false);
    }
  };

  const handleToggleVoiceChat = async () => {
    if (isListening) {
      if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
      }
      if (audioResourcesRef.current) {
        audioResourcesRef.current.scriptProcessor.disconnect();
        audioResourcesRef.current.stream.getTracks().forEach(track => track.stop());
        audioResourcesRef.current.inputAudioContext.close();
        audioResourcesRef.current.outputAudioContext.close();
        audioResourcesRef.current = null;
      }
      setIsListening(false);
      return;
    }

    setIsListening(true);
    let nextStartTime = 0;
    const LIVE_USER_MSG_ID = 'live-user-message';
    const LIVE_AGENT_MSG_ID = 'live-agent-message';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const AudioCtxt = window.AudioContext || (window as any).webkitAudioContext;
        const inputAudioContext = new AudioCtxt({ sampleRate: 16000 });
        const outputAudioContext = new AudioCtxt({ sampleRate: 24000 });
        const outputNode = outputAudioContext.createGain();
        const sources = new Set<AudioBufferSourceNode>();
        
        const selectedTone = AGENT_TONES.find(t => t.id === agentConfig.toneId)!.promptValue;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    const source = inputAudioContext.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.destination);
                    
                    audioResourcesRef.current = {
                        inputAudioContext, scriptProcessor, stream,
                        outputAudioContext, outputNode, sources
                    };
                },
                onmessage: async (message: LiveServerMessage) => {
                  if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        setMessages(prev => {
                            const lastMsg = prev[prev.length - 1];
                            if (lastMsg?.id === LIVE_USER_MSG_ID) {
                                return [...prev.slice(0, -1), { ...lastMsg, text: (lastMsg.text || '') + text }];
                            }
                            return [...prev, { id: LIVE_USER_MSG_ID, sender: 'user', text }];
                        });
                    }

                    if (message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                        setMessages(prev => {
                            const lastMsg = prev[prev.length - 1];
                            if (lastMsg?.id === LIVE_AGENT_MSG_ID) {
                                return [...prev.slice(0, -1), { ...lastMsg, text: (lastMsg.text || '') + text }];
                            }
                            const cleanedPrev = prev.filter(m => m.id !== LIVE_USER_MSG_ID || m.text);
                            return [...cleanedPrev, { id: LIVE_AGENT_MSG_ID, sender: 'agent', text }];
                        });
                    }
                     if (message.serverContent?.turnComplete) {
                        setMessages(prev => prev.map(m => (
                            m.id === LIVE_USER_MSG_ID || m.id === LIVE_AGENT_MSG_ID 
                            ? { ...m, id: Date.now().toString() + Math.random() } 
                            : m
                        )).filter(m => m.text));
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputNode);
                        outputNode.connect(outputAudioContext.destination);
                        source.addEventListener('ended', () => { sources.delete(source); });
                        source.start(nextStartTime);
                        nextStartTime += audioBuffer.duration;
                        sources.add(source);
                    }
                    if (message.serverContent?.interrupted) {
                        for (const source of sources.values()) {
                            source.stop();
                        }
                        sources.clear();
                        nextStartTime = 0;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live API Error:', e);
                    addAgentMessage({text: "Sorry, the voice connection failed."});
                    handleToggleVoiceChat();
                },
                onclose: () => {
                  setIsListening(false);
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction: `You are ${agentConfig.name}, a helpful onboarding agent. Your tone is ${selectedTone}. Keep responses concise and helpful.`,
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
        });
        sessionPromiseRef.current = sessionPromise;
    } catch (error) {
        console.error('Error starting voice chat:', error);
        addAgentMessage({text: "Sorry, I couldn't access the microphone."});
        setIsListening(false);
    }
  };

  const isChatReady = onboardingStage === 'chatting';
  const filteredAndSortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
        return 0;
    });

    if (taskFilter === 'all') {
      return sorted;
    }
    
    return sorted.filter(task => {
        switch (taskFilter) {
            case 'high':
                return task.priority === 'high' && !task.completed;
            case 'completed':
                return task.completed;
            case 'incomplete':
                return !task.completed;
            default:
                return true;
        }
    });
  }, [tasks, taskFilter]);
  
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm md:max-w-4xl h-[800px] md:h-[700px] bg-white rounded-[40px] shadow-2xl overflow-hidden border-[14px] border-slate-900 relative flex flex-col md:flex-row">
        
        <aside 
          className={`
            transition-all duration-300 ease-in-out 
            bg-slate-50 border-r border-slate-200 
            overflow-y-auto flex-shrink-0 hidden md:flex flex-col
            ${isSidebarOpen ? 'md:w-80 p-4' : 'md:w-0'} 
          `}
        >
          <div className="flex-shrink-0">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="font-bold text-lg text-slate-800">Your First Day Tasks</h3>
            </div>
            <TaskFilter currentFilter={taskFilter} onFilterChange={setTaskFilter} />
            <div className="pt-2 space-y-3">
              {filteredAndSortedTasks.length > 0 ? (
                  filteredAndSortedTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={handleStartTaskWalkthrough} 
                      isClickable={!task.completed && !isAgentTyping && !isListening}
                    />
                  ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4 italic">No tasks match this filter.</p>
              )}
            </div>
          </div>
          {isDesktop && <FacilityMap onExpand={() => setIsMapExpanded(true)} />}
        </aside>

        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <header className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <button 
              aria-label="Toggle task sidebar"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block p-2 rounded-md hover:bg-slate-200 transition-colors"
            >
              <MenuIcon className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full p-1 border-2 border-slate-200 shadow-sm flex-shrink-0">
                <AgentAvatar className="w-full h-full text-slate-700" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{agentConfig.name}</h2>
                <p className="text-sm text-slate-500">{agentConfig.persona}</p>
              </div>
            </div>
          </header>

          {onboardingStage === 'chatting' && (
            <div className="md:hidden p-4 bg-white border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Your First Day Tasks</h3>
              <TaskFilter currentFilter={taskFilter} onFilterChange={setTaskFilter} />
              <div className="space-y-3 pt-2">
                {filteredAndSortedTasks.length > 0 ? (
                  filteredAndSortedTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={handleStartTaskWalkthrough} 
                      isClickable={!task.completed && !isAgentTyping && !isListening}
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4 italic">No tasks match this filter.</p>
                )}
              </div>
            </div>
          )}
          
          <main className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-4">
              {messages.map(msg => <MessageBubble key={msg.id} message={msg} agentConfig={agentConfig} />)}
              {isAgentTyping && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex-shrink-0 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center p-1 border border-slate-200"><AgentAvatar className="w-full h-full" /></div>
                  <div className="p-3 bg-slate-100 rounded-2xl rounded-tl-none"><ThinkingIcon className="w-8 h-4 text-slate-400" /></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>
          
          <footer className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={isListening ? 'Listening... speak now.' : userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={isChatReady ? "Ask a question..." : "Please complete the setup..."}
                className="w-full bg-slate-100 border-transparent rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={!isChatReady || isAgentTyping || isListening}
              />
              <button
                type="button"
                onClick={handleToggleVoiceChat}
                disabled={!isChatReady || isAgentTyping}
                className={`p-3 rounded-lg disabled:bg-slate-300 transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}
                aria-label={isListening ? 'Stop Listening' : 'Start Listening'}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
              <button type="submit" disabled={!isChatReady || isAgentTyping || isListening || !userInput.trim()} className="p-3 bg-blue-500 text-white rounded-lg disabled:bg-slate-300 transition-colors">
                <SendIcon className="w-5 h-5" />
              </button>
            </form>
          </footer>
        </div>

        <ConfirmationDialog
          isOpen={!!taskToConfirm}
          taskTitle={tasks.find(t => t.id === taskToConfirm)?.title || ''}
          onConfirm={() => handleCompleteTask(taskToConfirm!)}
          onCancel={() => setTaskToConfirm(null)}
        />
        <ExpandedMapView isOpen={isMapExpanded} onClose={() => setIsMapExpanded(false)} />
      </div>
    </div>
  );
}