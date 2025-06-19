
import React from 'react';
import { Home } from 'lucide-react';

const Header: React.FC = () => (
  <div className="bg-white shadow-sm border-b px-6 py-4">
    <div className="max-w-4xl mx-auto flex items-center gap-3">
      <div className="bg-blue-600 p-2 rounded-lg">
        <Home className="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Real Estate Assistant</h1>
        <p className="text-sm text-gray-600">Find your perfect home</p>
      </div>
    </div>
  </div>
);

export default Header;