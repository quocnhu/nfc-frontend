"use client";

import React from "react";
import ItDevopsTemplate from "./ItDevopsTemplate";
import { TemplateProps } from "./template-utils";

/**
 * IT/DevOps-only variant of the IT & Tourism template.
 * Reuses the original renderer but locks it to the DevOps mode and hides the
 * mode switch so it behaves as a standalone template.
 */
export default function ItTemplate({ user, items }: TemplateProps) {
  return <ItDevopsTemplate user={user} items={items} initialMode="dev" hideModeSwitch />;
}
