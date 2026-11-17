"use client";

import Tourguide1Template, { Tourguide1TemplateProps } from "./Tourguide1Template";

export default function ItDevopsTemplate({ hideModeSwitch = false, ...props }: Tourguide1TemplateProps) {
  return <Tourguide1Template {...props} hideModeSwitch={hideModeSwitch} />;
}
