import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingIndicator: React.FC = () => (
  <div className="flex items-center gap-2 text-gray-600">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span className="text-sm">Thinking...</span>
  </div>
);

export default LoadingIndicator;