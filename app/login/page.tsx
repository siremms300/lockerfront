// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff, Package } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { authAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import api from '@/lib/api'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      console.log('1. Attempting login with:', data.email)
      
      const response = await authAPI.login(data)
      console.log('2. Login response received:', response.data)
      
      const { token, merchant } = response.data
      
      // Store auth data
      localStorage.setItem('token', token)
      localStorage.setItem('merchant', JSON.stringify(merchant))
      
      // Set default auth header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      console.log('3. Auth data stored, token:', token.substring(0, 20) + '...')
      
      toast.success(`Welcome back, ${merchant.businessName}!`)
      
      // Use a small timeout to ensure everything is saved
      setTimeout(() => {
        console.log('4. Redirecting to dashboard')
        // Redirect based on role
        if (merchant.role === 'admin' || merchant.role === 'super_admin') {
          router.push('/dashboard')
        } else {
          router.push('/dashboard')
        }
      }, 100)
      
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      })
      
      // Handle specific error cases
      if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check if backend is running.')
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password')
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.error || 'Invalid request')
      } else {
        toast.error(error.response?.data?.error || 'Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="pepper-gradient p-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Package className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">Locker Network</h1>
            </div>
            <p className="text-pepper-100">Merchant Portal</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Sign in to your account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Manage your parcels and track deliveries
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
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
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={cn(
                      "pl-10 pr-10 w-full px-4 py-3 rounded-lg border",
                      "bg-gray-50 dark:bg-gray-800",
                      "border-gray-300 dark:border-gray-700",
                      "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                      "transition-all duration-200",
                      errors.password && "border-red-500"
                    )}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-pepper-600 rounded border-gray-300 focus:ring-pepper-500"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm font-medium text-pepper-600 hover:text-pepper-500">
                  Forgot password?
                </Link>
              </div>

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
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-pepper-600 hover:text-pepper-500">
                  Sign up
                </Link>
              </p>
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

























































// // app/login/page.tsx
// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'
// import { motion } from 'framer-motion'
// import { Lock, Mail, Eye, EyeOff, Package } from 'lucide-react'
// import { toast } from 'react-hot-toast'
// import { authAPI } from '@/lib/api'
// import { cn } from '@/lib/utils'
// import Link from 'next/link'

// const loginSchema = z.object({
//   email: z.string().email('Invalid email address'),
//   password: z.string().min(6, 'Password must be at least 6 characters'),
// })

// type LoginForm = z.infer<typeof loginSchema>

// export default function LoginPage() {
//   const router = useRouter()
//   const [showPassword, setShowPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginForm>({
//     resolver: zodResolver(loginSchema),
//   })

//   // const onSubmit = async (data: LoginForm) => {
//   //   setIsLoading(true)
//   //   try {
//   //     console.log('Attempting login with:', data.email) // Debug log
      
//   //     const response = await authAPI.login(data)
//   //     console.log('Login response:', response.data) // Debug log
      
//   //     const { token, merchant } = response.data
      
//   //     // Store auth data
//   //     localStorage.setItem('token', token)
//   //     localStorage.setItem('merchant', JSON.stringify(merchant))
      
//   //     // Set default auth header for future requests
//   //     api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
//   //     // Import and connect socket (if you have it)
//   //     // const { socketService } = await import('@/lib/socket')
//   //     // socketService.connect(token)
      
//   //     toast.success(`Welcome back, ${merchant.businessName}!`)
      
//   //     // Redirect based on role
//   //     if (merchant.role === 'admin' || merchant.role === 'super_admin') {
//   //       router.push('/admin')
//   //     } else {
//   //       router.push('/dashboard')
//   //     }
      
//   //   } catch (error: any) {
//   //     console.error('Login error details:', {
//   //       message: error.message,
//   //       response: error.response?.data,
//   //       status: error.response?.status
//   //     })
      
//   //     const errorMessage = error.response?.data?.error || 'Login failed. Please check your credentials.'
//   //     toast.error(errorMessage)
//   //   } finally {
//   //     setIsLoading(false)
//   //   }
//   // }






// // app/login/page.tsx - Update the onSubmit function




// const onSubmit = async (data: LoginForm) => {
//   setIsLoading(true)
//   try {
//     console.log('Attempting login with:', data.email)
    
//     const response = await authAPI.login(data)
//     console.log('Login response:', response.data)
    
//     const { token, merchant } = response.data
    
//     // Store auth data
//     localStorage.setItem('token', token)
//     localStorage.setItem('merchant', JSON.stringify(merchant))
    
//     // Set default auth header for future requests
//     api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
//     toast.success(`Welcome back, ${merchant.businessName}!`)
    
//     // Add a small delay to ensure everything is saved
//     setTimeout(() => {
//       // Redirect based on role
//       if (merchant.role === 'admin' || merchant.role === 'super_admin') {
//         router.push('/admin')
//       } else {
//         router.push('/dashboard')
//       }
//     }, 100)
    
//   } catch (error: any) {
//     console.error('Login error details:', {
//       message: error.message,
//       response: error.response?.data,
//       status: error.response?.status
//     })
    
//     const errorMessage = error.response?.data?.error || 'Login failed. Please check your credentials.'
//     toast.error(errorMessage)
//   } finally {
//     setIsLoading(false)
//   }
// }






//   return (
//     <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="w-full max-w-md"
//       >
//         <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
//           {/* Header */}
//           <div className="pepper-gradient p-8 text-center">
//             <div className="flex items-center justify-center space-x-3 mb-4">
//               <Package className="h-8 w-8 text-white" />
//               <h1 className="text-2xl font-bold text-white">Locker Network</h1>
//             </div>
//             <p className="text-pepper-100">Merchant Portal</p>
//           </div>

//           {/* Form */}
//           <div className="p-8">
//             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
//               Sign in to your account
//             </h2>
//             <p className="text-gray-600 dark:text-gray-400 mb-8">
//               Manage your parcels and track deliveries
//             </p>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                   <input
//                     {...register('email')}
//                     type="email"
//                     className={cn(
//                       "pl-10 w-full px-4 py-3 rounded-lg border",
//                       "bg-gray-50 dark:bg-gray-800",
//                       "border-gray-300 dark:border-gray-700",
//                       "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
//                       "transition-all duration-200",
//                       errors.email && "border-red-500"
//                     )}
//                     placeholder="you@example.com"
//                     disabled={isLoading}
//                   />
//                 </div>
//                 {errors.email && (
//                   <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                   <input
//                     {...register('password')}
//                     type={showPassword ? 'text' : 'password'}
//                     className={cn(
//                       "pl-10 pr-10 w-full px-4 py-3 rounded-lg border",
//                       "bg-gray-50 dark:bg-gray-800",
//                       "border-gray-300 dark:border-gray-700",
//                       "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
//                       "transition-all duration-200",
//                       errors.password && "border-red-500"
//                     )}
//                     placeholder="••••••••"
//                     disabled={isLoading}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2"
//                     disabled={isLoading}
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-5 w-5 text-gray-400" />
//                     ) : (
//                       <Eye className="h-5 w-5 text-gray-400" />
//                     )}
//                   </button>
//                 </div>
//                 {errors.password && (
//                   <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
//                 )}
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="remember"
//                     className="h-4 w-4 text-pepper-600 rounded border-gray-300 focus:ring-pepper-500"
//                   />
//                   <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
//                     Remember me
//                   </label>
//                 </div>
//                 <Link href="/forgot-password" className="text-sm font-medium text-pepper-600 hover:text-pepper-500">
//                   Forgot password?
//                 </Link>
//               </div>

//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className={cn(
//                   "w-full py-3 px-4 rounded-lg font-medium",
//                   "pepper-gradient text-white",
//                   "hover:shadow-lg transform hover:-translate-y-0.5",
//                   "transition-all duration-200",
//                   "disabled:opacity-50 disabled:cursor-not-allowed"
//                 )}
//               >
//                 {isLoading ? (
//                   <span className="flex items-center justify-center">
//                     <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                     </svg>
//                     Signing in...
//                   </span>
//                 ) : (
//                   'Sign in'
//                 )}
//               </button>
//             </form>

//             <div className="mt-8 text-center">
//               <p className="text-gray-600 dark:text-gray-400">
//                 Don't have an account?{' '}
//                 <Link href="/register" className="font-medium text-pepper-600 hover:text-pepper-500">
//                   Sign up
//                 </Link>
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Decorative elements */}
//         <div className="absolute top-0 left-0 w-72 h-72 bg-pepper-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
//         <div className="absolute bottom-0 right-0 w-72 h-72 bg-pepper-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow delay-1000" />
//       </motion.div>
//     </div>
//   )
// }
































































// // app/login/page.tsx - Ensure proper token storage
// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'
// import { motion } from 'framer-motion'
// import { Lock, Mail, Eye, EyeOff, Package } from 'lucide-react'
// import { toast } from 'react-hot-toast'
// import { authAPI } from '@/lib/api'
// import { cn } from '@/lib/utils'

// const loginSchema = z.object({
//   email: z.string().email('Invalid email address'),
//   password: z.string().min(6, 'Password must be at least 6 characters'),
// })

// type LoginForm = z.infer<typeof loginSchema>

// export default function LoginPage() {
//   const router = useRouter()
//   const [showPassword, setShowPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginForm>({
//     resolver: zodResolver(loginSchema),
//   })

//   const onSubmit = async (data: LoginForm) => {
//     setIsLoading(true)
//     try {
//       const response = await authAPI.login(data)
//       const { token, merchant } = response.data
      
//       // Store auth data
//       localStorage.setItem('token', token)
//       localStorage.setItem('merchant', JSON.stringify(merchant))
      
//       // Set default auth header for future requests
//       api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
//       // Connect socket with token
//       socketService.connect(token)
      
//       toast.success('Welcome back!')
//       router.push('/dashboard')
//     } catch (error: any) {
//       toast.error(error.response?.data?.error || 'Login failed')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//     return (
//     <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="w-full max-w-md"
//       >
//         <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
//           {/* Header */}
//           <div className="pepper-gradient p-8 text-center">
//             <div className="flex items-center justify-center space-x-3 mb-4">
//               <Package className="h-8 w-8 text-white" />
//               <h1 className="text-2xl font-bold text-white">Locker Network</h1>
//             </div>
//             <p className="text-pepper-100">Merchant Portal</p>
//           </div>

//           {/* Form */}
//           <div className="p-8">
//             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
//               Sign in to your account
//             </h2>
//             <p className="text-gray-600 dark:text-gray-400 mb-8">
//               Manage your parcels and track deliveries
//             </p>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                   <input
//                     {...register('email')}
//                     type="email"
//                     className={cn(
//                       "pl-10 w-full px-4 py-3 rounded-lg border",
//                       "bg-gray-50 dark:bg-gray-800",
//                       "border-gray-300 dark:border-gray-700",
//                       "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
//                       "transition-all duration-200",
//                       errors.email && "border-red-500"
//                     )}
//                     placeholder="you@example.com"
//                   />
//                 </div>
//                 {errors.email && (
//                   <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                   <input
//                     {...register('password')}
//                     type={showPassword ? 'text' : 'password'}
//                     className={cn(
//                       "pl-10 pr-10 w-full px-4 py-3 rounded-lg border",
//                       "bg-gray-50 dark:bg-gray-800",
//                       "border-gray-300 dark:border-gray-700",
//                       "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
//                       "transition-all duration-200",
//                       errors.password && "border-red-500"
//                     )}
//                     placeholder="••••••••"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2"
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-5 w-5 text-gray-400" />
//                     ) : (
//                       <Eye className="h-5 w-5 text-gray-400" />
//                     )}
//                   </button>
//                 </div>
//                 {errors.password && (
//                   <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
//                 )}
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="remember"
//                     className="h-4 w-4 text-pepper-600 rounded border-gray-300 focus:ring-pepper-500"
//                   />
//                   <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
//                     Remember me
//                   </label>
//                 </div>
//                 <a href="#" className="text-sm font-medium text-pepper-600 hover:text-pepper-500">
//                   Forgot password?
//                 </a>
//               </div>

//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className={cn(
//                   "w-full py-3 px-4 rounded-lg font-medium",
//                   "pepper-gradient text-white",
//                   "hover:shadow-lg transform hover:-translate-y-0.5",
//                   "transition-all duration-200",
//                   "disabled:opacity-50 disabled:cursor-not-allowed"
//                 )}
//               >
//                 {isLoading ? (
//                   <span className="flex items-center justify-center">
//                     <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                     </svg>
//                     Signing in...
//                   </span>
//                 ) : (
//                   'Sign in'
//                 )}
//               </button>
//             </form>

//             <div className="mt-8 text-center">
//               <p className="text-gray-600 dark:text-gray-400">
//                 Don't have an account?{' '}
//                 <a href="/register" className="font-medium text-pepper-600 hover:text-pepper-500">
//                   Sign up
//                 </a>
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Decorative elements */}
//         <div className="absolute top-0 left-0 w-72 h-72 bg-pepper-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
//         <div className="absolute bottom-0 right-0 w-72 h-72 bg-pepper-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow delay-1000" />
//       </motion.div>
//     </div>
//   )
// }






























































// // /app/login/page.tsx
// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'
// import { motion } from 'framer-motion'
// import { Lock, Mail, Eye, EyeOff, Package } from 'lucide-react'
// import { toast } from 'react-hot-toast'
// import { authAPI } from '@/lib/api'
// import { cn } from '@/lib/utils'

// const loginSchema = z.object({
//   email: z.string().email('Invalid email address'),
//   password: z.string().min(6, 'Password must be at least 6 characters'),
// })

// type LoginForm = z.infer<typeof loginSchema>

// export default function LoginPage() {
//   const router = useRouter()
//   const [showPassword, setShowPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginForm>({
//     resolver: zodResolver(loginSchema),
//   })

//   const onSubmit = async (data: LoginForm) => {
//     setIsLoading(true)
//     try {
//       const response = await authAPI.login(data)
//       const { token, merchant } = response.data
      
//       localStorage.setItem('token', token)
//       localStorage.setItem('merchant', JSON.stringify(merchant))
      
//       toast.success('Welcome back!')
//       router.push('/dashboard')
//     } catch (error: any) {
//       toast.error(error.response?.data?.error || 'Login failed')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="w-full max-w-md"
//       >
//         <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
//           {/* Header */}
//           <div className="pepper-gradient p-8 text-center">
//             <div className="flex items-center justify-center space-x-3 mb-4">
//               <Package className="h-8 w-8 text-white" />
//               <h1 className="text-2xl font-bold text-white">Locker Network</h1>
//             </div>
//             <p className="text-pepper-100">Merchant Portal</p>
//           </div>

//           {/* Form */}
//           <div className="p-8">
//             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
//               Sign in to your account
//             </h2>
//             <p className="text-gray-600 dark:text-gray-400 mb-8">
//               Manage your parcels and track deliveries
//             </p>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                   <input
//                     {...register('email')}
//                     type="email"
//                     className={cn(
//                       "pl-10 w-full px-4 py-3 rounded-lg border",
//                       "bg-gray-50 dark:bg-gray-800",
//                       "border-gray-300 dark:border-gray-700",
//                       "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
//                       "transition-all duration-200",
//                       errors.email && "border-red-500"
//                     )}
//                     placeholder="you@example.com"
//                   />
//                 </div>
//                 {errors.email && (
//                   <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                   <input
//                     {...register('password')}
//                     type={showPassword ? 'text' : 'password'}
//                     className={cn(
//                       "pl-10 pr-10 w-full px-4 py-3 rounded-lg border",
//                       "bg-gray-50 dark:bg-gray-800",
//                       "border-gray-300 dark:border-gray-700",
//                       "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
//                       "transition-all duration-200",
//                       errors.password && "border-red-500"
//                     )}
//                     placeholder="••••••••"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2"
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-5 w-5 text-gray-400" />
//                     ) : (
//                       <Eye className="h-5 w-5 text-gray-400" />
//                     )}
//                   </button>
//                 </div>
//                 {errors.password && (
//                   <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
//                 )}
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="remember"
//                     className="h-4 w-4 text-pepper-600 rounded border-gray-300 focus:ring-pepper-500"
//                   />
//                   <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
//                     Remember me
//                   </label>
//                 </div>
//                 <a href="#" className="text-sm font-medium text-pepper-600 hover:text-pepper-500">
//                   Forgot password?
//                 </a>
//               </div>

//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className={cn(
//                   "w-full py-3 px-4 rounded-lg font-medium",
//                   "pepper-gradient text-white",
//                   "hover:shadow-lg transform hover:-translate-y-0.5",
//                   "transition-all duration-200",
//                   "disabled:opacity-50 disabled:cursor-not-allowed"
//                 )}
//               >
//                 {isLoading ? (
//                   <span className="flex items-center justify-center">
//                     <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                     </svg>
//                     Signing in...
//                   </span>
//                 ) : (
//                   'Sign in'
//                 )}
//               </button>
//             </form>

//             <div className="mt-8 text-center">
//               <p className="text-gray-600 dark:text-gray-400">
//                 Don't have an account?{' '}
//                 <a href="/register" className="font-medium text-pepper-600 hover:text-pepper-500">
//                   Sign up
//                 </a>
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Decorative elements */}
//         <div className="absolute top-0 left-0 w-72 h-72 bg-pepper-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
//         <div className="absolute bottom-0 right-0 w-72 h-72 bg-pepper-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow delay-1000" />
//       </motion.div>
//     </div>
//   )
// }



