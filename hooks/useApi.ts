// hooks/useApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parcelAPI, authAPI, merchantAPI, analyticsAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'

// Parcel Hooks
export const useParcels = (params?: any) => {
  return useQuery({
    queryKey: ['parcels', params],
    queryFn: async () => {
      const response = await parcelAPI.getAll(params)
      return response.data.parcels || []
    },
    staleTime: 30000, // 30 seconds
  })
}

export const useParcel = (id: string) => {
  return useQuery({
    queryKey: ['parcel', id],
    queryFn: async () => {
      const response = await parcelAPI.getById(id)
      return response.data
    },
    enabled: !!id,
  })
}

export const useCreateParcel = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => parcelAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] })
      toast.success('Parcel created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create parcel')
    },
  })
}

export const useUpdateParcel = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      parcelAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] })
      queryClient.invalidateQueries({ queryKey: ['parcel', variables.id] })
      toast.success('Parcel updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update parcel')
    },
  })
}

// Analytics Hooks
// export const useDashboardAnalytics = () => {
//   return useQuery({
//     queryKey: ['dashboard-analytics'],
//     queryFn: async () => {
//       const response = await analyticsAPI.dashboard()
//       return response.data
//     },
//     refetchInterval: 30000, // Refresh every 30 seconds
//   })
// }


// hooks/useApi.ts - Add error handling for billing analytics
export const useDashboardAnalytics = () => {
  return useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.dashboard()
        return response.data
      } catch (error) {
        console.error('Failed to fetch dashboard analytics:', error)
        // Return default values instead of throwing
        return {
          overview: {
            totalParcels: 0,
            deliveredToday: 0,
            pendingPickup: 0,
            codCollected: 0
          },
          statusDistribution: {},
          recentActivity: []
        }
      }
    },
    refetchInterval: 30000,
    retry: 1,
    retryDelay: 1000
  })
}



// Merchant Hooks
export const useMerchantProfile = () => {
  return useQuery({
    queryKey: ['merchant-profile'],
    queryFn: async () => {
      const response = await merchantAPI.getProfile()
      return response.data
    },
  })
}

export const useUpdateMerchantProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => merchantAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    },
  })
}







































// // hooks/useApi.ts
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { parcelAPI, authAPI, merchantAPI, analyticsAPI } from '@/lib/api'
// import { toast } from 'react-hot-toast'

// // Parcel Hooks
// export const useParcels = (params?: any) => {
//   return useQuery({
//     queryKey: ['parcels', params],
//     queryFn: async () => {
//       const response = await parcelAPI.getAll(params)
//       return response.data.parcels
//     }
//   })
// }

// export const useParcel = (id: string) => {
//   return useQuery({
//     queryKey: ['parcel', id],
//     queryFn: async () => {
//       const response = await parcelAPI.getById(id)
//       return response.data
//     },
//     enabled: !!id
//   })
// }

// export const useCreateParcel = () => {
//   const queryClient = useQueryClient()
  
//   return useMutation({
//     mutationFn: (data: any) => parcelAPI.create(data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['parcels'] })
//       toast.success('Parcel created successfully')
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.error || 'Failed to create parcel')
//     }
//   })
// }

// export const useUpdateParcel = () => {
//   const queryClient = useQueryClient()
  
//   return useMutation({
//     mutationFn: ({ id, data }: { id: string; data: any }) => 
//       parcelAPI.update(id, data),
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({ queryKey: ['parcels'] })
//       queryClient.invalidateQueries({ queryKey: ['parcel', variables.id] })
//       toast.success('Parcel updated successfully')
//     }
//   })
// }

// // Analytics Hooks
// export const useDashboardAnalytics = () => {
//   return useQuery({
//     queryKey: ['dashboard-analytics'],
//     queryFn: async () => {
//       const response = await analyticsAPI.dashboard()
//       return response.data
//     },
//     refetchInterval: 30000 // Refresh every 30 seconds
//   })
// }

// // Merchant Hooks
// export const useMerchantProfile = () => {
//   return useQuery({
//     queryKey: ['merchant-profile'],
//     queryFn: async () => {
//       const response = await merchantAPI.getProfile()
//       return response.data
//     }
//   })
// }

// export const useUpdateMerchantProfile = () => {
//   const queryClient = useQueryClient()
  
//   return useMutation({
//     mutationFn: (data: any) => merchantAPI.updateProfile(data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['merchant-profile'] })
//       toast.success('Profile updated successfully')
//     }
//   })
// }