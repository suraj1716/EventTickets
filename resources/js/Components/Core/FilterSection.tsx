import React from 'react';

interface FilterSectionProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  brand: string;
  setBrand: React.Dispatch<React.SetStateAction<string>>;
  department: string;
  setDepartment: React.Dispatch<React.SetStateAction<string>>;
  priceRange: [number, number];
  setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  handleBrandChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleDepartmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  DepartmentOnlyData: string[];
  brandOnlyData: string[];
}

const FilterSection: React.FC<FilterSectionProps> = ({
  search,
  setSearch,
  brand,
  setBrand,
  department,
  setDepartment,
  priceRange,
  setPriceRange,
  handleBrandChange,
  handleDepartmentChange,
  DepartmentOnlyData,
  brandOnlyData
}) => {
  return (
    <div className="bg-gray-100 mt-10 p-4 rounded-md h-max hidden md:block">
      <input
        type="text"
        placeholder="Search.."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-white p-2 rounded-md border-gray-400 border-2"
      />

      {/* Department Section */}
      <h1 className="mt-5 font-semibold text-xl">Department</h1>
      <div className="flex flex-col gap-2 mt-3">
        {DepartmentOnlyData.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="checkbox"
              name={item}
              checked={department === item}
              value={item}
              onChange={handleDepartmentChange}
            />
            <button className="cursor-pointer uppercase">{item}</button>
          </div>
        ))}
      </div>

      {/* Category Section */}
      <h1 className="mt-5 font-semibold text-xl mb-3">Category</h1>
      <select
        className="bg-white w-full p-2 border-gray-200 border-2 rounded-md"
        value={brand}
        onChange={handleBrandChange}
      >
        {brandOnlyData.map((item, index) => (
          <option key={index} value={item}>
            {item.toUpperCase()}
          </option>
        ))}
      </select>

      {/* Price Range */}
      <h1 className="mt-5 font-semibold text-xl mb-3">Price Range</h1>
      <div className="flex flex-col gap-2">
        <label>
          Price Range: ${priceRange[0]} - ${priceRange[1]}
        </label>
        <input
          type="range"
          min="0"
          max="5000"
          value={priceRange[1]}
          onChange={(e) =>
            setPriceRange([priceRange[0], Number(e.target.value)])
          }
          className="transition-all"
        />
      </div>

      {/* Reset Filters */}
      <button
        className="bg-red-500 text-white rounded-md px-3 py-1 mt-5 cursor-pointer"
        onClick={() => {
          setSearch('');
          setDepartment('All');
          setBrand('All');
          setPriceRange([0, 5000]);
        }}
      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterSection;
