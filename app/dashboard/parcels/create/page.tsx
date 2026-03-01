// app/dashboard/parcels/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  User, 
  MapPin, 
  DollarSign, 
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Search,
  Calendar,
  Clock,
  Shield,
  Zap,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { parcelAPI, locationAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

// Step 1: Customer Details
const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
})

// Step 2: Parcel Details
const parcelSchema = z.object({
  items: z.array(z.object({
    description: z.string().min(1, 'Description required'),
    quantity: z.number().min(1, 'At least 1 item'),
    value: z.number().min(0, 'Value must be positive'),
    weight: z.number().min(0.1, 'Weight must be at least 0.1kg'),
  })).min(1, 'At least one item required'),
})

// Step 3: Delivery Options
const deliverySchema = z.object({
  pickupType: z.enum(['locker', 'staffed_hub'], {
    required_error: 'Please select pickup type',
  }),
  locationId: z.string().min(1, 'Please select a location'),
  lockerSize: z.enum(['small', 'medium', 'large']).optional(),
  pickupDeadline: z.string().min(1, 'Pickup deadline is required'),
})

// Step 4: Payment Options
const paymentSchema = z.object({
  isCOD: z.boolean(),
  amount: z.number().min(0, 'Amount must be positive'),
  insurance: z.boolean(),
  insuranceAmount: z.number().optional(),
})

const fullSchema = customerSchema.merge(parcelSchema).merge(deliverySchema).merge(paymentSchema)

type FormData = z.infer<typeof fullSchema>

interface Location {
  _id: string
  name: string
  type: 'locker' | 'staffed_hub'
  address: {
    street: string
    city: string
    state: string
    country: string
  }
  coordinates: {
    lat: number
    lng: number
  }
  contact: {
    phone: string
    email?: string
  }
  hours: {
    opens: string
    closes: string
    timezone: string
  }
  status: 'active' | 'inactive' | 'maintenance'
  isOnline: boolean
  lockerSizes?: Array<'small' | 'medium' | 'large'>
  availableCompartments?: number
  capacity?: number
}

export default function CreateParcelPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [locationSearch, setLocationSearch] = useState('')
  const [locationStats, setLocationStats] = useState<Record<string, any>>({})

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true)
      const response = await locationAPI.getAll()
      
      // Transform locations to include locker sizes and available compartments
      const transformedLocations = response.data.locations.map((loc: any) => ({
        ...loc,
        lockerSizes: loc.type === 'locker' ? ['small', 'medium', 'large'] : [],
        availableCompartments: Math.floor(Math.random() * 20) + 5, // This would come from your backend
        capacity: loc.type === 'locker' ? 100 : 50
      }))
      
      setLocations(transformedLocations)
      
      // Fetch stats for each location
      transformedLocations.forEach(async (loc: Location) => {
        try {
          const statsRes = await locationAPI.getStats(loc._id)
          setLocationStats(prev => ({
            ...prev,
            [loc._id]: statsRes.data
          }))
        } catch (error) {
          console.error(`Failed to fetch stats for ${loc._id}:`, error)
        }
      })
    } catch (error: any) {
      toast.error('Failed to load locations')
      console.error('Error fetching locations:', error)
    } finally {
      setLoadingLocations(false)
    }
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      pickupType: 'locker',
      isCOD: false,
      amount: 0,
      insurance: false,
      items: [{ description: '', quantity: 1, value: 0, weight: 0.5 }],
      pickupDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
  })

  const pickupType = watch('pickupType')
  const isCOD = watch('isCOD')
  const insurance = watch('insurance')
  const items = watch('items')
  const amount = watch('amount')
  const selectedLocationId = watch('locationId')

  // Auto-calculate total amount
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (item.value * item.quantity), 0)
    setValue('amount', total)
  }, [items, setValue])

  // Update selected location when locationId changes
  useEffect(() => {
    if (selectedLocationId) {
      setSelectedLocation(selectedLocationId)
    }
  }, [selectedLocationId])

  const addItem = () => {
    setValue('items', [...items, { description: '', quantity: 1, value: 0, weight: 0.5 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items]
      newItems.splice(index, 1)
      setValue('items', newItems)
    }
  }

  const filteredLocations = locations.filter(loc => {
    const searchLower = locationSearch.toLowerCase()
    const address = `${loc.address.street}, ${loc.address.city}, ${loc.address.state}`.toLowerCase()
    return (
      (loc.type === pickupType) &&
      (loc.name.toLowerCase().includes(searchLower) ||
       address.includes(searchLower))
    )
  })

  const handleNext = async () => {
    let isValid = false
    
    switch (step) {
      case 1:
        isValid = await trigger(['name', 'phone', 'email'])
        break
      case 2:
        isValid = await trigger(['items'])
        break
      case 3:
        isValid = await trigger(['pickupType', 'locationId', 'pickupDeadline'])
        break
      case 4:
        isValid = await trigger(['isCOD', 'amount'])
        break
    }

    if (isValid) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // Calculate total with insurance
      const totalAmount = data.insurance && data.insuranceAmount 
        ? data.amount + data.insuranceAmount
        : data.amount

      // Find selected location
      const selectedLoc = locations.find(l => l._id === data.locationId)
      
      if (!selectedLoc) {
        throw new Error('Selected location not found')
      }

      const parcelData = {
        customer: {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
        },
        items: data.items.map(item => ({
          ...item,
          value: Number(item.value),
          quantity: Number(item.quantity),
          weight: Number(item.weight)
        })),
        delivery: {
          pickupType: data.pickupType,
          location: data.locationId,
          lockerSize: data.pickupType === 'locker' ? data.lockerSize : undefined,
          pickupDeadline: new Date(data.pickupDeadline),
        },
        payment: {
          isCOD: data.isCOD,
          amount: totalAmount,
        },
      }

      const response = await parcelAPI.create(parcelData)
      
      toast.success('Parcel created successfully!')
      router.push(`/dashboard/parcels/${response.data.parcel._id}`)
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create parcel')
      console.error('Error creating parcel:', error)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Customer', icon: User },
    { number: 2, title: 'Parcel', icon: Package },
    { number: 3, title: 'Delivery', icon: MapPin },
    { number: 4, title: 'Payment', icon: DollarSign },
  ]

  const getLocationAddress = (location: Location) => {
    return `${location.address.street}, ${location.address.city}, ${location.address.state}`
  }

  const getAvailableCompartments = (locationId: string) => {
    const stats = locationStats[locationId]
    if (stats) {
      return stats.availableCompartments || stats.capacity - stats.activeParcels
    }
    return locations.find(l => l._id === locationId)?.availableCompartments || 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Parcel</h1>
          <p className="text-gray-600">Send packages to our secure locker network</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => {
              const Icon = s.icon
              const isActive = step === s.number
              const isCompleted = step > s.number
              
              return (
                <div key={s.number} className="flex flex-col items-center relative">
                  {/* Connector line */}
                  {index > 0 && (
                    <div className={cn(
                      "absolute top-4 -left-1/2 w-full h-0.5",
                      isCompleted ? "bg-pepper-500" : "bg-gray-300"
                    )} />
                  )}
                  
                  {/* Step circle */}
                  <div className={cn(
                    "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive && "scale-110 shadow-pepper",
                    isCompleted 
                      ? "pepper-gradient text-white" 
                      : isActive
                      ? "bg-pepper-100 border-2 border-pepper-500 text-pepper-600"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  {/* Step label */}
                  <span className={cn(
                    "mt-2 text-sm font-medium",
                    isActive ? "text-pepper-600" : "text-gray-500"
                  )}>
                    {s.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-hard p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {/* Step 1: Customer Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-pepper-50 rounded-lg">
                      <User className="h-6 w-6 text-pepper-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Customer Information</h3>
                      <p className="text-gray-600">Who is receiving this parcel?</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        {...register('name')}
                        type="text"
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border",
                          "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                          "transition-all duration-200",
                          errors.name && "border-red-500"
                        )}
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border",
                          "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                          "transition-all duration-200",
                          errors.phone && "border-red-500"
                        )}
                        placeholder="+234 800 000 0000"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address (Optional)
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border",
                          "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                          "transition-all duration-200",
                          errors.email && "border-red-500"
                        )}
                        placeholder="customer@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Parcel Details */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-pepper-50 rounded-lg">
                      <Package className="h-6 w-6 text-pepper-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Parcel Contents</h3>
                      <p className="text-gray-600">What are you sending?</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {items.map((_, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-medium text-gray-700">Item {index + 1}</span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1 hover:bg-red-50 rounded text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description *
                            </label>
                            <input
                              {...register(`items.${index}.description`)}
                              className={cn(
                                "w-full px-3 py-2 rounded-lg border",
                                "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                                errors.items?.[index]?.description && "border-red-500"
                              )}
                              placeholder="e.g., iPhone 15 Pro Max"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                              min="1"
                              className={cn(
                                "w-full px-3 py-2 rounded-lg border",
                                "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                                errors.items?.[index]?.quantity && "border-red-500"
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Value (₦) *
                            </label>
                            <input
                              type="number"
                              {...register(`items.${index}.value`, { valueAsNumber: true })}
                              min="0"
                              step="0.01"
                              className={cn(
                                "w-full px-3 py-2 rounded-lg border",
                                "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                                errors.items?.[index]?.value && "border-red-500"
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Weight (kg) *
                            </label>
                            <input
                              type="number"
                              {...register(`items.${index}.weight`, { valueAsNumber: true })}
                              min="0.1"
                              step="0.1"
                              className={cn(
                                "w-full px-3 py-2 rounded-lg border",
                                "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                                errors.items?.[index]?.weight && "border-red-500"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pepper-500 hover:bg-pepper-50 transition flex flex-col items-center justify-center"
                    >
                      <Plus className="h-6 w-6 text-gray-400 mb-2" />
                      <span className="text-gray-600">Add another item</span>
                    </button>
                  </div>

                  {errors.items && (
                    <p className="text-sm text-red-600">{errors.items.message}</p>
                  )}

                  {/* Item Summary */}
                  <div className="bg-gradient-to-r from-pepper-50 to-transparent p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Total Items</div>
                        <div className="font-bold text-gray-900">{items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Total Value</div>
                        <div className="font-bold text-gray-900">₦{amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Total Weight</div>
                        <div className="font-bold text-gray-900">
                          {items.reduce((sum, item) => sum + item.weight, 0).toFixed(1)} kg
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Avg. Value/Item</div>
                        <div className="font-bold text-gray-900">
                          ₦{(amount / items.length).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Delivery Options */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-pepper-50 rounded-lg">
                      <MapPin className="h-6 w-6 text-pepper-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Delivery Options</h3>
                      <p className="text-gray-600">Where should the customer pick up?</p>
                    </div>
                  </div>

                  {/* Pickup Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Pickup Location Type *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer transition-all",
                        pickupType === 'locker'
                          ? "border-pepper-500 bg-pepper-50"
                          : "border-gray-300 hover:border-gray-400"
                      )}>
                        <input
                          type="radio"
                          {...register('pickupType')}
                          value="locker"
                          className="hidden"
                        />
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg">
                            <Zap className="h-5 w-5 text-pepper-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Smart Locker</h4>
                            <p className="text-sm text-gray-600">24/7 automated pickup</p>
                          </div>
                        </div>
                      </label>

                      <label className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer transition-all",
                        pickupType === 'staffed_hub'
                          ? "border-pepper-500 bg-pepper-50"
                          : "border-gray-300 hover:border-gray-400"
                      )}>
                        <input
                          type="radio"
                          {...register('pickupType')}
                          value="staffed_hub"
                          className="hidden"
                        />
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg">
                            <Clock className="h-5 w-5 text-pepper-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Staffed Hub</h4>
                            <p className="text-sm text-gray-600">Business hours pickup</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Location Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Location *
                    </label>
                    
                    {loadingLocations ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-pepper-500" />
                      </div>
                    ) : (
                      <>
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search locations..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                            value={locationSearch}
                            onChange={(e) => setLocationSearch(e.target.value)}
                          />
                        </div>

                        {/* Location List */}
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {filteredLocations.length > 0 ? (
                            filteredLocations.map((location) => {
                              const available = getAvailableCompartments(location._id)
                              return (
                                <label
                                  key={location._id}
                                  className={cn(
                                    "block border rounded-lg p-4 cursor-pointer transition-all",
                                    selectedLocation === location._id
                                      ? "border-pepper-500 bg-pepper-50"
                                      : "border-gray-300 hover:border-gray-400"
                                  )}
                                >
                                  <input
                                    type="radio"
                                    {...register('locationId')}
                                    value={location._id}
                                    className="hidden"
                                  />
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{location.name}</h4>
                                      <p className="text-sm text-gray-600">{getLocationAddress(location)}</p>
                                      <div className="flex items-center space-x-4 mt-2">
                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                          {location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
                                        </span>
                                        {location.type === 'locker' && (
                                          <span className="text-xs text-green-600">
                                            {available} compartments available
                                          </span>
                                        )}
                                        {location.type === 'staffed_hub' && (
                                          <span className="text-xs text-gray-600">
                                            {location.hours.opens} - {location.hours.closes}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                  </div>
                                </label>
                              )
                            })
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              No locations found for {pickupType === 'locker' ? 'smart lockers' : 'staffed hubs'}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {pickupType === 'locker' && selectedLocation && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Locker Size *
                      </label>
                      <div className="flex space-x-4">
                        {['small', 'medium', 'large'].map((size) => {
                          const selectedLocationObj = locations.find(l => l._id === selectedLocation)
                          const isAvailable = selectedLocationObj?.lockerSizes?.includes(size as any)
                          
                          return (
                            <label
                              key={size}
                              className={cn(
                                "flex-1 border rounded-lg p-4 text-center cursor-pointer transition-all",
                                !isAvailable && "opacity-50 cursor-not-allowed",
                                watch('lockerSize') === size
                                  ? "border-pepper-500 bg-pepper-50"
                                  : "border-gray-300 hover:border-gray-400"
                              )}
                            >
                              <input
                                type="radio"
                                {...register('lockerSize')}
                                value={size}
                                className="hidden"
                                disabled={!isAvailable}
                              />
                              <div className="capitalize font-medium">{size} Locker</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {size === 'small' && 'Up to 2kg'}
                                {size === 'medium' && 'Up to 5kg'}
                                {size === 'large' && 'Up to 10kg'}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pickup Deadline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Deadline *
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="date"
                          {...register('pickupDeadline')}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="time"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                          defaultValue="18:00"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Customer must pick up before this date/time
                    </p>
                  </div>

                  {errors.locationId && (
                    <p className="text-sm text-red-600">{errors.locationId.message}</p>
                  )}
                </motion.div>
              )}

              {/* Step 4: Payment Options */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-pepper-50 rounded-lg">
                      <DollarSign className="h-6 w-6 text-pepper-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Payment & Insurance</h3>
                      <p className="text-gray-600">Configure payment and protection</p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Payment Method *
                    </label>
                    <div className="space-y-3">
                      <label className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer transition-all",
                        !isCOD
                          ? "border-pepper-500 bg-pepper-50"
                          : "border-gray-300 hover:border-gray-400"
                      )}>
                        <input
                          type="radio"
                          {...register('isCOD')}
                          value="false"
                          className="hidden"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-lg">
                              <Check className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Prepaid</h4>
                              <p className="text-sm text-gray-600">Customer has already paid</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            ₦{amount.toLocaleString()}
                          </span>
                        </div>
                      </label>

                      <label className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer transition-all",
                        isCOD
                          ? "border-pepper-500 bg-pepper-50"
                          : "border-gray-300 hover:border-gray-400"
                      )}>
                        <input
                          type="radio"
                          {...register('isCOD')}
                          value="true"
                          className="hidden"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-lg">
                              <DollarSign className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Cash on Delivery</h4>
                              <p className="text-sm text-gray-600">Collect payment upon pickup</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            ₦{amount.toLocaleString()}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Insurance */}
                  <div className="bg-gradient-to-r from-gray-50 to-transparent p-4 rounded-lg">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          {...register('insurance')}
                          className="h-5 w-5 text-pepper-600 rounded"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <Shield className="h-5 w-5 text-pepper-600" />
                            <h4 className="font-medium text-gray-900">Add Insurance</h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            Protect your shipment against loss or damage
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        2% of item value
                      </span>
                    </label>

                    {insurance && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4"
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Insurance Coverage
                        </label>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700">Item Value</span>
                            <span className="font-medium">₦{amount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700">Insurance Rate</span>
                            <span className="font-medium">2%</span>
                          </div>
                          <div className="flex items-center justify-between border-t pt-2">
                            <span className="text-gray-700 font-medium">Insurance Cost</span>
                            <span className="text-lg font-bold text-pepper-600">
                              ₦{(amount * 0.02).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <input
                          type="hidden"
                          {...register('insuranceAmount', { valueAsNumber: true })}
                          value={amount * 0.02}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-900 text-white rounded-xl p-6">
                    <h4 className="text-lg font-bold mb-4">Order Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Items ({items.length})</span>
                        <span>₦{amount.toLocaleString()}</span>
                      </div>
                      {insurance && (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Insurance</span>
                          <span>₦{(amount * 0.02).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-gray-700 pt-3">
                        <span className="font-bold">Total Amount</span>
                        <span className="text-xl font-bold">
                          ₦{(insurance ? amount * 1.02 : amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-300">
                      {isCOD 
                        ? 'Payment will be collected upon pickup'
                        : 'Customer has already paid for this order'
                      }
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                className={cn(
                  "px-6 py-3 rounded-lg font-medium flex items-center space-x-2",
                  step === 1 
                    ? "invisible"
                    : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/parcels')}
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium border border-gray-300"
                >
                  Cancel
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 pepper-gradient text-white rounded-lg font-medium hover:shadow-lg transition flex items-center space-x-2"
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      "px-8 py-3 pepper-gradient text-white rounded-lg font-bold",
                      "hover:shadow-lg transform hover:-translate-y-0.5 transition-all",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Creating Parcel...
                      </span>
                    ) : (
                      'Create Parcel & Generate Label'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}