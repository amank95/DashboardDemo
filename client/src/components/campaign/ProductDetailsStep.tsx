import React, { useState, useRef, useEffect } from 'react';
import { CampaignFormData, Product } from '../../types';

interface ProductDetailsStepProps {
    formData: CampaignFormData;
    updateFormData: (field: string, value: any) => void;
}

// Mock Data
const AVAILABLE_PRODUCTS: Product[] = [
    { id: 'p1', name: 'Nike Air Max', variants: 3, brand: 'Nike', category: 'Shoes' },
    { id: 'p2', name: 'Adidas Ultraboost', variants: 5, brand: 'Adidas', category: 'Shoes' },
    { id: 'p3', name: 'Puma T-Shirt', variants: 4, brand: 'Puma', category: 'Apparel' },
    { id: 'p4', name: 'Nike Hoodie', variants: 2, brand: 'Nike', category: 'Apparel' },
    { id: 'p5', name: 'Reebok Running Shoes', variants: 3, brand: 'Reebok', category: 'Shoes' },
    { id: 'p6', name: 'Sony Headphones', variants: 1, brand: 'Sony', category: 'Electronics' },
    { id: 'p7', name: 'Samsung Galaxy S23', variants: 2, brand: 'Samsung', category: 'Electronics' },
    { id: 'p8', name: 'Apple iPhone 15', variants: 3, brand: 'Apple', category: 'Electronics' },
];

const ProductDetailsStep: React.FC<ProductDetailsStepProps> = ({ formData, updateFormData }) => {
    // Dropdown States
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    // Right Pane Search State
    const [selectedListSearch, setSelectedListSearch] = useState('');

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter available products for dropdown
    const filteredAvailable = AVAILABLE_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    // Filter selected products for right pane list
    const selectedProducts = formData.selectedProducts || [];
    const filteredSelected = selectedProducts.filter(p =>
        p.name.toLowerCase().includes(selectedListSearch.toLowerCase())
    );

    const isSelected = (productId: string) => {
        return selectedProducts.some(p => p.id === productId);
    };

    const toggleProduct = (product: Product) => {
        if (isSelected(product.id)) {
            updateFormData('selectedProducts', selectedProducts.filter(p => p.id !== product.id));
        } else {
            updateFormData('selectedProducts', [...selectedProducts, product]);
        }
    };

    const toggleSelectAll = () => {
        // If all filtered are selected, deselect them. Otherwise, select them.
        const allFilteredSelected = filteredAvailable.every(p => isSelected(p.id));

        if (allFilteredSelected) {
            // Remove filtered available from selected
            const idsToRemove = filteredAvailable.map(p => p.id);
            updateFormData('selectedProducts', selectedProducts.filter(p => !idsToRemove.includes(p.id)));
        } else {
            // Add unselected filtered available to selected
            const newProducts = filteredAvailable.filter(p => !isSelected(p.id));
            updateFormData('selectedProducts', [...selectedProducts, ...newProducts]);
        }
    };

    return (
        <div className="animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select campaign products</h2>
            <p className="text-sm text-gray-500 mb-6">Choose your campaign products using filters, search, or bulk upload</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Selection Tools */}
                <div className="space-y-6">
                    {/* Manual Entry with Dropdown */}
                    <div className="bg-white p-5 border border-gray-200 rounded-lg relative" ref={dropdownRef}>
                        <h3 className="font-medium text-gray-900 mb-1">Enter products manually</h3>
                        <p className="text-xs text-gray-500 mb-3">Find and select your products manually</p>

                        <div className="flex space-x-2 relative">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setDropdownOpen(true);
                                    }}
                                    onFocus={() => setDropdownOpen(true)}
                                    placeholder="Select products"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none pr-8"
                                />
                                <svg className={`w-4 h-4 text-gray-400 absolute right-3 top-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            <button
                                onClick={() => { }}
                                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors whitespace-nowrap"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Bulk Upload
                            </button>
                        </div>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto mx-5 mb-5">
                                {filteredAvailable.length > 0 ? (
                                    <>
                                        <div
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3 border-b border-gray-100"
                                            onClick={toggleSelectAll}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={filteredAvailable.length > 0 && filteredAvailable.every(p => isSelected(p.id))}
                                                readOnly
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 pointer-events-none"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Select All</span>
                                        </div>
                                        {filteredAvailable.map(product => (
                                            <div
                                                key={product.id}
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                                                onClick={() => toggleProduct(product)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected(product.id)}
                                                    readOnly
                                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 pointer-events-none"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-700">{product.name}</span>
                                                    <span className="text-xs text-gray-500">{product.category} • {product.brand}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">No products found</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-5 border border-gray-200 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-1">Choose products</h3>
                        <p className="text-xs text-gray-500 mb-3">Select products from the brand and category filters</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Select brands</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 focus:ring-2 focus:ring-green-500 outline-none appearance-none bg-white">
                                    <option>Select from brands</option>
                                    <option>Nike</option>
                                    <option>Adidas</option>
                                    <option>Puma</option>
                                    <option>Reebok</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Select categories</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 focus:ring-2 focus:ring-green-500 outline-none appearance-none bg-white">
                                    <option>Select from categories</option>
                                    <option>Shoes</option>
                                    <option>Apparel</option>
                                    <option>Electronics</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Selected list */}
                <div className="bg-white border border-gray-200 rounded-lg flex flex-col h-full min-h-[400px]">
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="font-medium text-gray-900">Selected products</h3>
                        <p className="text-xs text-gray-500 mb-3">Your target products will appear here</p>

                        {/* Search within selected */}
                        {selectedProducts.length > 0 && (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search amongst the added products"
                                    value={selectedListSearch}
                                    onChange={(e) => setSelectedListSearch(e.target.value)}
                                    className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 bg-gray-50"
                                />
                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-4 bg-gray-50 overflow-y-auto max-h-[500px]">
                        {filteredSelected.length > 0 ? (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 w-8">
                                                <input type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded" />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                                            <th className="px-4 py-3 relative"><span className="sr-only">Remove</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredSelected.map((product) => (
                                            <tr key={product.id}>
                                                <td className="px-4 py-3">
                                                    <input type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded" checked readOnly />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 flex items-center space-x-3">
                                                    {product.image && <img src={product.image} alt={product.name} className="w-8 h-8 rounded object-cover" />}
                                                    <span>{product.name}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{product.variants}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => updateFormData('selectedProducts', selectedProducts.filter(p => p.id !== product.id))} className="text-red-400 hover:text-red-600">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                {selectedProducts.length > 0 ? (
                                    <div className="text-gray-500">No products match your search</div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-1">No products yet!</h4>
                                        <p className="text-sm text-gray-500 max-w-xs">Select brand and category filters to add products or manually select IDs below</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsStep;
