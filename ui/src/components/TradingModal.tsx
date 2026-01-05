import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, AlertCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  orderType: 'BUY' | 'SELL';
  onSubmit: (order: OrderData) => Promise<void>;
}

export interface OrderData {
  symbol: string;
  quantity: number;
  order_type: 'BUY' | 'SELL';
  price?: number;
  stop_loss?: number;
  take_profit?: number;
}

const TradingModal: React.FC<TradingModalProps> = ({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  orderType,
  onSubmit
}) => {
  const [quantity, setQuantity] = useState<string>('100');
  const [orderMode, setOrderMode] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toString());
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLimitPrice(currentPrice.toString());
  }, [currentPrice]);

  if (!isOpen) return null;

  const totalValue = orderMode === 'market'
    ? currentPrice * Number(quantity)
    : Number(limitPrice) * Number(quantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const order: OrderData = {
        symbol,
        quantity: Number(quantity),
        order_type: orderType,
        price: orderMode === 'limit' ? Number(limitPrice) : undefined,
        stop_loss: stopLoss ? Number(stopLoss) : undefined,
        take_profit: takeProfit ? Number(takeProfit) : undefined,
      };

      await onSubmit(order);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityPreset = (value: number) => {
    setQuantity(value.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 w-full max-w-md">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-800 flex items-center justify-between ${
          orderType === 'BUY' ? 'bg-green-900/20' : 'bg-red-900/20'
        }`}>
          <div className="flex items-center space-x-3">
            {orderType === 'BUY' ? (
              <TrendingUp className="h-6 w-6 text-green-400" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-400" />
            )}
            <div>
              <h2 className="text-lg font-semibold">
                {orderType} {symbol}
              </h2>
              <p className="text-sm text-gray-400">
                Current: {formatCurrency(currentPrice)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Order Type Selector */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">
              Order Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderMode('market')}
                className={`py-2 px-4 rounded text-sm font-medium transition-colors ${
                  orderMode === 'market'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Market Order
              </button>
              <button
                type="button"
                onClick={() => setOrderMode('limit')}
                className={`py-2 px-4 rounded text-sm font-medium transition-colors ${
                  orderMode === 'limit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Limit Order
              </button>
            </div>
          </div>

          {/* Limit Price (if limit order) */}
          {orderMode === 'limit' && (
            <div>
              <label htmlFor="limit-price" className="text-sm font-medium text-gray-400 mb-2 block">
                Limit Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  id="limit-price"
                  type="number"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="text-sm font-medium text-gray-400 mb-2 block">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
            />
            <div className="flex gap-2 mt-2">
              {[10, 25, 50, 100, 500].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleQuantityPreset(value)}
                  className="flex-1 py-1 px-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-400 transition-colors"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Stop Loss */}
          <div>
            <label htmlFor="stop-loss" className="text-sm font-medium text-gray-400 mb-2 block">
              Stop Loss (Optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                id="stop-loss"
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder={`e.g. ${(currentPrice * 0.98).toFixed(2)}`}
                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Take Profit */}
          <div>
            <label htmlFor="take-profit" className="text-sm font-medium text-gray-400 mb-2 block">
              Take Profit (Optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                id="take-profit"
                type="number"
                step="0.01"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder={`e.g. ${(currentPrice * 1.02).toFixed(2)}`}
                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Total Value Display */}
          <div className="bg-gray-800 rounded p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Value</span>
              <span className="text-lg font-semibold text-white">
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-400 bg-red-900/20 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded font-medium text-gray-400 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                orderType === 'BUY'
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Placing Order...' : `${orderType} ${quantity} Shares`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradingModal;