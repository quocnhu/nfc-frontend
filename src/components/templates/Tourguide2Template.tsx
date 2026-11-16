"use client";

import React from "react";
import ItDevopsTemplate from "./ItDevopsTemplate";
import { TemplateProps } from "./template-utils";

/**
 * Tour-guide template converted from template/tourguide2.html.
 * Reuses the shared guide renderer with sharing items and responsive layout,
 * locked to tour-guide mode without the IT DevOps mode switch.
 */
export default function Tourguide2Template({ user, items }: TemplateProps) {
  return <ItDevopsTemplate user={user} items={items} initialMode="guide" hideModeSwitch />;
}
