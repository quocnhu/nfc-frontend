"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Input, Select, Space } from "antd";
import { countryCodes, type CountryCode } from "@/lib/countryCodes";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function PhoneInput({ value = "", onChange, placeholder = "Enter phone number" }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    countryCodes.find(c => c.code === "VN") || countryCodes[0]
  );
  const [phoneNumber, setPhoneNumber] = useState("");

  // Parse the value prop to extract country code and phone number
  useEffect(() => {
    if (value) {
      // Find matching country by dial code
      const matchedCountry = countryCodes.find(c => value.startsWith(c.dialCode));
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setPhoneNumber(value.substring(matchedCountry.dialCode.length));
      } else {
        // If no match, use default and set the whole value as phone number
        setPhoneNumber(value.replace(/\D/g, ""));
      }
    }
  }, [value]);

  const handleCountryChange = (countryCode: string) => {
    const country = countryCodes.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      if (onChange) {
        onChange(`${country.dialCode}${phoneNumber}`);
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/\D/g, "");
    setPhoneNumber(num);
    if (onChange) {
      onChange(`${selectedCountry.dialCode}${num}`);
    }
  };

  const countryOptions = useMemo(() => {
    return countryCodes.map(country => ({
      value: country.code,
      label: (
        <Space>
          <span style={{ fontSize: 18 }}>{country.flag}</span>
          <span>{country.name}</span>
          <span style={{ color: "#999" }}>({country.dialCode})</span>
        </Space>
      ),
    }));
  }, []);

  return (
    <Space.Compact style={{ width: "100%" }}>
      <Select
        value={selectedCountry.code}
        onChange={handleCountryChange}
        style={{ width: 200 }}
        showSearch
        optionFilterProp="label"
        options={countryOptions}
      />
      <Input
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        style={{ flex: 1 }}
      />
    </Space.Compact>
  );
}
