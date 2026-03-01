// app/dashboard/locations/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  MapPin,
  Building,
  Phone,
  Mail,
  Clock,
  Wifi,
  Battery,
  Zap,
  Save,
  ArrowLeft,
  Loader2,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { locationAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const locationSchema = z.object({
  name: z.string().min(2, 'Location name must be at least 2 characters'),
  type: z.enum(['locker', 'staffed_hub'], {
    required_error: 'Please select location type',
  }),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  contact: z.object({
    phone: z.string().min(10, 'Valid phone number required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
  }),
  hours: z.object({
    opens: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    closes: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    timezone: z.string().default('Africa/Lagos'),
  }),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  isActive: z.boolean().default(true),
})

type LocationForm = z.infer<typeof locationSchema>

export default function CreateLocationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 6.5244, lng: 3.3792 }) // Lagos center

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    trigger,
  } = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      type: 'locker',
      address: {
        country: 'Nigeria',
      },
      hours: {
        opens: '08:00',
        closes: '20:00',
        timezone: 'Africa/Lagos',
      },
      isActive: true,
      capacity: 100,
    },
  })

  const locationType = watch('type')
  const isActive = watch('isActive')

  const handleNext = async () => {
    let isValid = false
    
    switch (step) {
      case 1:
        isValid = await trigger(['name', 'type'])
        break
      case 2:
        isValid = await trigger(['address.street', 'address.city', 'address.state', 'address.country'])
        break
      case 3:
        isValid = await trigger(['coordinates.lat', 'coordinates.lng'])
        break
      case 4:
        isValid = await trigger(['contact.phone', 'contact.email', 'hours.opens', 'hours.closes'])
        break
    }

    if (isValid) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const onSubmit = async (data: LocationForm) => {
    setLoading(true)
    try {
      const locationData = {
        ...data,
        status: data.isActive ? 'active' : 'inactive',
        isOnline: data.isActive,
      }
      
      const response = await locationAPI.create(locationData)
      
      toast.success('Location created successfully!')
      router.push(`/dashboard/locations/${response.data._id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create location')
      console.error('Error creating location:', error)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Basic Info', icon: Building },
    { number: 2, title: 'Address', icon: MapPin },
    { number: 3, title: 'Coordinates', icon: MapPin },
    { number: 4, title: 'Contact & Hours', icon: Clock },
  ]

  // Get coordinates from map click (simplified - in real app, you'd use a map picker)
  const handleMapClick = () => {
    // This would open a map picker
    // For now, we'll use Lagos coordinates
    setValue('coordinates.lat', 6.5244)
    setValue('coordinates.lng', 3.3792)
    toast.success('Coordinates set to Lagos center')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/dashboard/locations"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Location</h1>
              <p className="text-gray-600">Add a new locker or staffed hub to your network</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              {steps.map((s, index) => {
                const Icon = s.icon
                const isActive = step === s.number
                const isCompleted = step > s.number
                
                return (
                  <div key={s.number} className="flex flex-col items-center relative flex-1">
                    {/* Connector line */}
                    {index > 0 && (
                      <div className={cn(
                        "absolute top-4 left-0 w-full h-0.5 -translate-x-1/2",
                        isCompleted ? "bg-pepper-500" : "bg-gray-300"
                      )} />
                    )}
                    
                    {/* Step circle */}
                    <div className={cn(
                      "relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      isActive && "scale-110 shadow-pepper",
                      isCompleted 
                        ? "pepper-gradient text-white" 
                        : isActive
                        ? "bg-pepper-100 border-2 border-pepper-500 text-pepper-600"
                        : "bg-gray-100 text-gray-500"
                    )}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    
                    {/* Step label */}
                    <span className={cn(
                      "mt-2 text-xs font-medium",
                      isActive ? "text-pepper-600" : "text-gray-500"
                    )}>
                      {s.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-hard p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-pepper-50 rounded-lg">
                    <Building className="h-6 w-6 text-pepper-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
                    <p className="text-gray-600">Tell us about this location</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name *
                    </label>
                    <input
                      {...register('name')}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border",
                        "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                        errors.name && "border-red-500"
                      )}
                      placeholder="e.g., Ikeja City Mall Locker"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Type *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer transition-all",
                        locationType === 'locker'
                          ? "border-pepper-500 bg-pepper-50"
                          : "border-gray-300 hover:border-gray-400"
                      )}>
                        <input
                          type="radio"
                          {...register('type')}
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
                        locationType === 'staffed_hub'
                          ? "border-pepper-500 bg-pepper-50"
                          : "border-gray-300 hover:border-gray-400"
                      )}>
                        <input
                          type="radio"
                          {...register('type')}
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
                    {errors.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>

                  {locationType === 'locker' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity (compartments)
                      </label>
                      <input
                        type="number"
                        {...register('capacity', { valueAsNumber: true })}
                        min="1"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                        placeholder="e.g., 100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Number of compartments available at this locker
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      {...register('isActive')}
                      className="h-5 w-5 text-pepper-600 rounded"
                    />
                    <div>
                      <label className="font-medium text-gray-900">Active on creation</label>
                      <p className="text-sm text-gray-600">
                        Location will be available for immediate use
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <motion.div
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
                    <h3 className="text-xl font-bold text-gray-900">Address Details</h3>
                    <p className="text-gray-600">Where is this location situated?</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      {...register('address.street')}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border",
                        "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                        errors.address?.street && "border-red-500"
                      )}
                      placeholder="123 Marina Street"
                    />
                    {errors.address?.street && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        {...register('address.city')}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border",
                          "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                          errors.address?.city && "border-red-500"
                        )}
                        placeholder="Lagos"
                      />
                      {errors.address?.city && (
                        <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        {...register('address.state')}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border",
                          "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                          errors.address?.state && "border-red-500"
                        )}
                        placeholder="Lagos"
                      />
                      {errors.address?.state && (
                        <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      {...register('address.country')}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border",
                        "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                        errors.address?.country && "border-red-500"
                      )}
                      placeholder="Nigeria"
                    />
                    {errors.address?.country && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.country.message}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Coordinates */}
            {step === 3 && (
              <motion.div
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
                    <h3 className="text-xl font-bold text-gray-900">GPS Coordinates</h3>
                    <p className="text-gray-600">Set the exact location on map</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Map placeholder - in real app, integrate with Google Maps */}
                  <div 
                    onClick={handleMapClick}
                    className="h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-pepper-500 hover:bg-pepper-50 transition cursor-pointer flex items-center justify-center"
                  >
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to select coordinates</p>
                      <p className="text-xs text-gray-500 mt-1">
                        (Demo: Sets to Lagos center)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...register('coordinates.lat', { valueAsNumber: true })}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border",
                          "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                          errors.coordinates?.lat && "border-red-500"
                        )}
                        placeholder="6.5244"
                      />
                      {errors.coordinates?.lat && (
                        <p className="mt-1 text-sm text-red-600">{errors.coordinates.lat.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...register('coordinates.lng', { valueAsNumber: true })}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border",
                          "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                          errors.coordinates?.lng && "border-red-500"
                        )}
                        placeholder="3.3792"
                      />
                      {errors.coordinates?.lng && (
                        <p className="mt-1 text-sm text-red-600">{errors.coordinates.lng.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Accurate coordinates required</h4>
                        <p className="text-sm text-blue-700">
                          Precise GPS coordinates ensure customers can find the location easily. 
                          Use Google Maps or a GPS device to get exact coordinates.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Contact & Hours */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-pepper-50 rounded-lg">
                    <Clock className="h-6 w-6 text-pepper-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Contact & Operating Hours</h3>
                    <p className="text-gray-600">How can customers reach this location?</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            {...register('contact.phone')}
                            className={cn(
                              "w-full pl-10 pr-4 py-3 rounded-lg border",
                              "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                              errors.contact?.phone && "border-red-500"
                            )}
                            placeholder="+234 800 000 0000"
                          />
                        </div>
                        {errors.contact?.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.contact.phone.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            {...register('contact.email')}
                            className={cn(
                              "w-full pl-10 pr-4 py-3 rounded-lg border",
                              "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                              errors.contact?.email && "border-red-500"
                            )}
                            placeholder="location@example.com"
                          />
                        </div>
                        {errors.contact?.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.contact.email.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Operating Hours</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opens *
                        </label>
                        <input
                          type="time"
                          {...register('hours.opens')}
                          className={cn(
                            "w-full px-4 py-3 rounded-lg border",
                            "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                            errors.hours?.opens && "border-red-500"
                          )}
                        />
                        {errors.hours?.opens && (
                          <p className="mt-1 text-sm text-red-600">{errors.hours.opens.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Closes *
                        </label>
                        <input
                          type="time"
                          {...register('hours.closes')}
                          className={cn(
                            "w-full px-4 py-3 rounded-lg border",
                            "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                            errors.hours?.closes && "border-red-500"
                          )}
                        />
                        {errors.hours?.closes && (
                          <p className="mt-1 text-sm text-red-600">{errors.hours.closes.message}</p>
                        )}
                      </div>
                    </div>

                    {locationType === 'locker' && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Smart lockers are accessible 24/7. Operating hours are for customer support.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

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
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard/locations"
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium border border-gray-300"
                >
                  Cancel
                </Link>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 pepper-gradient text-white rounded-lg font-medium hover:shadow-lg transition flex items-center space-x-2"
                  >
                    <span>Continue</span>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      "px-8 py-3 pepper-gradient text-white rounded-lg font-bold",
                      "hover:shadow-lg transform hover:-translate-y-0.5 transition-all",
                      "disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>Create Location</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-gray-900 mb-3">📍 Location Creation Tips</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Use a descriptive name that helps customers identify the location easily</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Double-check the address format - it will be used for navigation</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Coordinates should be precise - consider using Google Maps to get exact lat/lng</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>For staffed hubs, ensure operating hours are accurate for customer expectations</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}