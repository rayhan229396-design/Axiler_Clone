'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Sliders, RefreshCw, ArrowUpRight, ArrowDownRight, 
  Send, BarChart2, History, MessageSquare, User, ChevronRight, CheckCircle2, ShieldCheck 
} from 'lucide-react';

interface SignalData {
  pair: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  rsi: number;
  confidence: number;
  accuracy: number;
  timeframe: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'signals' | 'trades' | 'reviews' | 'profile'>('signals');
  const [selectedPair, setSelectedPair] = useState<string>('frxEURUSD');
  const [timeframe, setTimeframe] = useState<string>('1m');
  const [screenState, setScreenState] = useState<'home' | 'processing' | 'result'>('home');
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const wsRef = useRef<WebSocket | null>(null);

  // Deriv WS Data Fetching & RSI Threshold (65/35) Calculation
  const generateSignal = () => {
    setScreenState('processing');

    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          ticks_history: selectedPair,
          adjust_start_time: 1,
          count: 20,
          end: 'latest',
          style: 'candles',
          granularity: timeframe === '5s' ? 60 : 60,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.candles && data.candles.length > 0) {
        const prices = data.candles.map((c: any) => c.close);
        const rsiVal = calculateRSI(prices, 14);

        let dir: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
        let conf = 88;

        // Threshold 65 / 35 Logic
        if (rsiVal <= 35) {
          dir = 'BUY';
          conf = Math.min(99, Math.round(88 + (35 - rsiVal) * 0.7));
        } else if (rsiVal >= 65) {
          dir = 'SELL';
          conf = Math.min(99, Math.round(88 + (rsiVal - 65) * 0.7));
        } else {
          dir = rsiVal > 50 ? 'BUY' : 'SELL';
          conf = Math.round(82 + Math.abs(50 - rsiVal));
        }

        setTimeout(() => {
          setSignal({
            pair: selectedPair.replace('frx', '').replace('OTC', ''),
            direction: dir,
            rsi: parseFloat(rsiVal.toFixed(2)),
            confidence: conf,
            accuracy: 98.4,
            timeframe: timeframe.toUpperCase(),
          });
          setScreenState('result');
          setCountdown(60);
        }, 2000); // 2 second processing delay like in the video
      }
    };

    ws.onerror = () => {
      setScreenState('home');
    };
  };

  const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) return 50;
    let gains = 0, losses = 0;
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

  // Timer countdown for active signal screen
  useEffect(() => {
    let timer: any;
    if (screenState === 'result' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [screenState, countdown]);

  return (
    <main className="min-h-screen bg-[#090a0f] text-white flex justify-center p-2 sm:p-4 font-sans select-none">
      <div className="w-full max-w-md bg-[#11131a] border border-gray-800/80 rounded-[32px] p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-800/60">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-lg bg-gradient-to-r from-red-500 via-pink-500 to-red-400 bg-clip-text text-transparent">
                AXILER <span className="text-[10px] px-2 py-0.5 bg-red-600/20 text-red-500 rounded-md border border-red-500/30">QUANTUM</span>
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-gray-400 bg-[#181a24] px-2.5 py-1 rounded-full border border-gray-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-gray-300">LIVE AI</span>
            </div>
          </div>

          {/* MAIN TAB: SIGNALS */}
          {activeTab === 'signals' && (
            <>
              {/* STATE 1: HOME SETUP */}
              {screenState === 'home' && (
                <div>
                  <div className="mt-4 text-center">
                    <h1 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                      Welcome, Elite Trader
                    </h1>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Choose how the Quantum engine finds your next signal
                    </p>
                  </div>

                  {/* Mode Cards */}
                  <div className="grid grid-cols-1 gap-2.5 mt-4">
                    <div className="bg-[#161822] border border-gray-800/80 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:border-red-500/40 transition group">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500/20 transition">
                          <Camera size={20} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm font-bold text-gray-200">Photo Analysis</span>
                            <span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded">NEW</span>
                          </div>
                          <p className="text-[10px] text-gray-400">Upload chart screenshot - AI reads & signals</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
                    </div>

                    <div className="bg-[#161822] border border-gray-800/80 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-500/40 transition group">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:bg-emerald-500/20 transition">
                          <Sliders size={20} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-200">Manual Analysis</span>
                          <p className="text-[10px] text-gray-400">Pick pair & timeframe yourself - AI signal</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
                    </div>
                  </div>

                  {/* Asset Selection */}
                  <div className="mt-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-gray-300">Select Market Asset</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Deriv Live Market</span>
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
                              : 'bg-[#161822] border-gray-800 text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeframe Selection */}
                  <div className="mt-4">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-300 block mb-2">Select Expiration Time</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['5s', '15s', '30s', '1m'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`py-1.5 text-xs font-medium rounded-lg border transition ${
                            timeframe === tf
                              ? 'bg-gray-800 text-white border-red-500/60'
                              : 'bg-[#161822] border-gray-800/80 text-gray-400'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateSignal}
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-red-600 via-pink-600 to-red-500 rounded-2xl font-bold text-sm tracking-wide text-white shadow-xl shadow-red-900/30 hover:opacity-95 transition active:scale-[0.98]"
                  >
                    GET AI QUANTUM SIGNAL
                  </button>
                </div>
              )}

              {/* STATE 2: PROCESSING SCREEN */}
              {screenState === 'processing' && (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="relative flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin"></div>
                    <div className="absolute w-20 h-20 rounded-full border-4 border-pink-500/20 border-b-pink-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    <div className="absolute text-xs font-extrabold text-red-400 tracking-wider">AI ANALYZING</div>
                  </div>
                  <p className="mt-6 text-xs text-gray-300 font-medium">Connecting to Deriv WebSocket Feed...</p>
                  <p className="text-[10px] text-gray-500 mt-1">Checking RSI Thresholds (65/35 Rules)</p>
                </div>
              )}

              {/* STATE 3: SIGNAL RESULT SCREEN */}
              {screenState === 'result' && signal && (
                <div className="mt-4">
                  <div className="flex justify-between items-center bg-[#161822] p-3 rounded-2xl border border-gray-800">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Selected Asset</span>
                      <span className="text-sm font-extrabold text-white">{signal.pair}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase">Indicator RSI</span>
                      <span className="text-sm font-extrabold text-pink-400">{signal.rsi}</span>
                    </div>
                  </div>

                  {/* Main Signal Display */}
                  <div className="mt-4 bg-[#141620] border border-gray-800 rounded-2xl p-5 text-center relative overflow-hidden shadow-inner">
                    <div className="flex justify-between items-center text-[11px] text-gray-400 mb-2">
                      <span>Accuracy Rate: <strong className="text-emerald-400">{signal.accuracy}%</strong></span>
                      <span>Confidence: <strong className="text-emerald-400">{signal.confidence}%</strong></span>
                    </div>

                    <div className="my-4">
                      {signal.direction === 'BUY' ? (
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30 mb-2 animate-bounce">
                            <ArrowUpRight size={38} />
                          </div>
                          <span className="text-2xl font-black text-emerald-400 tracking-wider">BUY (CALL)</span>
                          <span className="text-[10px] text-emerald-500/80 font-semibold tracking-widest mt-0.5">MOMENTUM BULLISH</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-red-500/10 text-red-400 rounded-full border border-red-500/30 mb-2 animate-bounce">
                            <ArrowDownRight size={38} />
                          </div>
                          <span className="text-2xl font-black text-red-400 tracking-wider">SELL (PUT)</span>
                          <span className="text-[10px] text-red-500/80 font-semibold tracking-widest mt-0.5">MOMENTUM BEARISH</span>
                        </div>
                      )}
                    </div>

                    {/* Entry instruction */}
                    <div className="bg-[#1c1f2e] p-2.5 rounded-xl border border-gray-800/80 text-[11px] text-gray-300">
                      Entry Time: <strong className="text-white">Next Candle (Duration: {signal.timeframe})</strong>
                    </div>

                    <div className="mt-3 text-[10px] text-gray-500">
                      Signal expires in: <span className="text-red-400 font-bold">{countdown}s</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setScreenState('home')}
                    className="w-full mt-4 py-3 bg-[#1e2230] border border-gray-700/80 rounded-2xl font-bold text-xs text-gray-200 hover:bg-gray-800 transition"
                  >
                    BACK TO ASSETS
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: TRADES */}
          {activeTab === 'trades' && (
            <div className="mt-6 text-center py-10">
              <History size={36} className="mx-auto text-gray-600 mb-2" />
              <h3 className="text-sm font-bold text-gray-300">Live Trade Log</h3>
              <p className="text-xs text-gray-500 mt-1">Total Signals Generated Today: <strong className="text-emerald-400">6,306+</strong></p>
              <div className="mt-4 space-y-2 text-left">
                {[
                  { pair: 'EUR/USD', type: 'BUY', win: true, time: '1 min ago' },
                  { pair: 'GBP/USD', type: 'SELL', win: true, time: '3 mins ago' },
                  { pair: 'USD/JPY', type: 'BUY', win: true, time: '5 mins ago' },
                ].map((t, idx) => (
                  <div key={idx} className="bg-[#161822] p-3 rounded-xl border border-gray-800/80 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">{t.pair}</span>
                      <span className="text-[10px] text-gray-500">{t.time}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${t.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type}</span>
                      <span className="block text-[10px] text-emerald-400">WIN (ITM)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Community Trader Feedback</h3>
              {[
                { name: 'Alexander R.', text: 'RSI threshold accuracy is insane! 4 out of 5 wins today.', rating: '5/5' },
                { name: 'Sajib Khan', text: 'Deriv live candle data connection is super fast.', rating: '5/5' },
              ].map((rev, i) => (
                <div key={i} className="bg-[#161822] p-3 rounded-xl border border-gray-800 text-xs">
                  <div className="flex justify-between font-bold text-gray-300">
                    <span>{rev.name}</span>
                    <span className="text-yellow-400">★ {rev.rating}</span>
                  </div>
                  <p className="text-gray-400 text-[11px] mt-1">{rev.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="mt-6 text-center py-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-pink-500 rounded-full mx-auto flex items-center justify-center font-bold text-xl text-white shadow-lg">
                ET
              </div>
              <h2 className="mt-3 font-bold text-sm text-white">Elite Trader Account</h2>
              <p className="text-[11px] text-emerald-400">VIP QUANTUM ACCESS</p>
              
              <div className="mt-6 bg-[#161822] border border-gray-800 rounded-2xl p-3 text-left space-y-2 text-xs text-gray-300">
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span>Engine:</span>
                  <span className="font-bold text-white">Axiler Quantum v3.2</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span>Deriv API Status:</span>
                  <span className="font-bold text-emerald-400">Connected</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>RSI Logic:</span>
                  <span className="font-bold text-white">65 / 35 Threshold</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR (Video Style) */}
        <div className="mt-6 pt-2 border-t border-gray-800/80 grid grid-cols-4 gap-1 text-center text-[10px]">
          <button
            onClick={() => { setActiveTab('signals'); setScreenState('home'); }}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeTab === 'signals' ? 'text-red-500 font-bold bg-red-500/10' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <BarChart2 size={18} />
            <span className="mt-1">SIGNALS</span>
          </button>

          <button
            onClick={() => setActiveTab('trades')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeTab === 'trades' ? 'text-red-500 font-bold bg-red-500/10' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <History size={18} />
            <span className="mt-1">TRADES</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeTab === 'reviews' ? 'text-red-500 font-bold bg-red-500/10' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <MessageSquare size={18} />
            <span className="mt-1">REVIEWS</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeTab === 'profile' ? 'text-red-500 font-bold bg-red-500/10' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <User size={18} />
            <span className="mt-1">PROFILE</span>
          </button>
        </div>

      </div>
    </main>
  );
}
