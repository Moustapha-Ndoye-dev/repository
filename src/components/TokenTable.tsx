import React from 'react';

interface TokenTableProps {
  tokens: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TokenTable: React.FC<TokenTableProps> = ({ tokens, searchQuery, onSearchChange }) => {
  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Rechercher un token"
        className="mb-4 p-2 border rounded"
      />
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border">Token</th>
          </tr>
        </thead>
        <tbody>
          {tokens.length > 0 ? (
            tokens.map((token, index) => (
              <tr key={index}>
                <td className="border p-2">{token}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border p-2 text-center" colSpan={1}>
                No tokens found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TokenTable;
