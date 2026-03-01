// components/billing/invoice-pdf.tsx
'use client'

import { useState } from 'react'
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  Mail,
  CheckCircle,
  Calendar,
  Clock
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface InvoicePDFProps {
  invoice: any
  onClose: () => void
}

export default function InvoicePDF({ invoice, onClose }: InvoicePDFProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invoice/${invoice.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = () => {
    // Email invoice logic
    alert(`Invoice sent to ${invoice.customerName}`)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
          <div className="text-gray-600">#{invoice.invoiceNumber}</div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Company & Customer Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-sm text-gray-600 mb-2">From:</div>
          <div className="font-bold text-gray-900">Locker Network Ltd</div>
          <div className="text-gray-600">123 Logistics Street, Ikeja</div>
          <div className="text-gray-600">Lagos, Nigeria</div>
          <div className="text-gray-600">contact@lockernetwork.africa</div>
          <div className="text-gray-600">+234 800 123 4567</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-2">To:</div>
          <div className="font-bold text-gray-900">{invoice.customerName}</div>
          <div className="text-gray-600">Merchant Account</div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-600">Invoice Date</div>
          <div className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Due Date</div>
          <div className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Period</div>
          <div className="font-medium">{invoice.period}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Status</div>
          <div className={`font-medium ${
            invoice.status === 'paid' ? 'text-green-600' :
            invoice.status === 'pending' ? 'text-yellow-600' :
            invoice.status === 'overdue' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Description</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Quantity</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Rate</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any, index: number) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-4">{item.description}</td>
                <td className="py-3 px-4">{item.quantity}</td>
                <td className="py-3 px-4">{formatCurrency(item.rate)}</td>
                <td className="py-3 px-4 font-medium">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="ml-auto w-64">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(invoice.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (0%)</span>
            <span>{formatCurrency(0)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="font-bold">Total</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Paid</span>
            <span className="text-green-600">{formatCurrency(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="font-bold">Balance Due</span>
            <span className="text-xl font-bold text-red-600">{formatCurrency(invoice.balance)}</span>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      {invoice.balance > 0 && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-bold text-yellow-800 mb-2">Payment Instructions</h4>
          <p className="text-yellow-700 text-sm mb-2">
            Please make payment by {new Date(invoice.dueDate).toLocaleDateString()} to avoid service interruption.
          </p>
          <div className="text-sm text-yellow-800">
            <div>Bank: Zenith Bank</div>
            <div>Account: Locker Network Ltd</div>
            <div>Account Number: 1012345678</div>
            <div>Reference: {invoice.invoiceNumber}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-8">
        <div className="text-sm text-gray-600">
          Thank you for your business!
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
          <button
            onClick={() => {/* Download PDF */}}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>{copied ? 'Copied!' : 'Share Link'}</span>
          </button>
          <button
            onClick={handleEmail}
            className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2"
          >
            <Mail className="h-4 w-4" />
            <span>Email Invoice</span>
          </button>
        </div>
      </div>
    </div>
  )
}





