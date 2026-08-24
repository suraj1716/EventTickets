import { Link } from "@inertiajs/react";
import React from "react";

type ShippingAddress = {
  id: string;
  full_name: string;
  phone: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  attachment_path?: string;
};

type Props = {
  shippingAddresses: ShippingAddress[];
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string) => void;
};

function ShippingAddressSelector({
  shippingAddresses,
  selectedAddressId,
  setSelectedAddressId,
}: Props) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
  <p className="text-lg font-semibold">Choose a shipping address</p>

  <Link
    href={route("profile.edit")}
    className="w-full sm:w-auto inline-block px-3 py-1.5 text-sm font-semibold text-white bg-purple-700 rounded hover:bg-blue-700 text-center"
  >
    + Add New Address
  </Link>
</div>


      {shippingAddresses.map((address) => (
        <label
          key={address.id}
          className="border rounded-md p-4 mb-3 flex cursor-pointer hover:border-blue-500"
        >
          <input
            type="radio"
            name="shipping_address_id"
            value={address.id}
            checked={selectedAddressId === address.id}
            onChange={() => setSelectedAddressId(address.id)}
            className="mt-1"
            required
          />
          <div className="ml-4">
            <p className="font-semibold">
              {address.full_name}
              {address.is_default && (
                <span className="text-green-600 text-sm ml-1">(Default)</span>
              )}
            </p>
            <p>
              {address.address_line1}
              {address.address_line2 && `, ${address.address_line2}`},{" "}
              {address.city}, {address.state} {address.postal_code}
            </p>
            <p>{address.country}</p>
            <p className="text-sm text-gray-600">Phone: {address.phone}</p>
          </div>
        </label>
      ))}
    </div>
  );
}

export default ShippingAddressSelector;
