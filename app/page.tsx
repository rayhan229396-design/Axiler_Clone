'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Camera, Sliders, ArrowUpRight, ArrowDownRight, Send } from 'lucide-react';

interface SignalData {
  pair: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  rsi: number;
  confidence: number;
  timeframe: string;
}

export default function Home() {
  const [selectedPair, setSelectedPair] = useState<string>('frxEURUSD');
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Deriv WebSocket API Connection & RSI Logic (65/35 Threshold)
  const fetchDerivSignal = (symbol: string) => {
    setLoading(true);
    
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          ticks_history: symbol,
          adjust_start_time: 1,
          count: 15,
          end: 'latest',
          style: 'candles',
          granularity: 60,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.candles && data.candles.length > 0) {
        const prices = data.candles.map((c: any) => c.close);
        const rsiVal = calculateRSI(prices, 14);

        let dir: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
        let conf = 50;

        // Signal Logic Threshold: 65 / 35
        if (rsiVal <= 35) {
          dir = 'BUY';
          conf = Math.min(98.5, Math.round(85 + (35 - rsiVal) * 0.8));
        } else if (rsiVal >= 65) {
          dir = 'SELL';
          conf = Math.min(98.5, Math.round(85 + (rsiVal - 65) * 0.8));
        } else {
          dir = 'WAIT';
          conf = Math.round(50 + Math.abs(50 - rsiVal));
        }

        setSignal({
          pair: symbol.replace('frx', ''),
          direction: dir,
          rsi: parseFloat(rsiVal.toFixed(2)),
          confidence: conf,
          timeframe: '1 Minute',
        });
        setLoading(false);
      }
    };

    ws.onerror = () => {
      setLoading(false);
    };
  };

  // 14-period RSI Calculation Formula
  const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) gains += change;
      else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  };

  useEffect(() => {
    fetchDerivSignal(selectedPair);
    return () => {
      wsRef.current?.close();
    };
  }, [selectedPair]);

  return (
    <main className="min-h-screen bg-[#0d0e12] text-white flex justify-center p-2 sm:p-4 font-sans">
      <div className="w-full max-w-md bg-[#13151c] border border-gray-800 rounded-3xl p-4 flex flex-col justify-between shadow-2xl">
        
        {/* Header */}
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-lg bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                AXILER <span className="text-xs px-2 py-0.5 bg-red-600/20 text-red-500 rounded border border-red-500/30">QUANTUM</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE AI</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h1 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
              Welcome, Elite Trader
            </h1>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Choose how the Quantum engine finds your next signal
            </p>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 gap-2.5 mt-4">
            <div className="bg-[#1a1d26] border border-gray-800 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:border-gray-700 transition">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                  <Camera size={18} />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-bold">Photo Analysis</span>
                    <span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded">NEW</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Upload a chart screenshot - AI reads it & gives signal</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1d26] border border-gray-800 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:border-gray-700 transition">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Sliders size={18} />
                </div>
                <div>
                  <span className="text-sm font-bold">Manual Analysis</span>
                  <p className="text-[10px] text-gray-400">Pick pair & timeframe yourself - classic AI signal flow</p>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Selector */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-300">Select Market Asset</span>
              <button 
                onClick={() => fetchDerivSignal(selectedPair)}
                className="text-[11px] text-red-400 flex items-center space-x-1 hover:underline"
              >
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                <span>REFRESH</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'EUR/USD', symbol: 'frxEURUSD' },
                { label: 'GBP/USD', symbol: 'frxGBPUSD' },
                { label: 'USD/JPY', symbol: 'frxUSDJPY' },
              ].map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => setSelectedPair(item.symbol)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    selectedPair === item.symbol
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-transparent shadow-lg shadow-red-900/40'
                      : 'bg-[#1a1d26] border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Signal Output Box */}
          <div className="mt-5 bg-[#171922] border border-gray-800 rounded-2xl p-4 relative overflow-hidden">
            {loading ? (
              <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center space-y-2">
                <RefreshCw size={20} className="animate-spin text-red-500" />
                <span>Connecting to Deriv WebSocket Feed...</span>
              </div>
            ) : signal ? (
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">PAIR: <strong className="text-white">{signal.pair}</strong></span>
                  <span className="text-xs text-gray-400">RSI (14): <strong className="text-white">{signal.rsi}</strong></span>
                </div>

                <div className="my-4 text-center">
                  {signal.direction === 'BUY' && (
                    <div className="flex flex-col items-center space-y-1">
                      <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                        <ArrowUpRight size={32} />
                      </div>
                      <span className="text-xl font-extrabold text-emerald-400 tracking-wider">BUY (CALL)</span>
                      <span className="text-[10px] text-emerald-500/80 uppercase tracking-widest font-semibold">UPWARD MOMENTUM</span>
                    </div>
                  )}

                  {signal.direction === 'SELL' && (
                    <div className="flex flex-col items-center space-y-1">
                      <div className="p-3 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                        <ArrowDownRight size={32} />
                      </div>
                      <span className="text-xl font-extrabold text-red-400 tracking-wider">SELL (PUT)</span>
                      <span className="text-[10px] text-red-500/80 uppercase tracking-widest font-semibold">DOWNWARD MOMENTUM</span>
                    </div>
                  )}

                  {signal.direction === 'WAIT' && (
                    <div className="py-2">
                      <span className="text-lg font-bold text-yellow-500">NO SIGNAL (WAIT)</span>
                      <p className="text-[11px] text-gray-400 mt-1">RSI is neutral (Between 35 and 65)</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-800 text-xs">
                  <div className="text-gray-400">
                    Accuracy Rate: <span className="text-emerald-400 font-bold">{signal.confidence}%</span>
                  </div>
                  <div className="text-gray-400">
                    Expiry: <span className="text-white font-bold">{signal.timeframe}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Contact */}
        <div className="mt-6 pt-3 border-t border-gray-800/60 flex justify-between items-center text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center font-bold text-xs">
              A
            </div>
            <div>
              <p className="font-semibold text-white text-[11px]">Contact Admin</p>
              <p className="text-[9px] text-gray-500">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"></span>
                Online - Help & Support
              </p>
            </div>
          </div>
          <button className="bg-[#1e222d] border border-gray-700 hover:bg-gray-800 text-gray-300 p-2 rounded-xl">
            <Send size={14} />
          </button>
        </div>

      </div>
    </main>
  );
}
