import { useState, useEffect, useRef, FormEventHandler } from "react";
import { Search } from "lucide-react";
import { Link, useForm } from "@inertiajs/react";
import { Product } from "@/types";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";

type SearchBarProps = {
  keyword?: string;
};

export default function SearchBar({ keyword = "" }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(keyword);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const SearchForm = useForm({
    keyword: "",
    category_id: "",
    max_price: "",
    sort_by: "",
  });

  const fetchSuggestions = (searchTerm: string) => {
    if (!searchTerm) {
      setSuggestions([]);
      return;
    }

    fetch(`/search-suggestions?keyword=${encodeURIComponent(searchTerm)}`)
      .then((res) => res.json())
      .then((res: { data: Product[] }) => {
        setSuggestions(res.data);
      })
      .catch(() => setSuggestions([]));
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    SearchForm.setData("keyword", value);

    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    setDebounceTimeout(timeout);
  };

  const onSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    setSuggestions([]);
    SearchForm.get("/shop");
  };

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="">
            {/* Button to open search popup */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 rounded-full"
        aria-label="Open search"
      >
        <Search size={28} />
        <span className="hidden sm:inline">Search</span>
      </button>

      {/* Popup Overlay */}
      {open && (
       <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-[1000] flex justify-center items-start pt-5 px-4">
    <div ref={containerRef} className= "bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 relative z-[1001]">
            <div className="relative">
              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={onInputChange}
                  placeholder="Search products..."
                  className="flex-grow border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="p-3 text-purple-600 hover:bg-purple-100 rounded-full"
                  aria-label="Submit search"
                >
                  <Search size={20} />
                </button>
                {/* <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-2 p-3 text-gray-500 hover:text-gray-700"
                  aria-label="Close search popup"
                >
                  ✕
                </button> */}
              </form>

              {/* Render product suggestions */}
              {suggestions.length > 0 && (
                <ul
                  className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-auto rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-opacity duration-300"
                  role="listbox"
                >
                  {suggestions.map((product) => (
                    <li
                      key={product.id}
                      className="cursor-pointer px-4 py-2 hover:bg-indigo-100 text-gray-800"
                      role="option"
                      tabIndex={-1}
                    >
                      <Link
                        href={`/shop?keyword=${encodeURIComponent(product.title)}`}
                        onClick={() => setSuggestions([])}
                        className="flex gap-3 items-center"
                      >
                        <img
                          src={product.image || "/placeholder.jpg"}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <div className="font-semibold">{product.title}</div>
                         <div dangerouslySetInnerHTML={{ __html: product.description }} className="line-clamp-2" />
                          <div className="text-sm text-gray-600"><CurrencyFormatter amount={product.price} currency="AUD"/></div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
