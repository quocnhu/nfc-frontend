"use client";

import React from "react";
import ItDevopsTemplate from "./ItDevopsTemplate";
import { TemplateProps } from "./template-utils";

/**
 * Tour-guide template converted from template/card.html.
 * Reuses the shared guide/dev renderer but locks it to tour-guide mode and
 * hides the mode switch, so the card behaves as a standalone guide template.
 */
export default function Tourguide1Template({ user, items }: TemplateProps) {
  return <ItDevopsTemplate user={user} items={items} initialMode="guide" hideModeSwitch />;
}
