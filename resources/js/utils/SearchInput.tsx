import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { Product } from '@/types';

const SearchInput = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await axios.get('/search-suggestions', {
          params: { keyword: query },
        });
        setSuggestions(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const delayDebounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (product: Product) => {
    setShowDropdown(false);
    setQuery('');
    router.visit(route('products.index'), {
      data: {
        keyword: product.title,
        department: product.department.slug,
      },
    });
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        type="text"
        className="w-full px-4 py-2 border rounded-md"
        placeholder="Search products..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // small delay to allow clicking
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 bg-white shadow-md rounded-md z-10 mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelect(product)}
            >
              <img src={product.image} alt={product.title} className="w-10 h-10 object-cover rounded" />
              <div>
                <p className="text-sm font-medium">{product.title}</p>
                <p className="text-xs text-gray-500">${product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
