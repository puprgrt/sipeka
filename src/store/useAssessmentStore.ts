import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ComponentAssessment } from '../types';

export interface AssessmentState {
  // General Info
  schoolName: string;
  buildingName: string;
  npsn: string;
  address: string;
  city: string;
  province: string;
  buildingArea: number;
  floorCount: number;
  latitude: string;
  longitude: string;
  
  // Photos
  photos: string[];

  // Dynamic Fields
  dynamicValues: Record<string, any>;
  
  // Flow context
  step: number;
  isPermohonanFlow: boolean;
  
  // Components
  components: ComponentAssessment[];
  safetyChecks: Record<string, boolean>;
  
  // Methods
  setGeneralInfo: (info: Partial<Omit<AssessmentState, 'components' | 'methods' | 'setGeneralInfo' | 'setComponents' | 'updateComponent' | 'resetForm' | 'setSafetyChecks' | 'addPhoto' | 'removePhoto' | 'setDynamicValue' | 'setStep'>>) => void;
  setComponents: (components: ComponentAssessment[]) => void;
  updateComponent: (name: string, updates: Partial<ComponentAssessment>) => void;
  setSafetyChecks: (checks: Record<string, boolean>) => void;
  addPhoto: (photoUrl: string) => void;
  removePhoto: (index: number) => void;
  setDynamicValue: (key: string, value: any) => void;
  setStep: (step: number) => void;
  resetForm: () => void;
}

const initialState = {
  schoolName: '',
  buildingName: '',
  npsn: '',
  address: '',
  city: '',
  province: '',
  buildingArea: 0,
  floorCount: 1,
  latitude: '',
  longitude: '',
  photos: [],
  dynamicValues: {},
  step: 1,
  isPermohonanFlow: false,
  components: [],
  safetyChecks: {}
};

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setGeneralInfo: (info) => set((state) => ({ ...state, ...info })),
      
      setComponents: (components) => set({ components }),
      
      updateComponent: (name, updates) => set((state) => ({
        components: state.components.map(comp => 
          comp.name === name ? { ...comp, ...updates } : comp
        )
      })),
      
      setSafetyChecks: (checks) => set((state) => ({
        safetyChecks: { ...state.safetyChecks, ...checks }
      })),
      
      addPhoto: (photoUrl) => set((state) => ({
        photos: [...state.photos, photoUrl]
      })),
      
      removePhoto: (index) => set((state) => ({
        photos: state.photos.filter((_, i) => i !== index)
      })),
      
      setDynamicValue: (key, value) => set((state) => ({
        dynamicValues: { ...state.dynamicValues, [key]: value }
      })),
      
      setStep: (step) => set({ step }),

      resetForm: () => set(initialState)
    }),
    {
      name: 'assessment-draft-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({ 
        // We only persist the data fields, we omit step if we want it to always start at step 1 on reload, 
        // but persisting step might be useful.
        schoolName: state.schoolName,
        buildingName: state.buildingName,
        npsn: state.npsn,
        address: state.address,
        city: state.city,
        province: state.province,
        buildingArea: state.buildingArea,
        floorCount: state.floorCount,
        latitude: state.latitude,
        longitude: state.longitude,
        photos: state.photos,
        dynamicValues: state.dynamicValues,
        isPermohonanFlow: state.isPermohonanFlow,
        components: state.components,
        safetyChecks: state.safetyChecks
      }),
    }
  )
);
