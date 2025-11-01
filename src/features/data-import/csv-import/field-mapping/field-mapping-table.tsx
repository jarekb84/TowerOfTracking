import { CheckCircle, XCircle } from 'lucide-react';
import type { FieldMapping } from '@/shared/types/game-run.types';

interface FieldMappingTableProps {
  mappedFields: FieldMapping[];
}

export function FieldMappingTable({ mappedFields }: FieldMappingTableProps) {
  return (
    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b border-gray-300 sticky top-0">
          <tr>
            <th className="text-left p-3 font-semibold text-gray-900">CSV Header</th>
            <th className="text-left p-3 font-semibold text-gray-900">Mapped Field</th>
            <th className="text-center p-3 font-semibold text-gray-900">Status</th>
          </tr>
        </thead>
        <tbody>
          {mappedFields.map((field, index) => (
            <tr key={index} className={`border-t border-gray-200 hover:bg-gray-50 transition-colors ${
              field.supported
                ? 'bg-green-50 hover:bg-green-100'
                : 'bg-orange-50 hover:bg-orange-100'
            }`}>
              <td className="p-3 font-mono text-gray-900 font-medium">{field.csvHeader}</td>
              <td className="p-3 font-mono text-gray-700">{field.camelCase}</td>
              <td className="p-3 text-center">
                {field.supported ? (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-orange-600" />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
