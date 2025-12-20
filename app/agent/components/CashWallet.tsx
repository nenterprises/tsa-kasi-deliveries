'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { AgentWallet, AgentTransaction } from '@/types'
import { Banknote, ShoppingCart, Scale, BarChart3, AlertTriangle, Lightbulb, FileText } from 'lucide-react'

interface CashWalletProps {
  agentId: string
  wallet: AgentWallet | null
  onUpdate: () => void
}

export default function CashWallet({ agentId, wallet, onUpdate }: CashWalletProps) {
  const [transactions, setTransactions] = useState<AgentTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransactions()
  }, [agentId])

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_transactions')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeDisplay = (type: string) => {
    const iconClass = 'w-6 h-6 text-gray-300'
    switch (type) {
      case 'cash_released':
        return { label: 'Cash Released', color: 'green', icon: <Banknote className={iconClass} /> }
      case 'purchase_made':
        return { label: 'Purchase Made', color: 'red', icon: <ShoppingCart className={iconClass} /> }
      case 'balance_adjustment':
        return { label: 'Balance Adjustment', color: 'blue', icon: <Scale className={iconClass} /> }
      case 'reconciliation':
        return { label: 'Reconciliation', color: 'purple', icon: <BarChart3 className={iconClass} /> }
      default:
        return { label: type, color: 'gray', icon: <FileText className={iconClass} /> }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!wallet) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 flex items-center justify-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-100 mb-2">Wallet Not Found</h3>
        <p className="text-gray-400">Please contact administrator to set up your wallet</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-8 text-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-2">Company Cash Balance</p>
            <p className="text-5xl font-bold mb-4 text-green-400">R{wallet.company_cash_balance.toFixed(2)}</p>
            <p className="text-gray-400 text-sm">
              Limit: R{wallet.max_cash_limit.toFixed(2)}
            </p>
            <div className="mt-2 w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-green-500 rounded-full h-2 transition-all"
                style={{
                  width: `${Math.min((wallet.company_cash_balance / wallet.max_cash_limit) * 100, 100)}%`
                }}
              />
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
              wallet.status === 'active'
                ? 'bg-green-900/40 text-green-300 border-green-700'
                : wallet.status === 'frozen'
                ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
                : 'bg-red-900/40 text-red-300 border-red-700'
            }`}>
              {wallet.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-secondary-900/20 border border-secondary-700 rounded-lg p-6">
        <h3 className="font-semibold text-secondary-200 mb-2 inline-flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> How Company Cash Works
        </h3>
        <ul className="text-sm text-secondary-200/90 space-y-2">
          <li>For Cash Purchase Orders (CPO), request cash which gets added to your balance</li>
          <li>When you make a purchase, the amount is automatically deducted</li>
          <li>For Assisted Purchase Orders (APO), no cash is needed - use company card or cash on hand</li>
          <li>Keep receipts for all purchases to maintain accurate records</li>
          <li>Admin may require end-of-day reconciliation</li>
        </ul>
      </div>

      {/* Transaction History */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-gray-100">Transaction History</h2>
          <p className="text-sm text-gray-400 mt-1">Recent transactions in your wallet</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-500" />
            </div>
            <p className="text-gray-400">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {transactions.map((transaction) => {
              const typeDisplay = getTransactionTypeDisplay(transaction.transaction_type)
              const isPositive = transaction.amount > 0

              return (
                <div key={transaction.id} className="p-6 hover:bg-gray-800 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {typeDisplay.icon}
                        <div>
                          <p className="font-semibold text-gray-100">{typeDisplay.label}</p>
                          <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-gray-400 ml-11">{transaction.description}</p>
                      )}
                      {transaction.order_id && (
                        <p className="text-xs text-secondary-400 ml-11 mt-1">
                          Order #{transaction.order_id.slice(0, 8).toUpperCase()}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-xl font-bold ${
                        isPositive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isPositive ? '+' : ''}R{Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Balance: R{transaction.balance_after.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Wallet Status Warning */}
      {wallet.status !== 'active' && (
        <div className={`rounded-lg border p-6 ${
          wallet.status === 'frozen'
            ? 'bg-yellow-900/20 border-yellow-700'
            : 'bg-red-900/20 border-red-700'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 ${wallet.status === 'frozen' ? 'text-yellow-400' : 'text-red-400'}" />
            <div>
              <h3 className={`font-semibold mb-2 ${
                wallet.status === 'frozen' ? 'text-yellow-200' : 'text-red-200'
              }`}>
                Wallet {wallet.status === 'frozen' ? 'Frozen' : 'Suspended'}
              </h3>
              <p className={`text-sm ${
                wallet.status === 'frozen' ? 'text-yellow-200/80' : 'text-red-200/80'
              }`}>
                Your wallet has been {wallet.status}. Please contact your administrator for assistance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
