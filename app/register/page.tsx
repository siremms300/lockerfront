// app/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { 
  Building, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Package,
  Check,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { authAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required').regex(/^\+?[\d\s-]+$/, 'Invalid phone number format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/\d/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  businessType: z.enum(['ecommerce', 'retail', 'logistics', 'other'], {
    errorMap: () => ({ message: 'Please select a business type' })
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

const businessTypes = [
  { value: 'ecommerce', label: 'E-commerce Store' },
  { value: 'retail', label: 'Retail Business' },
  { value: 'logistics', label: 'Logistics Company' },
  { value: 'other', label: 'Other' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessType: 'ecommerce',
      agreeToTerms: false
    }
  })

  const password = watch('password')
  
  // Check password strength
  const checkPasswordStrength = (pass: string) => {
    let strength = 0
    if (pass.length >= 8) strength++
    if (/[A-Z]/.test(pass)) strength++
    if (/[a-z]/.test(pass)) strength++
    if (/\d/.test(pass)) strength++
    if (/[^A-Za-z0-9]/.test(pass)) strength++
    setPasswordStrength(strength)
  }

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const response = await authAPI.register({
        businessName: data.businessName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        businessType: data.businessType
      })
      
      const { token, merchant } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('merchant', JSON.stringify(merchant))
      
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Registration failed'
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const passwordRequirements = [
    { label: 'At least 8 characters', regex: /.{8,}/ },
    { label: 'One uppercase letter', regex: /[A-Z]/ },
    { label: 'One lowercase letter', regex: /[a-z]/ },
    { label: 'One number', regex: /\d/ },
  ]

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="pepper-gradient p-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Package className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">Join Locker Network</h1>
            </div>
            <p className="text-pepper-100">Start managing your logistics in minutes</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create Merchant Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Fill in your business details to get started
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('businessName')}
                    type="text"
                    className={cn(
                      "pl-10 w-full px-4 py-3 rounded-lg border",
                      "bg-gray-50 dark:bg-gray-800",
                      "border-gray-300 dark:border-gray-700",
                      "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                      "transition-all duration-200",
                      errors.businessName && "border-red-500"
                    )}
                    placeholder="Your Business Name"
                  />
                </div>
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('email')}
                      type="email"
                      className={cn(
                        "pl-10 w-full px-4 py-3 rounded-lg border",
                        "bg-gray-50 dark:bg-gray-800",
                        "border-gray-300 dark:border-gray-700",
                        "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                        "transition-all duration-200",
                        errors.email && "border-red-500"
                      )}
                      placeholder="business@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('phone')}
                      type="tel"
                      className={cn(
                        "pl-10 w-full px-4 py-3 rounded-lg border",
                        "bg-gray-50 dark:bg-gray-800",
                        "border-gray-300 dark:border-gray-700",
                        "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                        "transition-all duration-200",
                        errors.phone && "border-red-500"
                      )}
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {businessTypes.map((type) => (
                    <label
                      key={type.value}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all",
                        watch('businessType') === type.value
                          ? "border-pepper-500 bg-pepper-50 text-pepper-700"
                          : "border-gray-300 dark:border-gray-700 hover:border-pepper-300"
                      )}
                    >
                      <input
                        type="radio"
                        {...register('businessType')}
                        value={type.value}
                        className="hidden"
                      />
                      <span className="text-sm font-medium">{type.label}</span>
                    </label>
                  ))}
                </div>
                {errors.businessType && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    onChange={(e) => checkPasswordStrength(e.target.value)}
                    className={cn(
                      "pl-10 pr-10 w-full px-4 py-3 rounded-lg border",
                      "bg-gray-50 dark:bg-gray-800",
                      "border-gray-300 dark:border-gray-700",
                      "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                      "transition-all duration-200",
                      errors.password && "border-red-500"
                    )}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Password strength</span>
                      <span className="text-sm font-medium">
                        {passwordStrength < 2 ? 'Weak' : passwordStrength < 4 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-300",
                          passwordStrength < 2 ? "bg-red-500 w-1/4" :
                          passwordStrength < 4 ? "bg-yellow-500 w-2/3" :
                          "bg-green-500 w-full"
                        )}
                      />
                    </div>
                  </div>
                )}
                
                {/* Password Requirements */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {passwordRequirements.map((req) => {
                    const isValid = req.regex.test(password || '')
                    return (
                      <div key={req.label} className="flex items-center space-x-2">
                        {isValid ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={cn(
                          "text-sm",
                          isValid ? "text-green-600" : "text-gray-500"
                        )}>
                          {req.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
                
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={cn(
                      "pl-10 pr-10 w-full px-4 py-3 rounded-lg border",
                      "bg-gray-50 dark:bg-gray-800",
                      "border-gray-300 dark:border-gray-700",
                      "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                      "transition-all duration-200",
                      errors.confirmPassword && "border-red-500"
                    )}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  {...register('agreeToTerms')}
                  className="mt-1 h-4 w-4 text-pepper-600 rounded border-gray-300 focus:ring-pepper-500"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-600 dark:text-gray-400">
                  I agree to the{' '}
                  <a href="/terms" className="text-pepper-600 hover:text-pepper-500 font-medium">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-pepper-600 hover:text-pepper-500 font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3 px-4 rounded-lg font-medium",
                  "pepper-gradient text-white",
                  "hover:shadow-lg transform hover:-translate-y-0.5",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <a href="/login" className="font-medium text-pepper-600 hover:text-pepper-500">
                  Sign in
                </a>
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Why join Locker Network?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3">
                <div className="text-pepper-600 font-bold text-lg">14-day</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Free trial</div>
              </div>
              <div className="p-3">
                <div className="text-pepper-600 font-bold text-lg">99.9%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Uptime SLA</div>
              </div>
              <div className="p-3">
                <div className="text-pepper-600 font-bold text-lg">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-pepper-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-pepper-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow delay-1000" />
      </motion.div>
    </div>
  )
}




