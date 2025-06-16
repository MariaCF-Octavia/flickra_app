import React from 'react';
import { Link } from 'react-router-dom';

const ChoosePlan = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h2 className="text-3xl mb-6 text-center">Select Your Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <Link 
          to="/signup?plan=basic"
          className="bg-gray-800 p-6 rounded-lg border-2 border-purple-500 hover:border-purple-600 transition-all"
        >
          <h3 className="text-2xl font-bold mb-4">Basic</h3>
          <p className="text-4xl font-bold mb-4">$239<span className="text-lg">/month</span></p>
          <ul className="mb-6">
            <li className="mb-2">Generate up to 10 content/month</li>
            <li className="mb-2">Basic templates</li>
            <li className="mb-2">Limited editing tools</li>
          </ul>
        </Link>
        {/* Add similar blocks for Premium and Pro */}
      </div>
    </div>
  );
};

export default ChoosePlan;