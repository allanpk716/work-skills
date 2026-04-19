import { useState } from 'react';
import Calculator from './components/Calculator';
import History from './components/History';
import BatchCalc from './components/BatchCalc';

type Tab = 'calculator' | 'history' | 'batch';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calculator');

  return (
    <div className="container">
      <h1>Go+JS Calculator</h1>
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          Calculator
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`tab ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => setActiveTab('batch')}
        >
          Batch
        </button>
      </div>
      {activeTab === 'calculator' && <Calculator />}
      {activeTab === 'history' && <History />}
      {activeTab === 'batch' && <BatchCalc />}
    </div>
  );
}
